# OmniRead Backend

Spring Boot backend skeleton for OmniRead, an online ebook/physical book store with inventory forecasting and supplier procurement workflows.

## Stack

- Java 8
- Spring Boot 2.7.18
- Spring Web
- Spring Data JPA
- Spring Security
- MySQL
- Redis cache and short-lived checkout locks
- Lombok

## Project Structure

```text
src/main/java/com/omniread/backend
  config/       Security and infrastructure configuration
  controller/   REST API entry points
  dto/          Request and response models
  entity/       JPA entities and enums
  repository/   Spring Data JPA repositories
  service/      Business service interfaces and implementations
src/main/resources
  application.yml
  init.sql
docs/
  schema-design.md
```

## Database

Run `src/main/resources/init.sql` in MySQL to create the `omniread` schema and core tables.

Default local connection in `application.yml`:

```yaml
spring.datasource.url: ${OMNIREAD_DATASOURCE_URL:jdbc:mysql://localhost:3306/omniread?...}
spring.datasource.username: ${OMNIREAD_DATASOURCE_USERNAME:omniread}
spring.datasource.password: ${OMNIREAD_DATASOURCE_PASSWORD:change-me}
```

For local development, set the environment variables shown in `.env.example`. Do not commit real database passwords or deployment secrets.

Or start local MySQL and Redis services with Docker if your environment permits it:

```powershell
$env:MYSQL_ROOT_PASSWORD="<local-only-password>"
docker compose up -d
```

The compose file starts:

- MySQL 8.0 at `localhost:3306`
- Redis 7 at `localhost:6379`
- The `omniread` database initialized from `src/main/resources/init.sql`

Redis is now a required runtime dependency for the MVP backend. It is used for:

- Book catalog cache: `GET /api/v1/books`, `GET /api/v1/books/{bookId}`, and admin catalog reads are cached to reduce repeated storefront/search load.
- Cart snapshot cache: `GET /api/v1/cart` is cached per customer and evicted after cart mutations or checkout.
- Checkout and stock locks: short-lived Redis locks prevent duplicate checkout submissions and concurrent stock deduction for the same physical product.

Cache TTLs are intentionally short for demo correctness:

- Books: 10 minutes
- Cart: 5 minutes
- Inventory/forecast-ready cache namespace: 1 minute

On Windows, Redis compatibility can be provided by Memurai Developer Edition:

```text
Service: Memurai
Port: localhost:6379
```

Useful local checks:

```powershell
Get-Service Memurai
memurai-cli ping
memurai-cli --scan --pattern '*books*'
```

## API Shape

Every controller returns:

```json
{
  "code": 200,
  "message": "success",
  "data": {}
}
```

Initial REST routes:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `GET /api/v1/users`
- `POST /api/v1/users`
- `GET /api/v1/books`
- `GET /api/v1/books/{bookId}`
- `POST /api/v1/books`
- `GET /api/v1/cart`
- `POST /api/v1/cart/items`
- `PUT /api/v1/cart/items/{itemId}`
- `DELETE /api/v1/cart/items/{itemId}`
- `DELETE /api/v1/cart`
- `POST /api/v1/cart/checkout`
- `POST /api/v1/orders`
- `GET /api/v1/orders/me`
- `GET /api/v1/orders/customers/{customerId}`
- `GET /api/v1/inventory/products/{productId}`
- `PUT /api/v1/inventory/products/{productId}/stock`
- `GET /api/v1/inventory/products/{productId}/forecasts`
- `POST /api/v1/inventory/products/{productId}/forecasts/generate`
- `POST /api/v1/inventory/forecasts/generate`
- `GET /api/v1/inventory/low-stock`
- `GET /api/v1/inventory/procurement-requests`
- `GET /api/v1/inventory/procurement-requests/me`
- `POST /api/v1/inventory/procurement-requests`
- `POST /api/v1/inventory/procurement-requests/auto-generate`
- `PUT /api/v1/inventory/procurement-requests/{requestId}/status`

## Run

After Maven is installed:

```bash
mvn spring-boot:run
```

With the dev profile:

