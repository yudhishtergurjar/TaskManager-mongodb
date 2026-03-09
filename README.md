<div align="center">

# 📋 TaskManager API

**A production-ready RESTful API for collaborative project and task management**

Built with Node.js · Express · MongoDB · Redis · Socket.io

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)
![Swagger](https://img.shields.io/badge/Swagger-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)

</div>

---

## 📖 Table of Contents

- [About the Project](#-about-the-project)
- [Key Features](#-key-features)
- [Architecture Overview](#-architecture-overview)
- [Tech Stack](#-tech-stack)
- [Data Models](#-data-models)
- [API Reference](#-api-reference)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Usage](#-usage)
- [Project Structure](#-project-structure)
- [Security](#-security)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🧐 About the Project

TaskManager API is a backend service designed for teams to manage projects, tasks, and real-time collaboration. It provides a secure, role-based system where project owners can create projects, invite members, assign tasks, and communicate within project channels — all backed by MongoDB for persistence and Redis for high-performance caching and real-time Socket.io adapter.

---

## ✨ Key Features

| Category | Feature |
|---|---|
| **Authentication** | JWT-based auth with Access & Refresh token rotation, secure HTTP-only cookie storage |
| **Authorization** | Role-based access control (RBAC) — `OWNER` and `MEMBER` roles per project, `ADMIN` and `USER` system roles |
| **Projects** | Full CRUD, soft-delete, owner-only management, member invitation system |
| **Tasks** | Create, assign, update, mark complete, delete — scoped to projects with status tracking (`PENDING`, `IN_PROGRESS`, `DONE`) |
| **Messaging** | Project-scoped messaging with edit/delete support and file attachment references |
| **Real-time** | Socket.io integration with Redis adapter for scalable real-time events |
| **Caching** | Redis caching layer on read-heavy endpoints (project reads, task listings) with automatic invalidation |
| **Logging** | Activity logs (user actions within projects) and Audit logs (security events like login, logout, role changes) |
| **Validation** | Joi schema validation middleware on all mutation endpoints |
| **Documentation** | Auto-generated interactive Swagger/OpenAPI docs |
| **Code Quality** | ESLint + Prettier + Husky pre-commit hooks |

---

## 🏗 Architecture Overview

```
Client Request
     │
     ▼
┌──────────┐    ┌────────────┐    ┌──────────────┐    ┌────────────┐
│  Express  │───▶│ Middleware  │───▶│  Controller  │───▶│  MongoDB   │
│  Router   │    │  Pipeline  │    │              │    │            │
└──────────┘    └────────────┘    └──────────────┘    └────────────┘
                     │                    │
                     │                    ▼
                     │             ┌────────────┐
                     │             │   Redis     │
                     │             │   Cache     │
                     │             └────────────┘
                     ▼
              ┌────────────────┐
              │  Auth · RBAC   │
              │  Validation    │
              │  Caching       │
              └────────────────┘
```

**Middleware Pipeline (per request):**

1. `authMiddleware` → Verifies JWT access token & attaches user to request
2. `roleCheck` (`isOwner` / `isMember`) → Validates project membership and role
3. `cacheMiddleware` → Returns cached response from Redis if available
4. `schemaMiddleware` → Validates request body against Joi schema
5. **Controller** → Business logic execution

---

## 🛠 Tech Stack

### Core

| Technology | Purpose |
|---|---|
| **Node.js** | JavaScript runtime |
| **Express.js v5** | Web framework |
| **MongoDB** (Mongoose v9) | Primary database |
| **Redis** (ioredis) | Caching & Socket.io adapter |

### Security & Auth

| Technology | Purpose |
|---|---|
| **jsonwebtoken** | JWT token generation & verification |
| **bcrypt** | Password hashing |
| **helmet** | HTTP security headers |
| **cors** | Cross-origin resource sharing |
| **cookie-parser** | Secure cookie handling |

### Dev Tools

| Technology | Purpose |
|---|---|
| **nodemon** | Hot-reload in development |
| **ESLint** | Code linting |
| **Prettier** | Code formatting |
| **Husky** | Git hook management |
| **lint-staged** | Run linters on staged files |

### Documentation

| Technology | Purpose |
|---|---|
| **swagger-jsdoc** | Generate OpenAPI spec from JSDoc comments |
| **swagger-ui-express** | Serve interactive API docs |

---

## 📊 Data Models

The application uses **9 Mongoose models** to represent the domain:

### Core Entities

| Model | Key Fields | Description |
|---|---|---|
| **User** | `username`, `email`, `password`, `role` (`USER`/`ADMIN`), `provider` (`local`/`google`/`github`) | User accounts with multi-provider support and soft-delete |
| **Project** | `title`, `description`, `createdBy`, `deletedAt` | Project entity with soft-delete support |
| **Task** | `title`, `description`, `status`, `assigneeId`, `createdBy`, `deadline`, `projectId` | Task with status tracking and assignment |
| **ProjectMember** | `projectId`, `userId`, `role` (`OWNER`/`MEMBER`), `joinedAt`, `removedAt` | Junction table with unique compound index on `(projectId, userId)` |

### Communication

| Model | Key Fields | Description |
|---|---|---|
| **Message** | `projectId`, `senderId`, `content`, `attachments`, `deletedAt` | Project-scoped messages with file attachment references |
| **Notification** | — | Notification model for user alerts |

### Observability

| Model | Key Fields | Description |
|---|---|---|
| **ActivityLog** | `userId`, `projectId`, `action`, `entityType`, `metadata` | Tracks 12 action types across project, task, message, and member operations |
| **AuditLog** | `userId`, `action`, `targetType`, `ipAddress`, `userAgent`, `metadata` | Security-focused logs for authentication and sensitive operations |
| **Session** | — | Session tracking for user login sessions |

---

## 📡 API Reference

> **Interactive Docs:** Once the server is running, visit [`http://localhost:5000/api-docs`](http://localhost:5000/api-docs) for the full Swagger UI.

### 🔐 Authentication (`/auth`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/auth/register` | Register a new user | ❌ |
| `POST` | `/auth/login` | Login and receive access + refresh tokens | ❌ |
| `GET` | `/auth/logout` | Logout and invalidate session | ✅ |
| `GET` | `/auth/refreshToken` | Get a new access token using refresh token cookie | ❌ (uses cookie) |

### 📁 Projects (`/projects`)

> All project endpoints require authentication.

| Method | Endpoint | Description | Role |
|---|---|---|---|
| `POST` | `/projects/add` | Create a new project | Any authenticated user |
| `GET` | `/projects/read/:id` | Get project details | Member |
| `GET` | `/projects/list` | List all projects user belongs to | Any authenticated user |
| `PATCH` | `/projects/update/:id` | Update project title/description | Owner only |
| `DELETE` | `/projects/delete/:id` | Soft-delete a project | Owner only |
| `POST` | `/projects/addMember/:id` | Add a member to the project | Owner only |
| `POST` | `/projects/removeMember/:id` | Remove a member from the project | Owner only |

### ✅ Tasks (`/tasks`)

> All task endpoints require authentication.

| Method | Endpoint | Description | Role |
|---|---|---|---|
| `POST` | `/tasks/add/:id` | Create a task in a project | Owner only |
| `GET` | `/tasks/assigned/:id` | Get tasks assigned in a project | Owner only |
| `GET` | `/tasks/totalTasks/:id` | Get all tasks in a project | Owner only |
| `PATCH` | `/tasks/update/:id` | Update a task | Any authenticated user |
| `GET` | `/tasks/markCompleted/:id` | Mark a task as completed | Any authenticated user |
| `DELETE` | `/tasks/delete/:id` | Delete a task | Any authenticated user |

### 💬 Messages (`/message`)

> All message endpoints require authentication.

| Method | Endpoint | Description | Role |
|---|---|---|---|
| `GET` | `/message/:id` | Get messages for a project | Member |
| `PATCH` | `/message/edit/:id` | Edit a message | Any authenticated user |
| `DELETE` | `/message/delete/:id` | Delete a message | Any authenticated user |

---

## 🚀 Getting Started

### Prerequisites

Ensure the following are installed and running on your system:

| Dependency | Version | Download |
|---|---|---|
| **Node.js** | v18.x or higher | [nodejs.org](https://nodejs.org/) |
| **MongoDB** | v6.x or higher | [mongodb.com](https://www.mongodb.com/try/download/community) |
| **Redis** | v7.x or higher | [redis.io](https://redis.io/download/) |

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-username/TaskManager-mongodb.git

# 2. Navigate to the project directory
cd TaskManager-mongodb

# 3. Install dependencies
npm install

# 4. Create your environment file
cp .env.example .env
# Then edit .env with your configuration (see below)
```

---

## 🔑 Environment Variables

Create a `.env` file in the project root with the following variables:

| Variable | Description | Required |
|---|---|---|
| `PORT` | Port number the server listens on | ✅ |
| `MONGODB_URI` | MongoDB connection string | ✅ |
| `REDIS_URI` | Redis connection string | ✅ |
| `jwtAcessSecret` | Secret key for signing JWT access tokens | ✅ |
| `jwtRefreshSecret` | Secret key for signing JWT refresh tokens | ✅ |

**Example `.env` file:**

```env
PORT=YOUR_PORT_NUMBER
MONGODB_URI=YOUR_MONGODB_CONNECTION_STRING
REDIS_URI=YOUR_REDIS_CONNECTION_STRING
jwtAcessSecret=YOUR_JWT_ACCESS_SECRET
jwtRefreshSecret=YOUR_JWT_REFRESH_SECRET
```

> ⚠️ **Important:** Never commit your `.env` file to version control. It is already included in `.gitignore`.

---

## ▶️ Usage

### Start Development Server

```bash
npm run start
```

The server starts with **nodemon** for automatic reloading on file changes.

```
Server is running on port 5000
```

### Access API Documentation

Open your browser and navigate to:

```
http://localhost:5000/api-docs
```

### Example: Register a User

```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securePassword123"
  }'
```

### Example: Login

```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securePassword123"
  }'
```

### Example: Create a Project (Authenticated)

```bash
curl -X POST http://localhost:5000/projects/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "title": "My First Project",
    "description": "A sample project to demo the API"
  }'
```

---

## 📂 Project Structure

```
TaskManager-mongodb/
├── src/
│   ├── config/
│   │   ├── connectMongo.js          # MongoDB connection setup
│   │   ├── connectRedis.js          # Redis connection setup
│   │   ├── connectSocketRedis.js    # Redis adapter for Socket.io
│   │   └── swagger.js               # Swagger/OpenAPI configuration
│   │
│   ├── controllers/
│   │   ├── userController.js        # Auth logic (register, login, logout, refresh)
│   │   ├── projectController.js     # Project CRUD + member management
│   │   ├── taskController.js        # Task CRUD + assignment + completion
│   │   └── messageController.js     # Message CRUD
│   │
│   ├── middlewares/
│   │   ├── authMiddleware.js        # JWT verification & user extraction
│   │   ├── roleCheck.js             # RBAC — isOwner / isMember guards
│   │   ├── cacheMiddlewareProject.js # Redis caching for project endpoints
│   │   ├── cacheMiddlewareTask.js   # Redis caching for task endpoints
│   │   ├── schemaMiddleware.js      # Joi schema validation
│   │   └── socketMiddleware.js      # Socket.io auth middleware
│   │
│   ├── models/
│   │   ├── user.js                  # User schema
│   │   ├── project.js               # Project schema
│   │   ├── projectMember.js         # Project membership (OWNER/MEMBER)
│   │   ├── task.js                  # Task schema with status tracking
│   │   ├── message.js               # Message schema with attachments
│   │   ├── activityLog.js           # User activity tracking
│   │   ├── auditLog.js              # Security audit events
│   │   ├── session.js               # User session records
│   │   └── notification.js          # User notifications
│   │
│   ├── routes/
│   │   ├── userRoute.js             # /auth endpoints
│   │   ├── projectRoute.js          # /projects endpoints
│   │   ├── taskRoute.js             # /tasks endpoints
│   │   └── messageRoute.js          # /message endpoints
│   │
│   ├── socket/
│   │   ├── initSocket.js            # Socket.io server initialization
│   │   └── socketHandler.js         # Real-time event handlers
│   │
│   ├── utils/
│   │   └── token.js                 # JWT token utility functions
│   │
│   ├── validators/
│   │   ├── authValidator.js         # Joi schemas for auth endpoints
│   │   ├── projectValidator.js      # Joi schemas for project endpoints
│   │   └── taskValidator.js         # Joi schemas for task endpoints
│   │
│   ├── services/                    # Business logic layer (reserved)
│   ├── app.js                       # Express app & middleware setup
│   └── server.js                    # HTTP server entry point
│
├── .env                             # Environment variables (not committed)
├── .gitignore                       # Git ignore rules
├── package.json                     # Dependencies & scripts
└── package-lock.json                # Dependency lock file
```

---

## 🔒 Security

This application implements multiple layers of security:

- **Password Hashing** — All passwords are hashed using `bcrypt` before storage
- **JWT Token Rotation** — Short-lived access tokens with refresh token rotation via HTTP-only cookies
- **HTTP Security Headers** — `helmet` sets security-related HTTP headers
- **CORS** — Configurable cross-origin resource sharing
- **Input Validation** — All incoming data is validated with Joi schemas
- **Role-Based Access** — Endpoints are protected by ownership and membership checks
- **Audit Logging** — All security-sensitive actions (login, logout, role changes) are logged with IP address and user agent
- **Soft Deletes** — Records are soft-deleted (via `deletedAt` timestamp) rather than permanently removed for data recovery and audit compliance

---

## 🤝 Contributing

Contributions are welcome! This project uses **Husky** + **lint-staged** to enforce code quality on every commit.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'feat: add amazing feature'`)
   - Pre-commit hooks will automatically run **ESLint** and **Prettier**
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

---

## 📝 License

Distributed under the **ISC License**. See `LICENSE` for more information.

---

<div align="center">

**Built with ❤️ using Node.js and MongoDB**

</div>
