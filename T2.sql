BEGIN;

INSERT INTO sale_order (member_id, order_datetime, status)
VALUES (4, NOW(), 'PACKING');

COMMIT;
