# OmniRead SRS Completion Checklist

This checklist maps the current MVP implementation to the Homework, proposal, and SRS scope.

## Verification Status

- Backend tests: covered by `mvn -q test`.
- Frontend production build: covered by `npm.cmd run build`.
- Frontend lint: covered by `npm.cmd run lint`.
- Browser smoke scope: customer search/cart/checkout/orders, administrator operations, supplier procurement portal, and EPUB reader.
- Demo guide: see `docs/demo-script.md`.

Latest local verification on 2026-04-29:

- `mvn -q test`: Passed.
- `npm.cmd run build`: Passed.
- `npm.cmd run lint`: Passed with zero warnings.
- Browser smoke: customer checkout/order history, admin product/order operations, supplier portal terminal-state controls, search, book detail, and EPUB reader passed.

## Done

- Customer storefront: browse books, view book detail, browse categories, and view recommendations from backend-backed demo catalog data.
- Customer cart and checkout: authenticated customers can add books to cart, checkout, generate orders, and deduct physical inventory.
- Order history: customers can view their own orders and order lifecycle progress.
- Authentication and RBAC: customer, inventory administrator, supplier, and system administrator roles are enforced by backend security rules.
- Inventory dashboard: inventory administrators can view stock, thresholds, low-stock alerts, and forecast risk.
- Forecasting MVP: administrators can generate seven-day stockout forecasts from internal order history and lead-time settings.
- Procurement workflow: administrators can auto-generate procurement requests, suppliers can acknowledge and mark shipment, and administrators can confirm receipt to restock inventory.
- Supplier portal: suppliers can view and update only their assigned procurement requests.
- Product management MVP: inventory administrators can create and update product metadata, price, type, and status.
- Storefront search: users can search by title, author, category, publisher, ISBN, and SKU.
- Redis high-concurrency support: book catalog reads and cart snapshots are cached, while checkout and stock deduction use short-lived Redis locks.

## Partial

- Payment gateway: checkout records simulated payment as `PAID`; real Stripe/PayPal authorization is not integrated.
- Shipment lifecycle: admin can move orders through fulfillment states, but no carrier API or tracking number model is implemented.
- Forecast automation: forecasts can be triggered from the dashboard; scheduled 24-hour execution is not implemented.
- Product CRUD: create and update are implemented; destructive deletion is intentionally omitted for demo data safety.
- Forecast visualization: risk labels and target dates are displayed; a full visual timeline can be added later.
- Alert threshold configuration: per-product inventory thresholds are supported; per-category threshold configuration is not implemented.
- EPUB content: the reader loads a sample EPUB for demo coverage; a full licensed catalog ingestion workflow is deferred.

## Deferred

- Real supplier Webhooks: procurement requests are represented inside the supplier portal instead of being pushed to an external supplier API.
- Real payment processing and email receipts: out of MVP scope; payment behavior is documented and simulated.
- Author/writer publishing, revenue shares, and account balances: mentioned in SRS storefront expansion, deferred to keep the course MVP focused on the three primary actors.
- Native mobile/desktop clients: explicitly out of scope in the proposal and SRS.
- External market-data or ML model integration: forecasting intentionally uses bounded internal data and rule-based logic for explainability.

## Demo Accounts

- Customer: `customer@omniread.local` / value of `OMNIREAD_DEMO_CUSTOMER_PASSWORD`
- Inventory Administrator: `inventory@omniread.local` / value of `OMNIREAD_DEMO_INVENTORY_PASSWORD`
- Supplier: `supplier@omniread.local` / value of `OMNIREAD_DEMO_SUPPLIER_PASSWORD`
- System Administrator: `admin@omniread.local` / value of `OMNIREAD_BOOTSTRAP_ADMIN_PASSWORD`
