# HelpDesk

A full-stack help desk ticketing system. Employees create tickets, technicians resolve them, and admins manage everything.

## Stack

| Layer | Tech |
| --- | --- |
| Backend | ASP.NET Core Web API (.NET 10), EF Core (SQLite), ASP.NET Core Identity + JWT |
| Frontend | React + TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, Axios, React Hook Form + Zod |

## Structure

```
server/   ASP.NET Core Web API
client/   React + Vite frontend
```

## Run locally

### Backend

```bash
cd server
dotnet run
```

- API: `http://localhost:5000`
- Swagger: `http://localhost:5000/swagger`

### Frontend

```bash
cd client
npm install
npm run dev
```

- App: `http://localhost:5173`

The frontend calls the API at `VITE_API_URL` (defaults to `http://localhost:5000/api/v1`).

## Documentation

- [plan.md](./plan.md) — development roadmap
- [schema.md](./schema.md) — database schema
- [rest-api-design.md](./rest-api-design.md) — REST API design
- [client-side.md](./client-side.md) — frontend architecture
