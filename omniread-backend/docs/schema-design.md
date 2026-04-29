# OmniRead Database Schema

The schema uses lowercase `snake_case` table names and `utf8mb4` for multilingual book data.

| Table | Purpose | Key fields |
| --- | --- | --- |
| `users` | Login identities for customers, inventory admins, suppliers, and system admins. Authors are stored as book metadata unless they later need a portal account. | `email`, `password_hash`, `role`, `status`, `supplier_company_name` |
| `products` | Book catalog metadata for physical books, ebooks, and bundles. | `sku`, `isbn13`, `title`, `author_name`, `book_type`, `price`, `status` |
| `inventory_records` | Current stock state for each product. | `product_id`, `quantity_on_hand`, `reserved_quantity`, `reorder_threshold`, `safety_stock`, `supplier_lead_time_days` |
| `orders` | Customer order header and payment/fulfillment state. | `order_number`, `customer_id`, `status`, `payment_status`, `total_amount` |
| `order_items` | Order line items. | `order_id`, `product_id`, `quantity`, `unit_price`, `line_total` |
| `shopping_carts` | One cart per customer. | `customer_id` |
| `cart_items` | Cart line items. | `cart_id`, `product_id`, `quantity` |
| `stockout_forecasts` | Seven-day stockout forecast outputs from the AI module. | `product_id`, `forecast_date`, `target_date`, `predicted_demand`, `predicted_stock`, `stockout_risk`, `confidence_score`, `model_version` |
| `procurement_requests` | Auto-generated or approved replenishment requests to suppliers. | `request_number`, `product_id`, `supplier_id`, `requested_quantity`, `status`, `trigger_reason`, `external_request_id` |

Important constraints:

- `users.email`, `products.sku`, `products.isbn13`, and `orders.order_number` are unique.
- `inventory_records.product_id` and `shopping_carts.customer_id` are one-to-one style unique references.
- `stockout_forecasts` is unique per product, forecast date, and target date.
- `procurement_requests.supplier_id` points to a `users` record whose role should be `SUPPLIER` at the service layer.
