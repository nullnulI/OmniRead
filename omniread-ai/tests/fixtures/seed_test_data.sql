-- Minimal test data for AI service end-to-end smoke test.
-- Idempotent: safe to run multiple times.

INSERT INTO users (id, full_name, email, password_hash, role, status)
VALUES (9001, 'AI Test Customer', 'ai-test-customer@local.test', '$2a$10$placeholder', 'CUSTOMER', 'ACTIVE')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);

INSERT INTO products (id, sku, isbn13, title, author_name, category, book_type, price, status)
VALUES (9001, 'AI-TEST-001', '9780000000001', 'AI Test Book', 'Test Author', 'Programming', 'PHYSICAL', 49.90, 'ACTIVE')
ON DUPLICATE KEY UPDATE title = VALUES(title);

INSERT INTO inventory_records (product_id, quantity_on_hand, reserved_quantity, reorder_threshold, safety_stock, supplier_lead_time_days)
VALUES (9001, 10, 0, 5, 3, 7)
ON DUPLICATE KEY UPDATE quantity_on_hand = VALUES(quantity_on_hand),
                       reserved_quantity = VALUES(reserved_quantity),
                       reorder_threshold = VALUES(reorder_threshold),
                       safety_stock = VALUES(safety_stock),
                       supplier_lead_time_days = VALUES(supplier_lead_time_days);

-- Wipe prior test orders before re-seeding
DELETE oi FROM order_items oi JOIN orders o ON oi.order_id = o.id WHERE o.customer_id = 9001;
DELETE FROM orders WHERE customer_id = 9001;

-- 14 days of sales, ~2 units/day on average
INSERT INTO orders (id, order_number, customer_id, status, payment_status, subtotal, total_amount, created_at)
VALUES
  (9101, 'AI-T-D01', 9001, 'COMPLETED', 'PAID', 99.80, 99.80, NOW() - INTERVAL 14 DAY),
  (9102, 'AI-T-D02', 9001, 'COMPLETED', 'PAID', 49.90, 49.90, NOW() - INTERVAL 13 DAY),
  (9103, 'AI-T-D03', 9001, 'COMPLETED', 'PAID', 149.70, 149.70, NOW() - INTERVAL 12 DAY),
  (9104, 'AI-T-D04', 9001, 'COMPLETED', 'PAID', 99.80, 99.80, NOW() - INTERVAL 11 DAY),
  (9105, 'AI-T-D05', 9001, 'COMPLETED', 'PAID', 49.90, 49.90, NOW() - INTERVAL 10 DAY),
  (9106, 'AI-T-D06', 9001, 'COMPLETED', 'PAID', 99.80, 99.80, NOW() - INTERVAL 9 DAY),
  (9107, 'AI-T-D07', 9001, 'COMPLETED', 'PAID', 149.70, 149.70, NOW() - INTERVAL 8 DAY),
  (9108, 'AI-T-D08', 9001, 'COMPLETED', 'PAID', 49.90, 49.90, NOW() - INTERVAL 7 DAY),
  (9109, 'AI-T-D09', 9001, 'COMPLETED', 'PAID', 99.80, 99.80, NOW() - INTERVAL 6 DAY),
  (9110, 'AI-T-D10', 9001, 'COMPLETED', 'PAID', 99.80, 99.80, NOW() - INTERVAL 5 DAY),
  (9111, 'AI-T-D11', 9001, 'COMPLETED', 'PAID', 149.70, 149.70, NOW() - INTERVAL 4 DAY),
  (9112, 'AI-T-D12', 9001, 'COMPLETED', 'PAID', 49.90, 49.90, NOW() - INTERVAL 3 DAY),
  (9113, 'AI-T-D13', 9001, 'COMPLETED', 'PAID', 99.80, 99.80, NOW() - INTERVAL 2 DAY),
  (9114, 'AI-T-D14', 9001, 'COMPLETED', 'PAID', 149.70, 149.70, NOW() - INTERVAL 1 DAY);

INSERT INTO order_items (order_id, product_id, quantity, unit_price, line_total) VALUES
  (9101, 9001, 2, 49.90, 99.80),
  (9102, 9001, 1, 49.90, 49.90),
  (9103, 9001, 3, 49.90, 149.70),
  (9104, 9001, 2, 49.90, 99.80),
  (9105, 9001, 1, 49.90, 49.90),
  (9106, 9001, 2, 49.90, 99.80),
  (9107, 9001, 3, 49.90, 149.70),
  (9108, 9001, 1, 49.90, 49.90),
  (9109, 9001, 2, 49.90, 99.80),
  (9110, 9001, 2, 49.90, 99.80),
  (9111, 9001, 3, 49.90, 149.70),
  (9112, 9001, 1, 49.90, 49.90),
  (9113, 9001, 2, 49.90, 99.80),
  (9114, 9001, 3, 49.90, 149.70);
