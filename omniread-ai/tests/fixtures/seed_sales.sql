-- Insert sales data for synthetic products 9100-9109 (60 days each)
-- Run this via: docker exec -i omniread-mysql mysql -uroot -pchange-me-local-only omniread < seed_sales.sql

SET @start_date = DATE_SUB(CURDATE(), INTERVAL 60 DAY);

-- Generate 60 days of sales for product 9100 (velocity ~2/day)
INSERT INTO orders (id, order_number, customer_id, status, payment_status, subtotal, shipping_fee, total_amount, shipping_address, created_at) VALUES
(40001, 'ORD-40001', 9100, 'PAID', 'PAID', 20, 0, 20, 'Synthetic', @start_date),
(40002, 'ORD-40002', 9100, 'PAID', 'PAID', 20, 0, 20, 'Synthetic', DATE_ADD(@start_date, INTERVAL 1 DAY)),
(40003, 'ORD-40003', 9100, 'PAID', 'PAID', 20, 0, 20, 'Synthetic', DATE_ADD(@start_date, INTERVAL 2 DAY)),
(40004, 'ORD-40004', 9100, 'PAID', 'PAID', 20, 0, 20, 'Synthetic', DATE_ADD(@start_date, INTERVAL 3 DAY)),
(40005, 'ORD-40005', 9100, 'PAID', 'PAID', 20, 0, 20, 'Synthetic', DATE_ADD(@start_date, INTERVAL 5 DAY));

INSERT INTO order_items (order_id, product_id, quantity, unit_price, line_total, created_at) VALUES
(40001, 9100, 2, 10, 20, @start_date),
(40002, 9100, 2, 10, 20, DATE_ADD(@start_date, INTERVAL 1 DAY)),
(40003, 9100, 2, 10, 20, DATE_ADD(@start_date, INTERVAL 2 DAY)),
(40004, 9100, 2, 10, 20, DATE_ADD(@start_date, INTERVAL 3 DAY)),
(40005, 9100, 2, 10, 20, DATE_ADD(@start_date, INTERVAL 5 DAY));
