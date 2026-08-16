# Help Desk System — Development Plan

### Stack

```text
Frontend
React + TypeScript
Vite
Tailwind CSS
React Router
TanStack Query
Axios
React Hook Form + Zod

Backend
ASP.NET Core Web API
Entity Framework Core
ASP.NET Core Identity
JWT Authentication

Database
PostgreSQL
```

---

## Phase 1 — Project Foundation

### Backend

- Create ASP.NET Core Web API
- Configure PostgreSQL
- Install/configure EF Core
- Configure ASP.NET Identity
- Configure JWT authentication
- Configure Swagger/OpenAPI
- Configure CORS
- Setup environment variables
- Create initial project structure

### Frontend

- Create React + TypeScript + Vite project
- Configure Tailwind
- Configure React Router
- Configure Axios
- Configure TanStack Query
- Create basic layout
- Create API client

**Goal:** Both apps run and communicate.

---

# Phase 2 — Database & Models

Create:

```text
Users
Departments
Categories
Tickets
TicketComments
TicketAttachments
TicketActivityLogs
```

Then:

- Define entities
- Define relationships
- Configure EF Core
- Create migrations
- Seed departments
- Seed categories
- Seed admin account

**Goal:**

```text
ASP.NET Core
      ↓
EF Core
      ↓
PostgreSQL
```

works correctly.

---

# Phase 3 — Authentication & Authorization

Implement:

```text
POST /auth/register
POST /auth/login
POST /auth/logout
GET  /auth/me
PUT  /auth/me
PUT  /auth/me/password
```

Roles:

```text
EMPLOYEE
TECHNICIAN
ADMIN
```

Implement:

- JWT authentication
- Password hashing
- `[Authorize]`
- Role-based authorization
- Protected React routes
- Auth state
- Automatic Axios authorization header

**Goal:**

User logs in → receives JWT → React knows the user → API knows who they are.

---

# Phase 4 — User Management

Backend:

```text
GET    /users
GET    /users/{id}
POST   /users
PUT    /users/{id}
DELETE /users/{id}
PATCH  /users/{id}/status
PATCH  /users/{id}/role
PATCH  /users/{id}/department
```

Frontend:

- Users page
- User table
- Search
- Filters
- Create user
- Edit user
- Change role
- Change department
- Activate/deactivate

**ADMIN only.**

---

# Phase 5 — Departments & Categories

Implement CRUD:

```text
Departments
Categories
```

Frontend:

```text
/departments
/categories
```

Keep these intentionally simple.

**Goal:** Finish the easy resources before tackling tickets.

---

# Phase 6 — Ticket Core

This is the main part.

Backend:

```text
GET    /tickets
POST   /tickets
GET    /tickets/{id}
PUT    /tickets/{id}
DELETE /tickets/{id}

PATCH  /tickets/{id}/assignment
PATCH  /tickets/{id}/status
PATCH  /tickets/{id}/priority
```

Implement:

- Ticket creation
- Ticket ownership
- Assignment
- Status
- Priority
- Category
- Department
- Validation
- Authorization

### Business rules

For example:

```text
EMPLOYEE
→ create tickets
→ view own tickets
→ comment

TECHNICIAN
→ view assigned tickets
→ update assigned tickets
→ resolve tickets

ADMIN
→ view all
→ assign
→ modify
→ manage everything
```

**Goal:** The basic ticket workflow works end-to-end.

---

# Phase 7 — Ticket Comments

Backend:

```text
GET  /tickets/{id}/comments
POST /tickets/{id}/comments
PUT  /tickets/{id}/comments/{commentId}
DELETE /tickets/{id}/comments/{commentId}
```

Frontend:

```text
Ticket Details
      ↓
Comments
      ↓
Add Comment
```

Implement authorization:

> Users shouldn't be able to edit/delete someone else's comments unless they're allowed to.

---

# Phase 8 — Attachments

Implement:

