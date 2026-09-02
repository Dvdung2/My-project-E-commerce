# SHOPVN E-Commerce

SHOPVN is a full-stack e-commerce demo with a React storefront, an ASP.NET Core Web API backend, SQL Server storage, JWT authentication, role-based admin access, product/category/order management, wishlist, cart, checkout, and a dedicated admin dashboard.

## Tech Stack

- Frontend: React 18, Vite, React Router, Axios
- Backend: ASP.NET Core 8 Web API, Entity Framework Core, SQL Server
- Auth: JWT, BCrypt password hashing
- Deployment/dev orchestration: Docker Compose

## Main Features

- Storefront pages: home, product catalog, product detail
- Customer features: register, login, profile, cart, checkout, order history, wishlist
- Admin-only dashboard: overview metrics, product CRUD, category CRUD, order status management, user role management
- Role separation: admins are redirected to `/admin` and cannot create customer orders

## Routes

Frontend:

- `/` - home page
- `/products` - product catalog
- `/product/:id` - product detail
- `/admin` - admin dashboard

Backend API base URL:

- `http://localhost:5000/api`

Swagger is available in development:

- `http://localhost:5000/swagger`

## Configuration & Secrets

No secrets are committed to this repository. Configuration is supplied at
runtime via environment variables (Docker) or user secrets (local dev).

1. Copy the example file and fill in real values:

   ```powershell
   Copy-Item .env.example .env
   ```

2. Set at least these variables in `.env` (see `.env.example` for details):

   ```text
   SA_PASSWORD            # SQL Server SA password
   JWT_KEY                # random secret, >= 32 chars
   SEED_ADMIN_EMAIL       # initial admin email
   SEED_ADMIN_PASSWORD    # initial admin password
   ```

`.env` is gitignored. The backend fails fast at startup if the connection
string or JWT key is missing or too weak.

## Default Admin Account

An admin account is seeded once at startup (if no admin exists) using the
`SEED_ADMIN_*` values you configure. Public registration always creates a
**Customer** — it never grants admin rights.

## Run With Docker

From the project root (after creating `.env`):

```powershell
docker compose up --build
```

Services:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000`
- SQL Server: `localhost:1433`

Docker Compose also seeds the admin account through environment variables.

## Run Locally For Development

### 1. Start SQL Server

The easiest path is to start only SQL Server with Docker:

```powershell
docker compose up sqlserver
```

### 2. Start Backend

Provide the connection string, JWT key and seed-admin values via
[user secrets](https://learn.microsoft.com/aspnet/core/security/app-secrets)
(recommended for local dev) or environment variables, for example:

```powershell
cd Backend\E_CommerceAPI\E_CommerceAPI
dotnet user-secrets init
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=localhost;Database=EcommerceDb;User Id=sa;Password=<your-sa-password>;TrustServerCertificate=True;"
dotnet user-secrets set "Jwt:Key" "<random-secret-at-least-32-chars>"
dotnet user-secrets set "SeedAdmin:Email" "admin@example.com"
dotnet user-secrets set "SeedAdmin:Password" "<admin-password>"
dotnet run --project E_CommerceAPI.csproj
```

The backend listens on the configured ASP.NET Core ports. The frontend expects the API at `http://localhost:5000/api` unless `VITE_API_URL` is set.

### 3. Start Frontend

```powershell
cd Frontend
npm install
npm run dev
```

Open:

```text
http://localhost:5173
```

## Useful Commands

Frontend build:

```powershell
cd Frontend
npm run build
```

Backend build:

```powershell
dotnet build Backend\E_CommerceAPI\E_CommerceAPI.slnx
```

## Environment Notes

Frontend API URL can be overridden with:

```text
VITE_API_URL=http://localhost:5000/api
```

Backend secrets and settings are supplied with ASP.NET Core configuration
(user secrets) or Docker environment variables:

```text
ConnectionStrings__DefaultConnection
Jwt__Key
SeedAdmin__Email
SeedAdmin__Password
SeedAdmin__FullName
```

## Authorization Notes

- `POST /api/orders` requires an authenticated **Customer**. The customer
  name and email are taken from the JWT, not the request body.
- Admin-only endpoints (product/category/user/order management) require the
  `Admin` role.

## Project Structure

```text
Backend/
  E_CommerceAPI/
    E_CommerceAPI/
      Controllers/
      Data/
      Models/
      Migrations/
Frontend/
  src/
    components/
    context/
    pages/
    services/
docker-compose.yml
```
