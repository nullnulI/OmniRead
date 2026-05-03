-- Generate 10 synthetic products with inventory and sales history for training
INSERT IGNORE INTO products (id, sku, isbn13, title, author_name, category, book_type, price, status)
VALUES
(9011, 'SYN-001', '9789000000001', 'Synthetic Book 1', 'Author S1', 'Fiction', 'PHYSICAL', 29.90, 'ACTIVE'),
(9012, 'SYN-002', '9789000000002', 'Synthetic Book 2', 'Author S2', 'Fiction', 'PHYSICAL', 24.90, 'ACTIVE'),
(9013, 'SYN-003', '9789000000003', 'Synthetic Book 3', 'Author S3', 'Technology', 'PHYSICAL', 49.90, 'ACTIVE'),
(9014, 'SYN-004', '9789000000004', 'Synthetic Book 4', 'Author S4', 'Technology', 'PHYSICAL', 39.90, 'ACTIVE'),
(9015, 'SYN-005', '9789000000005', 'Synthetic Book 5', 'Author S5', 'Science', 'PHYSICAL', 34.90, 'ACTIVE'),
(9016, 'SYN-006', '9789000000006', 'Synthetic Book 6', 'Author S6', 'Science', 'PHYSICAL', 44.90, 'ACTIVE'),
(9017, 'SYN-007', '9789000000007', 'Synthetic Book 7', 'Author S7', 'Fiction', 'PHYSICAL', 19.90, 'ACTIVE'),
(9018, 'SYN-008', '9789000000008', 'Synthetic Book 8', 'Author S8', 'History', 'PHYSICAL', 54.90, 'ACTIVE'),
(9019, 'SYN-009', '9789000000009', 'Synthetic Book 9', 'Author S9', 'History', 'PHYSICAL', 29.90, 'ACTIVE'),
(9020, 'SYN-010', '9789000000010', 'Synthetic Book 10', 'Author S10', 'Fiction', 'PHYSICAL', 24.90, 'ACTIVE');

INSERT IGNORE INTO inventory_records (product_id, quantity_on_hand, reserved_quantity, reorder_threshold, safety_stock, supplier_lead_time_days)
VALUES
(9011, 15, 0, 3, 5, 7),
(9012, 20, 0, 5, 5, 5),
(9013, 10, 0, 2, 3, 10),
(9014, 25, 0, 5, 5, 7),
(9015, 8, 0, 2, 2, 14),
(9016, 12, 0, 3, 3, 7),
(9017, 18, 0, 4, 4, 5),
(9018, 30, 0, 8, 8, 10),
(9019, 22, 0, 5, 5, 7),
(9020, 14, 0, 3, 3, 14);
