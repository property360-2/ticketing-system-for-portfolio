React
TypeScript
Vite
React Router
TanStack Query
Axios
Tailwind CSS
React Hook Form
Zod

1. App structure
   src/
   │
   ├── app/
   │ ├── router.tsx
   │ ├── providers.tsx
   │ └── queryClient.ts
   │
   ├── api/
   │ ├── axios.ts
   │ ├── auth.api.ts
   │ ├── users.api.ts
   │ ├── tickets.api.ts
   │ ├── comments.api.ts
   │ ├── attachments.api.ts
   │ ├── departments.api.ts
   │ ├── categories.api.ts
   │ └── dashboard.api.ts
   │
   ├── components/
   │ ├── ui/
   │ ├── layout/
   │ ├── tickets/
   │ └── users/
   │
   ├── features/
   │ ├── auth/
   │ ├── tickets/
   │ ├── users/
   │ ├── departments/
   │ ├── categories/
   │ └── dashboard/
   │
   ├── pages/
   │ ├── LoginPage.tsx
   │ ├── DashboardPage.tsx
   │ ├── TicketsPage.tsx
   │ ├── TicketDetailsPage.tsx
   │ ├── CreateTicketPage.tsx
   │ ├── UsersPage.tsx
   │ ├── DepartmentsPage.tsx
   │ └── CategoriesPage.tsx
   │
   ├── hooks/
   │
   ├── types/
   │
   └── main.tsx
2. Main layout

After login:

┌───────────────────────────────────────────────┐
│ HelpDesk 👤 Jun │
├──────────────┬────────────────────────────────┤
│ │ │
│ Dashboard │ │
│ │ PAGE CONTENT │
│ Tickets │ │
│ │ │
│ Users │ │
│ Departments │ │
│ Categories │ │
│ │ │
└──────────────┴────────────────────────────────┘

But the sidebar should depend on role.

Employee
Dashboard
My Tickets
Create Ticket
Technician
Dashboard
Tickets
My Assigned Tickets
Admin
Dashboard
Tickets
Users
Departments
Categories
Activity Logs 3. Pages
Login
/login

Simple:

Email
Password
[ Login ]
Dashboard
/dashboard

Cards:

┌──────────┐ ┌──────────┐ ┌──────────┐
│ Total │ │ Open │ │ Progress │
│ 124 │ │ 32 │ │ 18 │
└──────────┘ └──────────┘ └──────────┘

┌──────────┐ ┌──────────┐
│ Resolved │ │ Critical │
│ 61 │ │ 4 │
└──────────┘ └──────────┘

Then charts:

Tickets by status
Tickets by priority
Tickets by category 4. Tickets
/tickets

Table:

ID Title Priority Status Assigned
102 WiFi not working HIGH IN_PROGRESS Mark
103 Can't login MEDIUM OPEN -
104 PC won't boot CRITICAL OPEN Ana

Controls:

[ Search ]

Status ▼
Priority ▼
Category ▼
Department ▼

[ Create Ticket ]

Pagination at bottom.

5. Ticket details
   /tickets/:id

Something like:

← Back to Tickets

#102 WiFi not working

HIGH IN_PROGRESS
IT Department

Reported by: Jun
Assigned to: Mark
Created: Aug 16, 2026

────────────────────────────

Description

My computer cannot connect to the
office WiFi.

────────────────────────────

Comments

Jun
My WiFi isn't working.

Mark
I'll check it.

Mark
Fixed. Network adapter was disabled.

────────────────────────────

[ Write a comment... ]

[ Send ]

Admin/technician can have:

Status [ IN_PROGRESS ▼ ]
Priority [ HIGH ▼ ]
Assigned to [ Mark ▼ ] 6. Create ticket
/tickets/create

Form:

Title
[________________________]

Category
[ Network ▼ ]

Priority
[ Medium ▼ ]

Description
[ ]
[ ]
[ ]

Attachments
[ Choose files ]

        [ Create Ticket ]

Employee shouldn't choose:

created_by

The backend gets that from the authenticated user.

Same with tenant/user ownership—don't trust the client for those.

7. Users

Admin only:

/users
Name Email Role Department Status
Jun jun@email.com Employee IT Active
Mark mark@email.com Technician IT Active
Ana ana@email.com Admin IT Active

Actions:

Edit
Deactivate
Change Role
Change Department 8. Departments
/departments

Simple CRUD table.

IT Support 12 users
Finance 8 users
HR 5 users 9. Categories
/categories
Hardware
Software
Network
Account
Access
Other

Admin can create/edit/deactivate.

10. Client-side state

I wouldn't use Redux for this project.

Use:

TanStack Query

For server state:

tickets
users
departments
categories
dashboard
comments

Example:

useQuery()
useMutation()
Small auth store

For things like:

currentUser
token
isAuthenticated

You can use Zustand, or even Context if you want to keep it simple.

11. API layer

Don't call Axios directly from components.

Bad:

TicketPage
↓
axios.get(...)

Better:

TicketPage
↓
useTickets()
↓
tickets.api.ts
↓
Axios
↓
ASP.NET API

For example:

tickets.api.ts

getTickets()
getTicket(id)
createTicket(data)
updateTicket(id, data)
updateTicketStatus(id, status)
assignTicket(id, userId)

Then React components don't care about URLs.

12. Authentication flow
    Login Page
    │
    │ POST /api/v1/auth/login
    ▼
    ASP.NET API
    │
    ▼
    JWT
    │
    ▼
    Client stores auth state
    │
    ▼
    Axios adds Authorization header
    │
    ▼
    Protected API

Then:

Authorization: Bearer <token> 13. Route protection
/login

Public.

Everything else:

/dashboard
/tickets
/users
/departments
/categories

Protected.

Then role-based:

/users
↓
ADMIN only
/tickets
↓
EMPLOYEE
TECHNICIAN
ADMIN
Final client architecture
React
│
React Router
│
┌───────┴───────┐
│ │
Pages Components
│
▼
Features
│
▼
TanStack Query
│
▼
API Layer
│
▼
Axios
│
▼
ASP.NET Core API