```text
GET    /tickets/{id}/attachments
POST   /tickets/{id}/attachments
GET    /tickets/{id}/attachments/{attachmentId}
DELETE /tickets/{id}/attachments/{attachmentId}
```

Backend:

- `multipart/form-data`
- File validation
- Size limits
- MIME validation
- File storage
- Metadata in DB

Frontend:

- Upload
- List attachments
- Download
- Delete

---

# Phase 9 — Activity Logs

Whenever something important happens:

```text
Ticket created
Ticket assigned
Status changed
Priority changed
Comment added
Attachment uploaded
Ticket resolved
Ticket reopened
```

Create:

```text
ticket_activity_logs
```

Backend:

```text
GET /tickets/{id}/activity
```

Admin:

```text
GET /activity-logs
```

Frontend:

```text
Ticket Details
      ↓
Activity
      ↓
Timeline
```

Example:

```text
10:32 AM  Jun created this ticket

10:40 AM  Admin assigned ticket to Mark

10:55 AM  Mark changed status
          OPEN → IN_PROGRESS

11:30 AM  Mark resolved the ticket
```

---

# Phase 10 — Dashboard

Backend:

```text
GET /dashboard/summary
GET /dashboard/tickets-by-status
GET /dashboard/tickets-by-priority
GET /dashboard/tickets-by-category
GET /dashboard/tickets-by-department
```

Frontend:

```text
Total Tickets
Open
In Progress
Resolved
Closed
Critical
```

Charts:

- Status
- Priority
- Category
- Department

Different dashboard views depending on role.

---

# Phase 11 — Frontend Polish

Now make the React app feel like an actual product.

Add:

- Loading states
- Skeletons
- Empty states
- Error states
- Toast notifications
- Confirmation dialogs
- Form validation
- Pagination
- Search
- Filters
- Responsive sidebar
- Mobile layout

Don't spend time making it beautiful before the functionality works.

---

# Phase 12 — API Hardening

Now focus on backend quality.

Implement:

### Validation

```text
Required fields
Email validation
Ticket title limits
File limits
```

### Error handling

Consistent response:

```json
{
  "message": "Ticket not found"
}
```

### HTTP status codes

```text
200 OK
201 Created
204 No Content
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Unprocessable Entity
500 Internal Server Error
```

### Security

- CORS
- JWT expiration
- Authorization checks
- File validation
- Rate limiting
- No sensitive data in responses

---

# Phase 13 — Testing

Backend:

```text
Authentication
Ticket creation
Ticket assignment
Status transitions
Authorization
Comments
Attachments
```

Especially test:

> Can Employee A access Employee B's ticket?

> Can Employee change a ticket they're not supposed to modify?

> Can Technician assign themselves to arbitrary tickets?

Those are more important than just testing CRUD.

---

# Phase 14 — Deployment

Eventually:

```text
React
   ↓
Vercel / Static Hosting

ASP.NET API
   ↓
Docker
   ↓
Cloud hosting

PostgreSQL
   ↓
Managed PostgreSQL
```

Then:

```text
Production
    ↓
HTTPS
    ↓
React
    ↓
ASP.NET API
    ↓
PostgreSQL
```

---

# 🎯 Definition of Done

I'd consider the project **v1 complete** when you can do this:

```text
LOGIN
  ↓
Dashboard
  ↓
Employee creates ticket
  ↓
Admin sees ticket
  ↓
Admin assigns technician
  ↓
Technician receives ticket
  ↓
Technician comments
  ↓
Technician changes status
  ↓
Technician resolves
  ↓
Employee sees resolution
  ↓
Employee closes ticket
  ↓
Activity log records everything
```

And the whole thing works through:

**React → ASP.NET Core API → EF Core → PostgreSQL**

That's a genuinely solid portfolio project.

### Development order

If we actually build this together, I'd follow exactly:

```text
1. Foundation
2. Database
3. Authentication
4. Users
5. Departments
6. Categories
7. Tickets
8. Comments
9. Attachments
10. Activity Logs
11. Dashboard
12. Polish
13. Testing
14. Deployment
```
