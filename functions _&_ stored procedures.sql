--
-- PostgreSQL database dump
--

-- Dumped from database version 16.2
-- Dumped by pg_dump version 16.2

-- Started on 2024-08-12 01:59:05

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 256 (class 1255 OID 17267)
-- Name: add_favourite(integer, integer); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.add_favourite(IN p_member_id integer, IN p_product_id integer)
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Check if the product is already in the member's favourites list
    IF EXISTS (
        SELECT 1 
        FROM favourite
        WHERE member_id = p_member_id
        AND product_id = p_product_id
    ) THEN
        RAISE NOTICE 'Product % is already in the favourites list for member %', p_product_id, p_member_id;
        RETURN;
    END IF;

    -- Insert the new favourite
    INSERT INTO favourite (member_id, product_id)
    VALUES (p_member_id, p_product_id);

    RAISE NOTICE 'Product % has been added to the favourites list for member %', p_product_id, p_member_id;
END;
$$;


--
-- TOC entry 260 (class 1255 OID 17257)
-- Name: compute_customer_lifetime_value(); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.compute_customer_lifetime_value()
    LANGUAGE plpgsql
    AS $$
DECLARE
    member_record RECORD;
    total_spent NUMERIC;
    total_orders INTEGER;
    first_order_date DATE;
    last_order_date DATE;
    customer_lifetime NUMERIC;
    average_purchase_value NUMERIC;
    purchase_frequency NUMERIC;
    retention_period CONSTANT NUMERIC := 2; -- Retention period in years
BEGIN
    -- Loop through each member
    FOR member_record IN
        SELECT id
        FROM member
    LOOP
        -- Get the first and last order date for the member
        SELECT 
            MIN(so.order_datetime), 
            MAX(so.order_datetime)
        INTO first_order_date, last_order_date
        FROM sale_order so
        WHERE so.member_id = member_record.id
        AND so.status = 'COMPLETED';

        -- Check if the member has orders
        IF first_order_date IS NULL OR last_order_date IS NULL THEN
            -- Set CLV to NULL if no orders or only one order
            UPDATE member
            SET clv = NULL
            WHERE id = member_record.id;
        ELSE
            -- Calculate the customer lifetime in years
            customer_lifetime := EXTRACT(YEAR FROM AGE(last_order_date, first_order_date)) + 
                                 EXTRACT(MONTH FROM AGE(last_order_date, first_order_date)) / 12.0 +
                                 EXTRACT(DAY FROM AGE(last_order_date, first_order_date)) / 365.25;

            -- Calculate the total amount spent and total number of orders
            SELECT 
                SUM(soi.quantity * p.unit_price), 
                COUNT(DISTINCT so.id)
            INTO total_spent, total_orders
            FROM sale_order so
            JOIN sale_order_item soi ON so.id = soi.sale_order_id
            JOIN product p ON soi.product_id = p.id
            WHERE so.member_id = member_record.id
            AND so.status = 'COMPLETED';

            -- Calculate Average Purchase Value
            average_purchase_value := total_spent / total_orders;

            -- Calculate Purchase Frequency
            IF customer_lifetime > 0 THEN
                purchase_frequency := total_orders / customer_lifetime;
            ELSE
                purchase_frequency := total_orders; -- Default to total orders if lifetime is zero
            END IF;

            -- Calculate Customer Lifetime Value
            UPDATE member
            SET clv = average_purchase_value * purchase_frequency * retention_period
            WHERE id = member_record.id;
        END IF;
    END LOOP;
END;
$$;


