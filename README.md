# FinGuard — Full-Stack Finance Dashboard

![Java](https://img.shields.io/badge/Java-17-007396?style=flat&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.2-6DB33F?style=flat&logo=springboot&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3.4-38BDF8?style=flat&logo=tailwindcss&logoColor=white)

A production-grade full-stack financial management system. Secure JWT authentication, role-based access control, per-user data privacy, real-time analytics dashboard, and a modern React frontend — all deployable with a single command.

---

## What We Built

FinGuard is a multi-user financial tracking SaaS application where:

- Each user can **register, login, and manage their own financial records** (income & expenses)
- **Data is fully private** — users only see their own records and dashboard stats
- **Admins** have elevated access to view all records, manage users, and see global analytics
- The **dashboard** shows real-time KPIs, charts, monthly breakdowns, and recent transactions
- Everything runs in **Docker** — one command starts the entire stack

---

## Features

- **JWT Authentication** — stateless login/register, 24-hour tokens, brute-force lockout
- **Role-Based Access Control** — `ROLE_VIEWER`, `ROLE_ANALYST`, `ROLE_ADMIN`
- **Per-User Data Privacy** — users only see their own records and dashboard
- **Financial Records CRUD** — create, read, update, soft-delete with full validation
- **Dashboard Analytics** — income/expense totals, net balance, category breakdown, monthly trends
- **Duplicate Prevention** — application-level + DB partial unique index
- **Ownership Validation** — users can only edit their own records; ADMIN has full access
- **Structured Error Responses** — consistent JSON for all 400/401/403/404/409 cases
- **Audit Logging** — structured `key=value` logs for all security and business events
- **Zero-Touch Startup** — roles and admin user auto-seeded on first boot
- **React Frontend** — login, register, personal dashboard, records with edit/delete/export
- **INR Currency** — all amounts displayed in Indian Rupee format (₹)
- **Export CSV** — download your records as a CSV file

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | Java 17 |
| Backend Framework | Spring Boot 3.2 |
| Security | Spring Security 6 + JJWT 0.11 |
| Persistence | Spring Data JPA (Hibernate) |
| Database | PostgreSQL 16 |
| Containerization | Docker + Docker Compose |
| API Docs | Springdoc OpenAPI 3 (Swagger UI) |
| Rate Limiting | Caffeine Cache |
| Frontend | React 18 + Vite 5 |
| Styling | Tailwind CSS 3.4 |
| HTTP Client | Axios |
| Charts | Recharts |
| Build Tool | Maven 3.9 |

---

## Project Structure

```
finance-dashboard-backend/
├── finance-dashboard/          ← Spring Boot backend
│   ├── src/main/java/com/finance/dashboard/
│   │   ├── config/             DataInitializer, SecurityConfig
│   │   ├── controller/         Auth, Records, Dashboard, Users
│   │   ├── dto/                Request/response DTOs
│   │   ├── exception/          GlobalExceptionHandler + domain exceptions
│   │   ├── model/              User, Role, FinancialRecord
│   │   ├── repository/         JPA repos with user-scoped queries
│   │   ├── security/           JWT filter, access denied handler, UserDetailsService
│   │   └── service/            Business logic + ownership validation
│   ├── Dockerfile
│   ├── docker-compose.yml
│   └── pom.xml
│
└── frontend/                   ← React + Vite frontend
    ├── src/
    │   ├── components/         Layout, StatCard, AddRecordModal, ConfirmDialog, Toast, Skeleton
    │   ├── hooks/              useToast
    │   ├── pages/              Login, Register, Dashboard, Records
    │   ├── services/           api.js (Axios + JWT interceptor)
    │   └── utils/              formatCurrency.js, exportCsv.js
    ├── Dockerfile
    └── package.json
```

---

## Getting Started

### Prerequisites
- Docker and Docker Compose installed

### Run the full stack (backend + database)

```bash
git clone https://github.com/singam-naresh/finance-dashboard-backend.git
cd finance-dashboard-backend/finance-dashboard
docker compose up --build
```

On first boot the system automatically:
1. Starts PostgreSQL and waits for readiness
2. Creates all tables via Hibernate DDL
3. Seeds `ROLE_ADMIN`, `ROLE_ANALYST`, `ROLE_VIEWER`
4. Creates the default admin user
5. Starts the API on port `8080`

Confirm successful startup:
```
event=ROLES_SEEDED count=3
event=ADMIN_SEEDED username=admin
event=SYSTEM_READY users=1 roles=3 db=connected
```

### Run the frontend (development)

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:3000`

---

## Role System

| Role | Records | Dashboard | Delete | User Management |
|---|---|---|---|---|
| `ROLE_VIEWER` | Read own | ❌ | ❌ | ❌ |
| `ROLE_ANALYST` | Read + Write own | ✅ own data | ❌ | ❌ |
| `ROLE_ADMIN` | Full access | ✅ global | ✅ | ✅ |

**New users** registered via `/api/auth/register` are assigned `ROLE_ANALYST` by default.

---

## API Overview

| Group | Base Path | Access |
|---|---|---|
| Authentication | `/api/auth` | Public |
| Financial Records | `/api/records` | VIEWER+ |
| Dashboard Analytics | `/api/dashboard` | ANALYST+ |
| User Management | `/api/users` | ADMIN only |

### Authentication
```
POST /api/auth/register   → create account
POST /api/auth/login      → get JWT token
```

### Login example
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@123"}'
```

Response:
```json
{
  "token": "eyJ...",
  "tokenType": "Bearer",
  "username": "admin",
  "roles": ["ROLE_ADMIN"]
}
```

Use the token for protected endpoints:
```bash
curl http://localhost:8080/api/dashboard/summary \
  -H "Authorization: Bearer eyJ..."
```

---

## API Documentation (Swagger)

```
http://localhost:8080/swagger-ui.html
```

---

## Health Check

```
GET http://localhost:8080/actuator/health
→ {"status":"UP"}
```

---

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `POSTGRES_DB` | Database name | `finance_db` |
| `POSTGRES_USER` | DB username | `finance_user` |
| `POSTGRES_PASSWORD` | DB password | `finance_pass` |
| `JWT_SECRET` | Base64-encoded 256-bit HMAC key | dev default |
| `JWT_EXPIRATION_MS` | Token TTL in ms | `86400000` (24h) |

Copy `.env.example` to `.env` for local overrides.

---

## Key Engineering Decisions

**Per-user data scoping** — `getAll()`, `filterByType()`, `filterByCategory()` check the authenticated user's role. Non-admins only receive their own records. The frontend adds a second safety filter on top.

**`CommandLineRunner` over SQL scripts** — eliminates the Hibernate DDL vs. SQL init race condition. Roles and admin are seeded after the full application context is ready.

**Stateless JWT** — no server-side session. Horizontally scalable without sticky sessions.

**Dual-layer duplicate prevention** — application check before insert + DB unique constraint.

**Ownership validation** — `update()` and `getById()` check that the authenticated user owns the record before proceeding. ADMIN bypasses this check.

**Structured logs** — `key=value` pairs on every audit event. Zero configuration needed to ingest into ELK, Datadog, or CloudWatch.

---

## Test Scenarios

| Scenario | Expected |
|---|---|
| Register new user | `201` — assigned `ROLE_ANALYST` |
| Login with valid credentials | `200` + JWT token |
| Login with wrong password | `401` |
| 5 failed logins | `429` — account locked 5 min |
| ANALYST creates record | `201` — owned by that user |
| ANALYST reads own record | `200` |
| ANALYST reads another user's record | `403` |
| ANALYST updates own record | `200` |
| ANALYST updates another user's record | `403` |
| VIEWER accesses dashboard | `403` |
| ADMIN accesses dashboard | `200` — global data |
| Invalid enum in request body | `400` with `fieldErrors` |
| Duplicate record | `409` |
| Record not found | `404` |

---

## Future Improvements

- Redis-backed rate limiting for multi-instance deployments
- Refresh token flow
- CI/CD pipeline with GitHub Actions
- CSV/PDF export from backend
- Email notifications
