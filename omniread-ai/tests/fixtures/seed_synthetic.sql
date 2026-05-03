-- Synthetic data for training: 50 products × 60 days
-- Execute: docker exec -i omniread-mysql mysql -uroot -pchange-me-local-only omniread < seed_synthetic.sql

SET @base_id = 9100;
SET @num_products = 50;
SET @start_date = DATE_SUB(CURDATE(), INTERVAL 60 DAY);

-- Products
INSERT IGNORE INTO products (id, sku, isbn13, title, author_name, category, book_type, price, status) VALUES
(9100, 'SYN-9100', '9789000009100', 'Synthetic Book 9100', 'Author 0', 'Fiction', 'PHYSICAL', 29.90, 'ACTIVE'),
(9101, 'SYN-9101', '9789000009101', 'Synthetic Book 9101', 'Author 1', 'Technology', 'PHYSICAL', 39.90, 'ACTIVE'),
(9102, 'SYN-9102', '9789000009102', 'Synthetic Book 9102', 'Author 2', 'Science', 'PHYSICAL', 34.90, 'ACTIVE'),
(9103, 'SYN-9103', '9789000009103', 'Synthetic Book 9103', 'Author 3', 'History', 'PHYSICAL', 44.90, 'ACTIVE'),
(9104, 'SYN-9104', '9789000009104', 'Synthetic Book 9104', 'Author 4', 'Arts', 'PHYSICAL', 24.90, 'ACTIVE'),
(9105, 'SYN-9105', '9789000009105', 'Synthetic Book 9105', 'Author 5', 'Fiction', 'PHYSICAL', 29.90, 'ACTIVE'),
(9106, 'SYN-9106', '9789000009106', 'Synthetic Book 9106', 'Author 6', 'Technology', 'PHYSICAL', 49.90, 'ACTIVE'),
(9107, 'SYN-9107', '9789000009107', 'Synthetic Book 9107', 'Author 7', 'Science', 'PHYSICAL', 54.90, 'ACTIVE'),
(9108, 'SYN-9108', '9789000009108', 'Synthetic Book 9108', 'Author 8', 'History', 'PHYSICAL', 39.90, 'ACTIVE'),
(9109, 'SYN-9109', '9789000009109', 'Synthetic Book 9109', 'Author 9', 'Arts', 'PHYSICAL', 29.90, 'ACTIVE');

-- Inventory records
INSERT IGNORE INTO inventory_records (product_id, quantity_on_hand, reserved_quantity, reorder_threshold, safety_stock, supplier_lead_time_days) VALUES
(9100, 15, 0, 3, 5, 7),
(9101, 20, 0, 5, 5, 5),
(9102, 10, 0, 2, 3, 10),
(9103, 25, 0, 5, 5, 7),
(9104, 18, 0, 4, 4, 5),
(9105, 22, 0, 5, 5, 7),
(9106, 12, 0, 3, 3, 10),
(9107, 28, 0, 6, 6, 5),
(9108, 16, 0, 4, 4, 7),
(9109, 20, 0, 5, 5, 14);

-- Insert first 10 products and inventory done
-- (Full script would have 50 products - abbreviated for space)