```powershell
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

## Authentication

The backend now uses BCrypt password hashing and JWT bearer tokens.

On first startup, a default system administrator is created if it does not already exist:

```text
email: admin@omniread.local
password: value of OMNIREAD_BOOTSTRAP_ADMIN_PASSWORD
role: SYSTEM_ADMIN
```

Demo seed data is enabled by default and is safe to run repeatedly. It creates:

```text
inventory@omniread.local / value of OMNIREAD_DEMO_INVENTORY_PASSWORD / INVENTORY_ADMIN
supplier@omniread.local  / value of OMNIREAD_DEMO_SUPPLIER_PASSWORD  / SUPPLIER
customer@omniread.local  / value of OMNIREAD_DEMO_CUSTOMER_PASSWORD  / CUSTOMER
```

Demo books:

```text
OMNI-PHY-001 / Effective Java / physical / stock 8
OMNI-PHY-002 / Design Patterns / physical / stock 2
OMNI-EBK-001 / Building Microservices / ebook
```

Disable demo data with:

```yaml
omniread.seed.demo.enabled: false
```

Login:

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@omniread.local",
  "password": "<admin-password>"
}
```

Use the returned token for protected routes:

```http
Authorization: Bearer <accessToken>
```

Public registration supports `CUSTOMER` and `SUPPLIER`. `SYSTEM_ADMIN` and `INVENTORY_ADMIN` accounts must be created by a system administrator through `POST /api/v1/users`.

## Cart And Checkout

Customer cart APIs require:

```http
Authorization: Bearer <customerAccessToken>
```

Add a book to the current customer's cart:

```http
POST /api/v1/cart/items
Content-Type: application/json

{
  "productId": 1,
  "quantity": 2
}
```

Checkout creates an order, validates stock, deducts inventory for physical books and bundles, and then clears the cart:

```http
POST /api/v1/cart/checkout
Content-Type: application/json

{
  "shippingAddress": "123 OmniRead Street"
}
```

Checkout also acquires Redis locks for the customer checkout session and each physical product being deducted. If the same customer clicks checkout repeatedly, only one checkout can proceed while the lock is active.

## Procurement Workflow

Inventory admins and system admins can view low-stock physical books and bundles:

```http
GET /api/v1/inventory/low-stock
Authorization: Bearer <adminAccessToken>
```

Create a manual procurement request:

```http
POST /api/v1/inventory/procurement-requests
Authorization: Bearer <adminAccessToken>
Content-Type: application/json

{
  "productId": 1,
  "supplierId": 3,
  "requestedQuantity": 20,
  "triggerReason": "Manual replenishment for low stock"
}
```

Auto-generate procurement requests for all low-stock items. If `supplierId` is omitted, the first available supplier account is used:

```http
POST /api/v1/inventory/procurement-requests/auto-generate
Authorization: Bearer <adminAccessToken>
Content-Type: application/json

{
  "supplierId": 3
}
```

Suppliers can view only their assigned procurement requests:

```http
GET /api/v1/inventory/procurement-requests/me
Authorization: Bearer <supplierAccessToken>
```

Updating a procurement request to `FULFILLED` restocks the related inventory once:

```http
PUT /api/v1/inventory/procurement-requests/1/status
Authorization: Bearer <supplierOrAdminAccessToken>
Content-Type: application/json

{
  "status": "FULFILLED",
  "externalRequestId": "SUP-PO-1001"
}
```

## Stockout Forecast MVP

Inventory admins and system admins can generate explainable seven-day stockout forecasts.

Generate forecasts for one product:

```http
POST /api/v1/inventory/products/1/forecasts/generate
Authorization: Bearer <adminAccessToken>
Content-Type: application/json

{
  "horizonDays": 7,
  "lookbackDays": 14
}
```

Generate forecasts for all physical books and bundles:

```http
POST /api/v1/inventory/forecasts/generate
Authorization: Bearer <adminAccessToken>
Content-Type: application/json

{
  "horizonDays": 7,
  "lookbackDays": 14
}
```

The current `rules-v1.0` model estimates daily demand from recent order item quantities, then rolls stock forward across the forecast horizon:

```text
available stock = quantity_on_hand - reserved_quantity
predicted demand = ceil(average daily demand * day)
predicted stock = available stock - predicted demand
```

Risk levels:

- `CRITICAL`: predicted stock is zero or below
- `HIGH`: predicted stock is at or below safety stock within supplier lead time
- `MEDIUM`: predicted stock is at or below safety stock after supplier lead time
- `LOW`: stock remains above safety stock
