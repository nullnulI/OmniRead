# OmniRead MVP

OmniRead is a course MVP monorepo with a Spring Boot backend and a Next.js storefront.

## Projects

- `omniread-backend/` - Spring Boot API, MySQL persistence, Redis/Memurai cache and checkout locks.
- `omniread-storefront-main/` - Next.js storefront, customer shopping flow, operations portal, and EPUB reader.

## Local Services

Start services in this order:

1. MySQL 8 on `localhost:3307`
2. Redis-compatible Memurai on `localhost:6379`
3. Backend on `localhost:8080`
4. Frontend on `localhost:3000`

The MVP uses local MySQL and Memurai. Docker is optional reference material only and is not required for the demo.

## Backend

Set local runtime values before starting the backend. Do not commit real passwords or deployment secrets.

```powershell
$env:OMNIREAD_DATASOURCE_URL="jdbc:mysql://localhost:3307/omniread?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai&useSSL=false&allowPublicKeyRetrieval=true"
$env:OMNIREAD_DATASOURCE_USERNAME="<mysql-user>"
$env:OMNIREAD_DATASOURCE_PASSWORD="<mysql-password>"
$env:OMNIREAD_JWT_SECRET="<private-32-plus-character-secret>"
$env:OMNIREAD_BOOTSTRAP_ADMIN_PASSWORD="<admin-password>"
$env:OMNIREAD_DEMO_INVENTORY_PASSWORD="<inventory-password>"
$env:OMNIREAD_DEMO_SUPPLIER_PASSWORD="<supplier-password>"
$env:OMNIREAD_DEMO_CUSTOMER_PASSWORD="<customer-password>"
```

```powershell
cd omniread-backend
mvn spring-boot:run
```

Run tests:

```powershell
mvn -q test
```

## Frontend

```powershell
cd omniread-storefront-main
npm install
npm run dev
```

Validate:

```powershell
npm run build
npm run lint
```

## Demo Accounts

- Customer: `customer@omniread.local` / value of `OMNIREAD_DEMO_CUSTOMER_PASSWORD`
- Inventory Admin: `inventory@omniread.local` / value of `OMNIREAD_DEMO_INVENTORY_PASSWORD`
- System Admin: `admin@omniread.local` / value of `OMNIREAD_BOOTSTRAP_ADMIN_PASSWORD`
- Supplier: `supplier@omniread.local` / value of `OMNIREAD_DEMO_SUPPLIER_PASSWORD`

See `omniread-backend/docs/demo-script.md` and `omniread-backend/docs/srs-completion-checklist.md` for demo flow and requirement status.
