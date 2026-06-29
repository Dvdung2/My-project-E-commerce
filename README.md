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

## Default Admin Account

The admin account is seeded when the backend starts and no admin exists:

```text
Email: admin@shopvn.local
Password: Admin123!
```

## Run With Docker

From the project root:

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

```powershell
cd Backend\E_CommerceAPI
dotnet run --project E_CommerceAPI\E_CommerceAPI.csproj
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

Backend connection string and seed admin settings can be overridden with ASP.NET Core configuration or Docker environment variables:

```text
ConnectionStrings__DefaultConnection
SeedAdmin__Email
SeedAdmin__Password
SeedAdmin__FullName
```

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