--
-- TOC entry 257 (class 1255 OID 17255)
-- Name: compute_running_total_spending(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.compute_running_total_spending() RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    member_record RECORD;
    current_date DATE := CURRENT_DATE;
    six_months_ago DATE := current_date - INTERVAL '6 months';
BEGIN
    -- Loop through each member
    FOR member_record IN
        SELECT id, last_login_on
        FROM member
    LOOP
        -- Check if the member is recently active
        IF member_record.last_login_on >= six_months_ago THEN
            -- Calculate the total spending of completed orders
            UPDATE member
            SET running_total_spending = (
                SELECT COALESCE(SUM(oi.quantity * p.unit_price), 0)
                FROM sale_order so
                JOIN sale_order_item oi ON so.id = oi.sale_order_id
                JOIN product p ON oi.product_id = p.id
                WHERE so.member_id = member_record.id
                AND so.status = 'COMPLETED'
            )
            WHERE member.id = member_record.id;
        ELSE
            -- Set running_total_spending to NULL for inactive members
            UPDATE member
            SET running_total_spending = NULL
            WHERE member.id = member_record.id;
        END IF;
    END LOOP;
END;
$$;


--
-- TOC entry 255 (class 1255 OID 17254)
-- Name: create_review(integer, integer, integer, integer, character varying, date); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.create_review(IN p_product_id integer, IN p_member_id integer, IN p_order_id integer, IN p_rating integer, IN p_review_text character varying, IN p_review_date date)
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_sale_order_item_id integer;
BEGIN
    -- Find the sale_order_item_id for the given product_id, member_id, and order_id
    SELECT soi.id INTO v_sale_order_item_id
    FROM sale_order_item soi
    JOIN sale_order so ON soi.sale_order_id = so.id
    WHERE soi.product_id = p_product_id
      AND so.member_id = p_member_id
      AND so.id = p_order_id
      AND so.status = 'COMPLETED'
    LIMIT 1;

    -- Check if the sale_order_item_id is found
    IF v_sale_order_item_id IS NULL THEN
        RAISE EXCEPTION 'No completed order found for this product, member, and order';
    END IF;

    -- Check if the sale order item has already been reviewed
    IF EXISTS (
        SELECT 1 
        FROM reviews r
        WHERE r.sale_order_item_id = v_sale_order_item_id
    ) THEN
        RAISE EXCEPTION 'This sale order item has already been reviewed';
    END IF;
    
    -- Insert the new review
    INSERT INTO reviews (sale_order_item_id, rating, review_text, review_date)
    VALUES (v_sale_order_item_id, p_rating, p_review_text, p_review_date);
END;
$$;


--
-- TOC entry 239 (class 1255 OID 17222)
-- Name: delete_review(integer); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.delete_review(IN p_review_id integer)
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Check if the review exists
    IF NOT EXISTS (SELECT * FROM reviews WHERE id = p_review_id) THEN
        RAISE EXCEPTION 'Review % does not exist', p_review_id;
    END IF;
    
    -- Delete the review
    DELETE FROM reviews WHERE id = p_review_id;
    
    -- Provide feedback
    RAISE NOTICE 'Review % has been deleted', p_review_id;

END;
$$;


--
-- TOC entry 259 (class 1255 OID 17258)
-- Name: get_age_group_spending(character varying, numeric, numeric); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_age_group_spending(p_gender character varying DEFAULT NULL::character varying, p_min_total_spending numeric DEFAULT 0, p_min_member_total_spending numeric DEFAULT 0) RETURNS TABLE(age_group character varying, total_spending numeric, num_of_members integer)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        CASE
            WHEN EXTRACT(YEAR FROM AGE(subquery.dob)) BETWEEN 18 AND 29 THEN '18-29'
            WHEN EXTRACT(YEAR FROM AGE(subquery.dob)) BETWEEN 30 AND 39 THEN '30-39'
            WHEN EXTRACT(YEAR FROM AGE(subquery.dob)) BETWEEN 40 AND 49 THEN '40-49'
            WHEN EXTRACT(YEAR FROM AGE(subquery.dob)) BETWEEN 50 AND 59 THEN '50-59'
            ELSE '60+'
        END::VARCHAR AS age_group,
        SUM(subquery.total_spending) AS total_spending,
        COUNT(*)::INTEGER AS num_of_members
    FROM (
        SELECT
            m.id,
            m.dob,
            SUM(soi.quantity * p.unit_price) AS total_spending
        FROM
            member m
            JOIN sale_order so ON m.id = so.member_id
            JOIN sale_order_item soi ON so.id = soi.sale_order_id
            JOIN product p ON soi.product_id = p.id
        WHERE
            (p_gender IS NULL OR m.gender = p_gender)
        GROUP BY
            m.id, m.dob
        HAVING
            SUM(soi.quantity * p.unit_price) >= p_min_member_total_spending
    ) subquery
    GROUP BY
        age_group
    HAVING
        SUM(subquery.total_spending) >= p_min_total_spending;
END;
$$;


--
-- TOC entry 254 (class 1255 OID 17253)
-- Name: get_all_reviews(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_all_reviews(p_member_id integer) RETURNS TABLE(review_id integer, sale_order_item_id integer, rating integer, review_text text, review_date date, product_name text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id AS review_id,
        r.sale_order_item_id,
        r.rating,
        r.review_text::text AS review_text, 
        r.review_date,
        p.name::text AS product_name
    FROM 
        reviews r
        JOIN sale_order_item soi ON r.sale_order_item_id = soi.id
        JOIN sale_order so ON soi.sale_order_id = so.id
        JOIN product p ON soi.product_id = p.id
    WHERE 
        so.member_id = p_member_id;
END;
$$;


--
-- TOC entry 258 (class 1255 OID 17268)
-- Name: get_favourites_by_member_id(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_favourites_by_member_id(p_member_id integer) RETURNS TABLE(id integer, member_id integer, product_id integer, added_date timestamp without time zone, product_name text, product_description text, product_unit_price numeric, product_image_url text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.id,
        f.member_id,
        f.product_id,
        f.added_date,
        p.name::text AS product_name,
        p.description::text AS product_description,
        p.unit_price AS product_unit_price,
        p.image_url::text AS product_image_url
    FROM 
        favourite f
        JOIN product p ON f.product_id = p.id
    WHERE 
        f.member_id = p_member_id;
END;
$$;


--
-- TOC entry 241 (class 1255 OID 17271)
-- Name: get_single_review(integer); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_single_review(review_id integer) RETURNS TABLE(id integer, sale_order_item_id integer, rating integer, review_text character varying, review_date date)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id,
        r.sale_order_item_id,
        r.rating,
        r.review_text,
        r.review_date
    FROM 
        reviews r
    WHERE 
        r.id = review_id;
END;
$$;


--
-- TOC entry 261 (class 1255 OID 31300)
-- Name: place_orders(integer); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.place_orders(IN member_id integer)
    LANGUAGE plpgsql
    AS $$
DECLARE
    cart_item RECORD;
    current_stock INT;
    order_id INT;
BEGIN
    -- Clear previous entries
    DELETE FROM temp_insufficient_items WHERE "memberId" = member_id;

    -- Create the sale order with status 'PACKING'
    INSERT INTO sale_order (member_id, order_datetime, status)
    VALUES (member_id, NOW(), 'PACKING')
    RETURNING id INTO order_id;

    -- Process each item in the cart
    FOR cart_item IN
        SELECT c."productId" AS product_id, c.quantity, p.stock_quantity, p.name
        FROM "Cart" c
        JOIN product p ON c."productId" = p.id
        WHERE c."memberId" = member_id
    LOOP
        current_stock := cart_item.stock_quantity;

        IF current_stock >= cart_item.quantity THEN
            -- Deduct the stock quantity
            UPDATE product
            SET stock_quantity = stock_quantity - cart_item.quantity
            WHERE id = cart_item.product_id;

            -- Create the sale order item details
            INSERT INTO sale_order_item (sale_order_id, product_id, quantity)
            VALUES (order_id, cart_item.product_id, cart_item.quantity);

            -- Remove item from the cart
            DELETE FROM "Cart"
            WHERE "Cart"."memberId" = member_id AND "Cart"."productId" = cart_item.product_id;
        ELSE
            -- Add item to the insufficient_items list
            INSERT INTO temp_insufficient_items ("memberId", "itemName")
            VALUES (member_id, cart_item.name);
        END IF;
    END LOOP;

    -- If no items were processed successfully, delete the sale order
    IF NOT EXISTS (
        SELECT 1
        FROM sale_order_item soi
        WHERE soi.sale_order_id = order_id
    ) THEN
        DELETE FROM sale_order
        WHERE sale_order.id = order_id;
    END IF;

    RETURN;
END;
$$;


--
-- TOC entry 240 (class 1255 OID 17270)
-- Name: remove_favourite(integer); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.remove_favourite(IN favourite_id integer)
    LANGUAGE plpgsql
    AS $$
BEGIN
    DELETE FROM favourite WHERE id = favourite_id;
END;
$$;


--
-- TOC entry 253 (class 1255 OID 17221)
-- Name: update_review(integer, integer, text); Type: PROCEDURE; Schema: public; Owner: -
--

CREATE PROCEDURE public.update_review(IN p_review_id integer, IN p_rating integer, IN p_review_text text)
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Check if the review does not exist
    IF NOT EXISTS (SELECT 1 FROM reviews WHERE id = p_review_id) THEN
        RAISE EXCEPTION 'Review % does not exist', p_review_id;
    END IF;
    
    -- Update the review
    UPDATE reviews 
    SET rating = p_rating, review_text = p_review_text 
    WHERE id = p_review_id;

    -- Provide feedback
    RAISE NOTICE 'Review % has been updated', p_review_id;
	
END;
$$;


--
-- TOC entry 235 (class 1259 OID 28175)
-- Name: Cart; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Cart" (
    id integer NOT NULL,
    "memberId" integer NOT NULL,
    "productId" integer NOT NULL,
    quantity integer NOT NULL
);


--
-- TOC entry 234 (class 1259 OID 28174)
-- Name: Cart_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Cart_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4963 (class 0 OID 0)
-- Dependencies: 234
-- Name: Cart_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Cart_id_seq" OWNED BY public."Cart".id;


--
-- TOC entry 233 (class 1259 OID 27745)
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- TOC entry 230 (class 1259 OID 17288)
-- Name: favourite; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.favourite (
    id integer NOT NULL,
    member_id integer NOT NULL,
    product_id integer NOT NULL,
    added_date timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- TOC entry 229 (class 1259 OID 17287)
-- Name: favourite_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.favourite_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4964 (class 0 OID 0)
-- Dependencies: 229
-- Name: favourite_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.favourite_id_seq OWNED BY public.favourite.id;


--
-- TOC entry 217 (class 1259 OID 17092)
-- Name: member; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.member (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(50) NOT NULL,
    dob date NOT NULL,
    password character varying(255) NOT NULL,
    role integer NOT NULL,
    gender character(1) NOT NULL,
    last_login_on timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    clv numeric(10,3),
    running_total_spending numeric(10,3)
);


--
-- TOC entry 218 (class 1259 OID 17096)
-- Name: member_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.member_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4965 (class 0 OID 0)
-- Dependencies: 218
-- Name: member_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.member_id_seq OWNED BY public.member.id;


--
-- TOC entry 219 (class 1259 OID 17097)
-- Name: member_role; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.member_role (
    id integer NOT NULL,
    name character varying(25)
);


--
-- TOC entry 220 (class 1259 OID 17100)
-- Name: member_role_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.member_role_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4966 (class 0 OID 0)
-- Dependencies: 220
-- Name: member_role_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.member_role_id_seq OWNED BY public.member_role.id;


--
-- TOC entry 221 (class 1259 OID 17101)
-- Name: product; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.product (
    id integer NOT NULL,
    name character varying(255),
    description text,
    unit_price numeric NOT NULL,
    stock_quantity numeric DEFAULT 0 NOT NULL,
    country character varying(100),
    product_type character varying(50),
    image_url character varying(255) DEFAULT '/images/product.png'::character varying,
    manufactured_on timestamp without time zone
);


--
-- TOC entry 222 (class 1259 OID 17108)
-- Name: product_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.product_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4967 (class 0 OID 0)
-- Dependencies: 222
-- Name: product_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.product_id_seq OWNED BY public.product.id;


--
-- TOC entry 228 (class 1259 OID 17273)
-- Name: reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reviews (
    id integer NOT NULL,
    sale_order_item_id integer NOT NULL,
    rating integer NOT NULL,
    review_text character varying(100) NOT NULL,
    review_date date DEFAULT CURRENT_DATE NOT NULL,
    CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- TOC entry 227 (class 1259 OID 17272)
-- Name: reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4968 (class 0 OID 0)
-- Dependencies: 227
-- Name: reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reviews_id_seq OWNED BY public.reviews.id;


--
-- TOC entry 223 (class 1259 OID 17109)
-- Name: sale_order; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sale_order (
    id integer NOT NULL,
    member_id integer,
    order_datetime timestamp without time zone NOT NULL,
    status character varying(10)
);


--
-- TOC entry 224 (class 1259 OID 17112)
-- Name: sale_order_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sale_order_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4969 (class 0 OID 0)
-- Dependencies: 224
-- Name: sale_order_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sale_order_id_seq OWNED BY public.sale_order.id;


--
-- TOC entry 225 (class 1259 OID 17113)
-- Name: sale_order_item; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sale_order_item (
    id integer NOT NULL,
    sale_order_id integer NOT NULL,
    product_id integer NOT NULL,
    quantity numeric NOT NULL
);


--
-- TOC entry 226 (class 1259 OID 17118)
-- Name: sale_order_item_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sale_order_item_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4970 (class 0 OID 0)
-- Dependencies: 226
-- Name: sale_order_item_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sale_order_item_id_seq OWNED BY public.sale_order_item.id;


--
-- TOC entry 232 (class 1259 OID 27733)
-- Name: supplier; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.supplier (
    id integer NOT NULL,
    company_name character varying(255) NOT NULL,
    descriptor text,
    address character varying(255),
    country character varying(100) NOT NULL,
    contact_email character varying(50) NOT NULL,
    company_url character varying(255),
    founded_date date,
    staff_size integer,
    specialization character varying(100),
    is_active boolean
);


--
-- TOC entry 231 (class 1259 OID 27732)
-- Name: supplier_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.supplier_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 4971 (class 0 OID 0)
-- Dependencies: 231
-- Name: supplier_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.supplier_id_seq OWNED BY public.supplier.id;


--
-- TOC entry 236 (class 1259 OID 31293)
-- Name: temp_insufficient_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.temp_insufficient_items (
    "memberId" integer NOT NULL,
    "itemName" text NOT NULL
);


--
-- TOC entry 4771 (class 2604 OID 28178)
-- Name: Cart id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Cart" ALTER COLUMN id SET DEFAULT nextval('public."Cart_id_seq"'::regclass);


--
-- TOC entry 4766 (class 2604 OID 17291)
-- Name: favourite id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favourite ALTER COLUMN id SET DEFAULT nextval('public.favourite_id_seq'::regclass);


--
-- TOC entry 4756 (class 2604 OID 17119)
-- Name: member id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member ALTER COLUMN id SET DEFAULT nextval('public.member_id_seq'::regclass);


--
-- TOC entry 4758 (class 2604 OID 17120)
-- Name: member_role id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member_role ALTER COLUMN id SET DEFAULT nextval('public.member_role_id_seq'::regclass);


--
-- TOC entry 4759 (class 2604 OID 17121)
-- Name: product id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product ALTER COLUMN id SET DEFAULT nextval('public.product_id_seq'::regclass);


--
-- TOC entry 4764 (class 2604 OID 17276)
-- Name: reviews id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews ALTER COLUMN id SET DEFAULT nextval('public.reviews_id_seq'::regclass);


--
-- TOC entry 4762 (class 2604 OID 17122)
-- Name: sale_order id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_order ALTER COLUMN id SET DEFAULT nextval('public.sale_order_id_seq'::regclass);


--
-- TOC entry 4763 (class 2604 OID 17123)
-- Name: sale_order_item id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_order_item ALTER COLUMN id SET DEFAULT nextval('public.sale_order_item_id_seq'::regclass);


--
-- TOC entry 4768 (class 2604 OID 27736)
-- Name: supplier id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier ALTER COLUMN id SET DEFAULT nextval('public.supplier_id_seq'::regclass);


--
-- TOC entry 4803 (class 2606 OID 28180)
-- Name: Cart Cart_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Cart"
    ADD CONSTRAINT "Cart_pkey" PRIMARY KEY (id);


--
-- TOC entry 4801 (class 2606 OID 27753)
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- TOC entry 4790 (class 2606 OID 17294)
-- Name: favourite favourite_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favourite
    ADD CONSTRAINT favourite_pkey PRIMARY KEY (id);


--
-- TOC entry 4774 (class 2606 OID 17125)
-- Name: member member_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member
    ADD CONSTRAINT member_email_key UNIQUE (email);


--
-- TOC entry 4776 (class 2606 OID 17127)
-- Name: member member_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member
    ADD CONSTRAINT member_pkey PRIMARY KEY (id);


--
-- TOC entry 4780 (class 2606 OID 17129)
-- Name: member_role member_role_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member_role
    ADD CONSTRAINT member_role_pkey PRIMARY KEY (id);


--
-- TOC entry 4778 (class 2606 OID 17131)
-- Name: member member_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member
    ADD CONSTRAINT member_username_key UNIQUE (username);


--
-- TOC entry 4782 (class 2606 OID 17133)
-- Name: product product_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.product
    ADD CONSTRAINT product_pkey PRIMARY KEY (id);


--
-- TOC entry 4788 (class 2606 OID 17280)
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- TOC entry 4786 (class 2606 OID 17135)
-- Name: sale_order_item sale_order_item_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_order_item
    ADD CONSTRAINT sale_order_item_pkey PRIMARY KEY (id);


--
-- TOC entry 4784 (class 2606 OID 17137)
-- Name: sale_order sale_order_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_order
    ADD CONSTRAINT sale_order_pkey PRIMARY KEY (id);


--
-- TOC entry 4799 (class 2606 OID 27740)
-- Name: supplier supplier_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier
    ADD CONSTRAINT supplier_pkey PRIMARY KEY (id);


--
-- TOC entry 4805 (class 2606 OID 31299)
-- Name: temp_insufficient_items temp_insufficient_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.temp_insufficient_items
    ADD CONSTRAINT temp_insufficient_items_pkey PRIMARY KEY ("memberId", "itemName");


--
-- TOC entry 4791 (class 1259 OID 30083)
-- Name: idx_supplier_contact_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_supplier_contact_email ON public.supplier USING btree (contact_email);


--
-- TOC entry 4792 (class 1259 OID 30084)
-- Name: idx_supplier_country_company_name_specialization; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_supplier_country_company_name_specialization ON public.supplier USING btree (country, company_name, specialization);


--
-- TOC entry 4793 (class 1259 OID 30085)
-- Name: idx_supplier_country_specialization; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_supplier_country_specialization ON public.supplier USING btree (country, specialization);


--
-- TOC entry 4794 (class 1259 OID 30086)
-- Name: idx_supplier_founded_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_supplier_founded_date ON public.supplier USING btree (founded_date);


--
-- TOC entry 4795 (class 1259 OID 30087)
-- Name: idx_supplier_founded_date_country; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_supplier_founded_date_country ON public.supplier USING btree (founded_date, country);


--
-- TOC entry 4796 (class 1259 OID 30088)
-- Name: idx_supplier_is_active_staff_size; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_supplier_is_active_staff_size ON public.supplier USING btree (is_active, staff_size);


--
-- TOC entry 4797 (class 1259 OID 30089)
-- Name: idx_supplier_specialization_staff_size; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_supplier_specialization_staff_size ON public.supplier USING btree (specialization, staff_size);


--
-- TOC entry 4813 (class 2606 OID 28181)
-- Name: Cart Cart_memberId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Cart"
    ADD CONSTRAINT "Cart_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public.member(id);


--
-- TOC entry 4814 (class 2606 OID 28186)
-- Name: Cart Cart_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Cart"
    ADD CONSTRAINT "Cart_productId_fkey" FOREIGN KEY ("productId") REFERENCES public.product(id);


--
-- TOC entry 4811 (class 2606 OID 17295)
-- Name: favourite favourite_member_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favourite
    ADD CONSTRAINT favourite_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.member(id);


--
-- TOC entry 4812 (class 2606 OID 17300)
-- Name: favourite favourite_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favourite
    ADD CONSTRAINT favourite_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.product(id);


--
-- TOC entry 4806 (class 2606 OID 17138)
-- Name: member fk_member_role_id; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.member
    ADD CONSTRAINT fk_member_role_id FOREIGN KEY (role) REFERENCES public.member_role(id);


--
-- TOC entry 4808 (class 2606 OID 17143)
-- Name: sale_order_item fk_sale_order_item_product; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_order_item
    ADD CONSTRAINT fk_sale_order_item_product FOREIGN KEY (product_id) REFERENCES public.product(id);


--
-- TOC entry 4809 (class 2606 OID 17148)
-- Name: sale_order_item fk_sale_order_item_sale_order; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_order_item
    ADD CONSTRAINT fk_sale_order_item_sale_order FOREIGN KEY (sale_order_id) REFERENCES public.sale_order(id);


--
-- TOC entry 4807 (class 2606 OID 17153)
-- Name: sale_order fk_sale_order_member; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sale_order
    ADD CONSTRAINT fk_sale_order_member FOREIGN KEY (member_id) REFERENCES public.member(id);


--
-- TOC entry 4810 (class 2606 OID 17281)
-- Name: reviews reviews_sale_order_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_sale_order_item_id_fkey FOREIGN KEY (sale_order_item_id) REFERENCES public.sale_order_item(id);


-- Completed on 2024-08-12 01:59:05

--
-- PostgreSQL database dump complete
--

