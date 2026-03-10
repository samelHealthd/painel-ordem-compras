# PAINEL ORDEM DE COMPRAS

## Overview
Backend API for the Purchase Orders Control Panel (Painel de Controle das Ordens de Compra). This backend is designed to communicate with a Lovable frontend and also includes a built-in dashboard.

## Architecture
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Frontend**: React with Vite (dashboard mirror)
- **CORS**: Enabled for cross-origin requests from Lovable

## Data Model
- `ordens_compra`: Purchase orders with status (P=Pending, A=Approved, R=Rejected)
- `centros_custo`: Cost centers (TI, Financeiro, Administrativo, Operações, RH)
- `users`: User authentication table

## API Endpoints

### Purchase Orders
- `GET /api/ordens-compra` - List all orders (supports filters: dtInicio, dtFim, cdCentroCusto, status)
- `GET /api/ordens-compra/pendentes` - List pending orders
- `GET /api/ordens-compra/aprovadas` - List approved orders
- `GET /api/ordens-compra/reprovadas` - List rejected orders
- `GET /api/ordens-compra/:id` - Get order by ID
- `POST /api/ordens-compra` - Create new order
- `PUT /api/ordens-compra/:id` - Update order
- `DELETE /api/ordens-compra/:id` - Delete order
- `POST /api/ordens-compra/:id/aprovar` - Approve order (requires nmAprovador)
- `POST /api/ordens-compra/:id/reprovar` - Reject order (requires nmAprovador)

### Cost Centers
- `GET /api/centros-custo` - List all cost centers
- `POST /api/centros-custo` - Create cost center

### Dashboard
- `GET /api/dashboard/stats` - Get statistics (total/value by status)

### Health
- `GET /api/health` - Health check

## Key Files
- `shared/schema.ts` - Database schema and types
- `server/routes.ts` - API routes with CORS
- `server/storage.ts` - Database storage layer
- `server/db.ts` - Database connection
- `server/seed.ts` - Seed data (24 sample orders)
- `client/src/pages/dashboard.tsx` - Frontend dashboard

## Running
- `npm run dev` - Start development server
- `npm run db:push` - Push schema to database
