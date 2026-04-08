# FinGuard API

![Java](https://img.shields.io/badge/Java-17-007396?style=flat&logo=openjdk&logoColor=white)
![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.2-6DB33F?style=flat&logo=springboot&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat&logo=react&logoColor=black)
![License](https://img.shields.io/badge/License-MIT-green?style=flat)

A production-ready full-stack financial data management system. Secure JWT authentication, role-based access control, ownership-enforced record management, and real-time analytics — all deployable with a single command.

---

## Problem Statement

Financial systems require strict data isolation: users must only access their own records, roles must enforce what operations are permitted, and the system must fail safely with structured error responses. Most tutorials skip these concerns. FinGuard implements them correctly.

---

## Features

- **JWT Authentication** — stateless, 24-hour tokens, brute-force lockout after 5 failed attempts
- **Role-Based Access Control** — three-tier model: `ROLE_VIEWER`, `ROLE_ANALYST`, `ROLE_ADMIN`
- **Ownership Validation** — users can only read/update their own records; ADMIN has full access
- **Financial Records CRUD** — create, read, update, soft-delete with full input validation
- **Dashboard Analytics** — income/expense totals, net balance, category breakdown, monthly trends
- **Duplicate Prevention** — application-level + DB partial unique index
- **Structured Error Responses** — consistent JSON for all 400/401/403/404/409/500 cases
- **Audit Logging** — structured `key=value` logs for all security and business events
- **Zero-Touch Startup** — roles and admin user auto-seeded on first boot
- **React Frontend** — login, register, dashboard with charts, records with edit/delete

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     React Frontend                       │
│  Login → Register → Dashboard (charts) → Records (CRUD) │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP + JWT Bearer
┌────────────────────────▼────────────────────────────────┐
│                   Spring Boot API                        │
│                                                          │
│  StrictQueryParamFilter → JwtAuthenticationFilter        │
│           ↓                                              │
│  Controller → Service (ownership check) → Repository    │
│           ↓                                              │
│  GlobalExceptionHandler (structured JSON errors)         │
└────────────────────────┬────────────────────────────────┘
                         │ JDBC
┌────────────────────────▼────────────────────────────────┐
│                    PostgreSQL 16                          │
│  users · roles · user_roles · financial_records          │
└─────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | Java 17 |
| Framework | Spring Boot 3.2 |
| Security | Spring Security 6 + JJWT 0.11 |
| Persistence | Spring Data JPA (Hibernate) |
| Database | PostgreSQL 16 |
| Containerization | Docker + Docker Compose |
| API Docs | Springdoc OpenAPI 3 (Swagger UI) |
| Frontend | React 18 + Vite + Tailwind CSS |
| HTTP Client | Axios |
| Charts | Recharts |

---

## Getting Started

**Requires:** Docker and Docker Compose

```bash
git clone https://github.com/singam-naresh/finance-dashboard-backend.git
cd finance-dashboard-backend/finance-dashboard

# Optional: copy and edit environment variables
cp .env.example .env

docker compose up --build
```

On first boot:
1. PostgreSQL starts and passes healthcheck
2. Spring Boot creates all tables via Hibernate DDL
3. `DataInitializer` seeds 3 roles + admin user
4. API is ready on `http://localhost:8080`

Confirm successful startup:
```
event=ROLES_SEEDED count=3
event=ADMIN_SEEDED username=admin
event=SYSTEM_READY users=1 roles=3 db=connected
```

---

## Default Credentials

| Field | Value |
|---|---|
| Username | `admin` |
| Password | `Admin@123` |
| Role | `ROLE_ADMIN` |

> Rotate credentials and `JWT_SECRET` before any production deployment.

---

## API Flow

```
POST /api/auth/register   → creates account (ROLE_ANALYST by default)
POST /api/auth/login      → returns JWT token
GET  /api/records         → list records (token required)
POST /api/records         → create record (ANALYST / ADMIN)
GET  /api/dashboard/summary → analytics (ANALYST / ADMIN)
```

### Login example

```bash
curl -s -X POST http://localhost:8080/api/auth/login \
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

Use the token:
```bash
curl http://localhost:8080/api/dashboard/summary \
  -H "Authorization: Bearer eyJ..."
```

---

## Role Matrix

| Endpoint | VIEWER | ANALYST | ADMIN |
|---|---|---|---|
| `GET /api/records` | ✅ | ✅ | ✅ |
| `GET /api/records/{id}` (own) | ✅ | ✅ | ✅ |
| `GET /api/records/{id}` (other) | ❌ 403 | ❌ 403 | ✅ |
| `POST /api/records` | ❌ 403 | ✅ | ✅ |
| `PUT /api/records/{id}` (own) | ❌ 403 | ✅ | ✅ |
| `PUT /api/records/{id}` (other) | ❌ 403 | ❌ 403 | ✅ |
| `DELETE /api/records/{id}` | ❌ 403 | ❌ 403 | ✅ |
| `GET /api/dashboard/summary` | ❌ 403 | ✅ | ✅ |
| `GET /api/users` | ❌ 403 | ❌ 403 | ✅ |

---

## Test Scenarios

| Scenario | Expected |
|---|---|
| Login with `admin / Admin@123` | `200` + JWT |
| Register new user | `201` + user object |
| ANALYST creates record | `201` |
| ANALYST reads own record by ID | `200` |
| ANALYST reads another user's record | `403` |
| ANALYST updates own record | `200` |
| ANALYST updates another user's record | `403` |
| VIEWER accesses dashboard | `403` |
| ADMIN accesses dashboard | `200` |
| Invalid enum value in request | `400` with `fieldErrors` |
| Duplicate record | `409` |
| Record not found | `404` |
| 5 failed logins | `429` lockout |

---

## API Documentation

```
http://localhost:8080/swagger-ui.html
```

OpenAPI JSON:
```
http://localhost:8080/api-docs
```

Health check:
```
http://localhost:8080/actuator/health
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

---

## Project Structure

```
finance-dashboard/          ← Spring Boot backend
├── src/main/java/com/finance/dashboard/
│   ├── config/             DataInitializer, SecurityConfig
│   ├── controller/         Auth, Records, Dashboard, Users
│   ├── dto/                Request/response DTOs
│   ├── exception/          GlobalExceptionHandler + domain exceptions
│   ├── model/              User, Role, FinancialRecord
│   ├── repository/         JPA repos with custom queries
│   ├── security/           JWT filter, entry points, UserDetailsService
│   └── service/            Business logic + ownership validation
├── Dockerfile
└── docker-compose.yml

frontend/                   ← React + Vite frontend
├── src/
│   ├── components/         Layout, StatCard, AddRecordModal, ConfirmDialog, Toast
│   ├── hooks/              useToast
│   ├── pages/              Login, Register, Dashboard, Records
│   └── services/           api.js (Axios + JWT interceptor)
└── Dockerfile
```

---

## Key Engineering Decisions

**Ownership validation in service layer** — not in controllers or filters. The service has full context (authenticated user + record owner) to make the decision cleanly.

**`CommandLineRunner` over SQL scripts** — eliminates the Hibernate DDL vs. SQL init race condition that causes `relation does not exist` errors in Docker.

**Single source of truth for authorization** — `SecurityConfig` defines HTTP-level rules; service layer enforces data-level ownership. No duplicate `@PreAuthorize` annotations.

**Structured error responses** — every exception maps to a consistent JSON shape. Enum deserialization failures return `fieldErrors` matching the validation error format.

**Stateless JWT** — no server-side session. Horizontally scalable without sticky sessions.

---

## Future Improvements

- **Redis-backed rate limiting** — replace Caffeine for multi-instance deployments
- **Refresh token flow** — short-lived access + long-lived refresh tokens
- **CI/CD pipeline** — GitHub Actions: test → build → push → deploy
- **CSV/PDF export** — filtered record export for reporting
