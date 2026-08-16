```text
users
departments
categories
tickets
ticket_comments
ticket_attachments
ticket_activity_logs
```

## 1. `users`

```text
users
----------------
id                  PK
department_id       FK NULL
name
email               UNIQUE
password_hash
role
is_active
created_at
updated_at
```

Roles:

```text
EMPLOYEE
TECHNICIAN
ADMIN
```

`department_id` allows:

```text
IT
HR
Finance
Operations
```

---

## 2. `departments`

```text
departments
----------------
id                  PK
name
description
created_at
updated_at
```

Example:

```text
IT Support
Human Resources
Finance
Operations
```

A department can have many users.

```text
Department 1 ──── * Users
```

---

## 3. `categories`

```text
categories
----------------
id                  PK
name
description
created_at
updated_at
```

Examples:

```text
Hardware
Software
Network
Account
Access
Other
```

Keeping this as a table instead of an enum makes it easier for admins to add categories later.

---

## 4. `tickets`

The heart of the system.

```text
tickets
----------------
id                  PK

created_by_id       FK → users.id
assigned_to_id      FK → users.id NULL
category_id         FK → categories.id
department_id       FK → departments.id

title
description

priority
status

created_at
updated_at
resolved_at         NULL
closed_at           NULL
```

### Why `department_id` here?

Because a ticket can be directed to a department.

Example:

```text
Employee
   ↓
"My laptop won't connect to WiFi"
   ↓
IT Department
   ↓
Technician
```

And then:

```text
department_id = IT
assigned_to_id = Mark
```

---

# 5. `ticket_comments`

Communication/history between users.

```text
ticket_comments
----------------
id                  PK
ticket_id           FK
user_id             FK

content

created_at
updated_at
```

Example:

```text
Jun:
"WiFi isn't working."

Mark:
"I'll check the device."

Mark:
"Fixed. Network adapter was disabled."
```

---

# 6. `ticket_attachments`

For screenshots, documents, etc.

```text
ticket_attachments
----------------
id                  PK
ticket_id           FK
uploaded_by_id      FK

file_name
file_path
file_size
mime_type

created_at
```

Don't store the actual file inside PostgreSQL.

Store something like:

```text
/uploads/tickets/102/error-screenshot.png
```

Database stores the metadata/path.

---

# 7. `ticket_activity_logs`

This is different from comments.

**Comments = communication.**

**Activity logs = system history.**

Example:

```text
Ticket #102

Jun created the ticket
Mark was assigned
Priority changed from MEDIUM → HIGH
Status changed OPEN → IN_PROGRESS
Mark added a comment
Status changed IN_PROGRESS → RESOLVED
Jun closed the ticket
```

Schema:

```text
ticket_activity_logs
----------------
id                  PK
ticket_id           FK
user_id             FK

action
old_value           NULL
new_value           NULL

created_at
```

Example:

```text
action: STATUS_CHANGED
old_value: OPEN
new_value: IN_PROGRESS
```

---

# Complete relationship

```text
                         ┌──────────────┐
                         │ DEPARTMENTS  │
                         └──────┬───────┘
                                │
                                │ 1:N
                                ▼
┌──────────────┐          ┌──────────────┐
│    USERS     │─────────▶│    USERS     │
└──────┬───────┘          └──────────────┘
       │
       │
       │ creates / assigns
       ▼
┌─────────────────────────────────┐
│             TICKETS             │
├─────────────────────────────────┤
│ created_by_id                   │
│ assigned_to_id                  │
│ department_id                   │
│ category_id                     │
└───────┬─────────┬─────────┬─────┘
        │         │         │
        ▼         ▼         ▼
   COMMENTS   ATTACHMENTS  ACTIVITY
```

And:

```text
CATEGORIES
     │
     │ 1:N
     ▼
  TICKETS
```

---

# Status

I'd use:

```text
OPEN
IN_PROGRESS
RESOLVED
REOPENED
CLOSED
```

Flow:

```text
OPEN
  ↓
IN_PROGRESS
  ↓
RESOLVED
  ↓
CLOSED
```

Or:

```text
RESOLVED
   ↓
REOPENED
   ↓
IN_PROGRESS
```

---

# Priority

```text
LOW
MEDIUM
HIGH
CRITICAL
```

---

# Complete feature scope

With those 7 tables, you can build:

### Employee

- Create ticket
- View own tickets
- Comment
- Upload attachment
- Reopen resolved ticket
- Close resolved ticket

### Technician

- View assigned tickets
- Accept/work on ticket
- Comment
- Upload files
- Resolve ticket

### Admin

- Manage users
- Manage departments
- Manage categories
- Assign technicians
- Change priority
- View all tickets
- View activity logs
- Dashboard/statistics

### Dashboard

```text
Total Tickets
Open
In Progress
Resolved
Closed
Critical Tickets
Tickets by Department
Tickets by Category
```
