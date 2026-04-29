# OmniRead Demo Script

This script is the recommended classroom demo path for the current MVP.

## Runtime

- Storefront: `http://localhost:3000`
- Backend API: `http://localhost:8080/api/v1`
- MySQL 8 demo database: `localhost:3307`, using local credentials from environment variables

## Demo Accounts

- Customer: `customer@omniread.local` / value of `OMNIREAD_DEMO_CUSTOMER_PASSWORD`
- Inventory Administrator: `inventory@omniread.local` / value of `OMNIREAD_DEMO_INVENTORY_PASSWORD`
- Supplier: `supplier@omniread.local` / value of `OMNIREAD_DEMO_SUPPLIER_PASSWORD`
- System Administrator: `admin@omniread.local` / value of `OMNIREAD_BOOTSTRAP_ADMIN_PASSWORD`

## Customer Flow

1. Log in as the customer.
2. Search for `design` from the storefront header.
3. Open `Design Patterns` from the search results.
4. Add the book to the cart.
5. Open the cart and confirm the simulated payment notice is visible.
6. Checkout with the default shipping address.
7. Open `/orders` and confirm the order appears with payment status and lifecycle progress.
8. Open an EPUB-backed book and confirm the reader loads the sample EPUB.

## Administrator Flow

1. Log in as the inventory administrator.
2. Open `/operations`.
3. Confirm the dashboard shows inventory totals, low-stock count, open procurement, and risky forecast metrics.
4. Edit an existing product in Product Management and save without changing its demo-safe values.
5. Generate forecasts.
6. Auto-generate procurement if low-stock records are available.
7. In Order Management, move a customer order through `FULFILLING`, `SHIPPED`, and `COMPLETED`.

## Supplier Flow

1. Log in as the supplier.
2. Open `/operations`.
3. Confirm only assigned procurement requests are visible.
4. Add a shipment or external reference if needed.
5. Acknowledge or mark a request shipped.
6. Switch back to the administrator and confirm receipt to restock inventory.

## Verification Commands

- Backend tests: `mvn -q test`
- Frontend production build: `npm.cmd run build`
- Frontend lint: `npm.cmd run lint`

## MVP Boundaries

- Payment gateway behavior is simulated; successful checkout records payment as `PAID`.
- Supplier Webhooks are simulated through the supplier portal.
- Carrier tracking numbers and external shipping APIs are not included.
- Author revenue share and publishing workflows are deferred.
