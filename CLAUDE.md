# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CloudGraph IDE is a browser-based "Visual Infrastructure as Code" generator that compiles visual diagrams into Terraform (HCL) code. It uses a "Canvas-as-Compiler" approach where users design AWS architecture through spatial containment (dragging resources into networks) rather than abstract connections.

## Development Commands

### Frontend (React + Vite)
```bash
cd frontend
npm install          # Install dependencies
npm run dev          # Start dev server (port 5173)
npm run build        # TypeScript compile + Vite build
npm run lint         # Run ESLint
```

### Backend (Python + FastAPI)
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Docker (Full Stack)
```bash
docker-compose up --build   # Start all services (db, backend, frontend)
docker-compose up -d db     # Start PostgreSQL only
# Frontend: http://localhost:5173
# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
# PostgreSQL: localhost:5432 (user: cloudgraph, password: cloudgraph)
```

## Architecture

### Frontend
- **React Flow** for the visual canvas with parent/child node hierarchy
- **Zustand** for global state management (`frontend/src/app/store.ts`)
- **Shadcn/UI** components in `frontend/src/components/ui/`
- Path alias: `@/` maps to `frontend/src/`

Key files:
- `features/canvas/Canvas.tsx` - Main canvas with drag-drop and node parenting logic
- `features/canvas/utils/validation.tsx` - Placement rules (what can go where)
- `features/canvas/nodes/` - Node type components (VpcNode, SubnetNode, ServiceNode)
- `app/store.ts` - React Flow state management
- `app/authStore.ts` - Authentication state (user, login, logout)
- `lib/api.ts` - API client with JWT interceptor
- `pages/` - LoginPage, RegisterPage, DashboardPage, EditorPage
- `components/ProtectedRoute.tsx` - Route guard for authenticated pages

### Backend
- **FastAPI** with Pydantic validation
- **SQLModel** for ORM with PostgreSQL
- **JWT** authentication with passlib/python-jose
- **Jinja2** templates for Terraform code generation

Key files:
- `app/main.py` - FastAPI app with CORS middleware
- `app/core/db.py` - Database engine and session management
- `app/core/security.py` - Password hashing and JWT token handling
- `app/models.py` - User and Project SQLModel definitions
- `app/api/v1/endpoints/auth.py` - Login/signup endpoints
- `app/api/v1/endpoints/projects.py` - CRUD for user projects
- `app/api/v1/endpoints/generator.py` - POST `/api/v1/generate` endpoint
- `app/services/tf_engine.py` - Terraform code generator
- `app/templates/aws/main.tf.j2` - Jinja2 template for Terraform output

### Database
- **PostgreSQL 15** via Docker
- Tables: `user`, `project`
- Project stores `diagram_data` (JSON) and `meta_data` (JSON)

### Authentication Flow
1. User registers/logs in via `/login` or `/register`
2. Backend returns JWT token stored in localStorage
3. API client attaches `Authorization: Bearer <token>` to all requests
4. Protected routes redirect to `/login` if no valid token
5. Projects are scoped to authenticated user

### Diagram Data Flow
1. User drags resources on canvas (VPC → Subnet → EC2/RDS/S3)
2. Frontend validates placement via `validatePlacement()` rules
3. React Flow nodes have `parentNode` property for containment hierarchy
4. "Save" button POSTs nodes/edges to `/api/v1/projects/{id}`
5. On "Generate", frontend POSTs nodes/edges to `/api/v1/generate`
6. Backend enriches data and renders Jinja2 templates to Terraform HCL

## Node Hierarchy Rules

- **VPC**: Top-level container, no parent required
- **Subnet**: Must be inside a VPC
- **EC2/RDS**: Must be inside a Subnet
- **S3**: Exception - can exist outside containers (global resource)

## Key Patterns

- Node types use React Flow's `parentNode` for spatial containment
- Z-index layering: VPC (10) < Subnet (20) < Resources (30)
- Service nodes use `data.type` to distinguish EC2/RDS/S3 within `type: 'service'`
- Terraform resource IDs are sanitized (hyphens/spaces → underscores, lowercase)

## Development Agents

Specialized agents are configured in `.claude/agents/` for focused development:

| Agent | Scope | Use For |
|-------|-------|---------|
| `frontend` | `frontend/src/` | React, React Flow, Zustand, Tailwind/Shadcn |
| `backend` | `backend/` | FastAPI, Pydantic, Python services |
| `terraform` | `backend/app/templates/` | Jinja2 templates, HCL, AWS resources |
| `integration` | Full stack | API contracts, schema alignment, Docker |
| `test` | Both ends | Vitest, Pytest, test infrastructure |
| `devops` | Infrastructure | Docker, CI/CD, deployment |

Use `/agents` command to view and invoke these agents.
