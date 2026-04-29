CREATE DATABASE IF NOT EXISTS omniread
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE omniread;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT NOT NULL AUTO_INCREMENT,
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(160) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(40) NULL,
  role VARCHAR(40) NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'ACTIVE',
  supplier_company_name VARCHAR(180) NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_users_email (email),
  KEY idx_users_role (role),
  KEY idx_users_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS products (
  id BIGINT NOT NULL AUTO_INCREMENT,
  sku VARCHAR(80) NOT NULL,
  isbn13 VARCHAR(20) NULL,
  title VARCHAR(255) NOT NULL,
  author_name VARCHAR(180) NOT NULL,
  publisher VARCHAR(180) NULL,
  category VARCHAR(120) NULL,
  description TEXT NULL,
  book_type VARCHAR(20) NOT NULL DEFAULT 'PHYSICAL',
  price DECIMAL(12,2) NOT NULL,
  cover_image_url VARCHAR(500) NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_products_sku (sku),
  UNIQUE KEY uk_products_isbn13 (isbn13),
  KEY idx_products_title (title),
  KEY idx_products_category (category),
  KEY idx_products_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS inventory_records (
  id BIGINT NOT NULL AUTO_INCREMENT,
  product_id BIGINT NOT NULL,
  quantity_on_hand INT NOT NULL DEFAULT 0,
  reserved_quantity INT NOT NULL DEFAULT 0,
  reorder_threshold INT NOT NULL DEFAULT 0,
  safety_stock INT NOT NULL DEFAULT 0,
  supplier_lead_time_days INT NOT NULL DEFAULT 7,
  last_restocked_at DATETIME(6) NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_inventory_product (product_id),
  KEY idx_inventory_reorder (quantity_on_hand, reorder_threshold),
  CONSTRAINT fk_inventory_product FOREIGN KEY (product_id) REFERENCES products (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS orders (
  id BIGINT NOT NULL AUTO_INCREMENT,
  order_number VARCHAR(64) NOT NULL,
  customer_id BIGINT NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'PENDING',
  payment_status VARCHAR(40) NOT NULL DEFAULT 'UNPAID',
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  shipping_fee DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  shipping_address VARCHAR(500) NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_orders_order_number (order_number),
  KEY idx_orders_customer (customer_id),
  KEY idx_orders_status (status),
  CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_items (
  id BIGINT NOT NULL AUTO_INCREMENT,
  order_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  line_total DECIMAL(12,2) NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  KEY idx_order_items_order (order_id),
  KEY idx_order_items_product (product_id),
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders (id),
  CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS shopping_carts (
  id BIGINT NOT NULL AUTO_INCREMENT,
  customer_id BIGINT NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_carts_customer (customer_id),
  CONSTRAINT fk_carts_customer FOREIGN KEY (customer_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cart_items (
  id BIGINT NOT NULL AUTO_INCREMENT,
  cart_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_cart_product (cart_id, product_id),
  KEY idx_cart_items_product (product_id),
  CONSTRAINT fk_cart_items_cart FOREIGN KEY (cart_id) REFERENCES shopping_carts (id),
  CONSTRAINT fk_cart_items_product FOREIGN KEY (product_id) REFERENCES products (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS stockout_forecasts (
  id BIGINT NOT NULL AUTO_INCREMENT,
  product_id BIGINT NOT NULL,
  forecast_date DATE NOT NULL,
  target_date DATE NOT NULL,
  predicted_demand INT NOT NULL DEFAULT 0,
  predicted_stock INT NOT NULL DEFAULT 0,
  stockout_risk VARCHAR(40) NOT NULL DEFAULT 'LOW',
  confidence_score DECIMAL(5,4) NOT NULL DEFAULT 0.0000,
  model_version VARCHAR(80) NOT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_forecast_product_target (product_id, forecast_date, target_date),
  KEY idx_forecast_risk (stockout_risk),
  KEY idx_forecast_target_date (target_date),
  CONSTRAINT fk_forecasts_product FOREIGN KEY (product_id) REFERENCES products (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS procurement_requests (
  id BIGINT NOT NULL AUTO_INCREMENT,
  request_number VARCHAR(64) NOT NULL,
  product_id BIGINT NOT NULL,
  supplier_id BIGINT NOT NULL,
  requested_quantity INT NOT NULL,
  status VARCHAR(40) NOT NULL DEFAULT 'AUTO_GENERATED',
  trigger_reason VARCHAR(255) NOT NULL,
  external_request_id VARCHAR(120) NULL,
  approved_at DATETIME(6) NULL,
  completed_at DATETIME(6) NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  PRIMARY KEY (id),
  UNIQUE KEY uk_procurement_request_number (request_number),
  KEY idx_procurement_product (product_id),
  KEY idx_procurement_supplier (supplier_id),
  KEY idx_procurement_status (status),
  CONSTRAINT fk_procurement_product FOREIGN KEY (product_id) REFERENCES products (id),
  CONSTRAINT fk_procurement_supplier FOREIGN KEY (supplier_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
