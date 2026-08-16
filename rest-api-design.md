👥 USERS

Admin only for most of these.

GET /api/v1/users
GET /api/v1/users/{id}

POST /api/v1/users
PUT /api/v1/users/{id}
DELETE /api/v1/users/{id}

PATCH /api/v1/users/{id}/status
PATCH /api/v1/users/{id}/role
PATCH /api/v1/users/{id}/department

Useful filtering:

GET /api/v1/users?role=TECHNICIAN
GET /api/v1/users?departmentId=2
GET /api/v1/users?search=jun
GET /api/v1/users?isActive=true
🏢 DEPARTMENTS
GET /api/v1/departments
GET /api/v1/departments/{id}

POST /api/v1/departments
PUT /api/v1/departments/{id}
DELETE /api/v1/departments/{id}
🏷️ CATEGORIES
GET /api/v1/categories
GET /api/v1/categories/{id}

POST /api/v1/categories
PUT /api/v1/categories/{id}
DELETE /api/v1/categories/{id}
🎫 TICKETS

This is the main resource.

GET /api/v1/tickets
POST /api/v1/tickets

GET /api/v1/tickets/{id}
PUT /api/v1/tickets/{id}
DELETE /api/v1/tickets/{id}
Filtering
GET /api/v1/tickets?status=OPEN

GET /api/v1/tickets?priority=HIGH

GET /api/v1/tickets?categoryId=2

GET /api/v1/tickets?departmentId=1

GET /api/v1/tickets?assignedToId=5

GET /api/v1/tickets?createdById=8

Combine them:

GET /api/v1/tickets?status=OPEN&priority=HIGH&departmentId=1
Search
GET /api/v1/tickets?search=wifi
Pagination
GET /api/v1/tickets?page=1&pageSize=20
Sorting
GET /api/v1/tickets?sortBy=createdAt&sortOrder=desc
🎯 Ticket actions

Some actions are better represented as PATCH operations rather than creating weird endpoints.

Assign technician
PATCH /api/v1/tickets/{id}/assignment

Body:

{
"assignedToId": 5
}
Change status
PATCH /api/v1/tickets/{id}/status
{
"status": "IN_PROGRESS"
}
Change priority
PATCH /api/v1/tickets/{id}/priority
{
"priority": "HIGH"
}

This is better than:

POST /tickets/{id}/assign
POST /tickets/{id}/resolve
POST /tickets/{id}/close

because we're treating the ticket as a resource whose state changes.

💬 COMMENTS

Nested under tickets because comments don't really exist without a ticket.

GET /api/v1/tickets/{ticketId}/comments
POST /api/v1/tickets/{ticketId}/comments

For a specific comment:

GET /api/v1/tickets/{ticketId}/comments/{commentId}

PUT /api/v1/tickets/{ticketId}/comments/{commentId}

DELETE /api/v1/tickets/{ticketId}/comments/{commentId}
📎 ATTACHMENTS
GET /api/v1/tickets/{ticketId}/attachments

POST /api/v1/tickets/{ticketId}/attachments

GET /api/v1/tickets/{ticketId}/attachments/{attachmentId}

DELETE /api/v1/tickets/{ticketId}/attachments/{attachmentId}

POST would use multipart/form-data.

📜 ACTIVITY LOGS

These are basically read-only.

GET /api/v1/tickets/{ticketId}/activity

Admin could also have:

GET /api/v1/activity-logs

with filtering:

GET /api/v1/activity-logs?userId=5
GET /api/v1/activity-logs?action=STATUS_CHANGED
GET /api/v1/activity-logs?ticketId=102
📊 DASHBOARD

Since dashboard data isn't really a CRUD resource, dedicated endpoints make sense.

GET /api/v1/dashboard/summary

GET /api/v1/dashboard/tickets-by-status

GET /api/v1/dashboard/tickets-by-priority

GET /api/v1/dashboard/tickets-by-category

GET /api/v1/dashboard/tickets-by-department

Example:

{
"total": 124,
"open": 32,
"inProgress": 18,
"resolved": 61,
"closed": 13,
"critical": 4
}
Final API map
/api/v1
│
├── auth
│ ├── register
│ ├── login
│ ├── logout
│ ├── me
│ └── password
│
├── users
│
├── departments
│
├── categories
│
├── tickets
│ ├── {id}
│ ├── {id}/assignment
│ ├── {id}/status
│ ├── {id}/priority
│ ├── {id}/comments
│ ├── {id}/attachments
│ └── {id}/activity
│
├── activity-logs
│
└── dashboard
├── summary
├── tickets-by-status
├── tickets-by-priority
├── tickets-by-category
└── tickets-by-department
