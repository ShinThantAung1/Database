DO $$
BEGIN
    -- Drop temp tables if they already exist
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'temp_before') THEN
        DROP TABLE temp_before;
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'temp_after') THEN
        DROP TABLE temp_after;
    END IF;

    -- Read the current state of sale orders with status 'PACKING'
    CREATE TEMP TABLE temp_before AS 
    SELECT * FROM sale_order WHERE status = 'PACKING';

    -- Simulate some delay or processing time
    PERFORM pg_sleep(10);

    -- Re-read the state of sale orders with status 'PACKING'
    CREATE TEMP TABLE temp_after AS 
    SELECT * FROM sale_order WHERE status = 'PACKING';

    -- Show the results before and after
    RAISE NOTICE 'Result before delay: %', (SELECT count(*) FROM temp_before);
    RAISE NOTICE 'Result after delay: %', (SELECT count(*) FROM temp_after);
END
$$;

