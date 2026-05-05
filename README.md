# Team Task Manager

A full-stack collaborative task management web application — a simplified Trello/Asana-style tool where teams can create projects, manage tasks, and track progress with role-based access control.

## Features

- **User Authentication** — Signup/Login with JWT tokens
- **Project Management** — Create projects; Admin can add/remove members
- **Task Management** — Create tasks with title, description, due date, and priority; assign to team members; track status
- **Dashboard** — View total tasks, tasks by status, tasks per user, and overdue tasks
- **Role-Based Access** — Admins manage everything; Members view and update only their assigned tasks

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express.js |
| Database | MongoDB (Mongoose ODM) |
| Authentication | JWT (JSON Web Tokens) |
| Deployment | Railway |

---

## Project Structure

```
team-task-manager/
├── backend/                  # Express API server
│   ├── controllers/          # Route controllers
│   ├── middleware/           # Auth middleware
│   ├── models/               # Mongoose models
│   ├── routes/               # Express routes
│   ├── .env.example          # Environment variable template
│   ├── package.json
│   └── server.js             # Entry point
├── frontend/                 # React + Vite app
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── contexts/         # React context (Auth)
│   │   ├── pages/            # Page components
│   │   └── utils/            # API client (axios)
│   ├── .env.example          # Environment variable template
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── .gitignore
└── README.md
```

---

## Local Setup

### Prerequisites

- Node.js >= 18
- MongoDB (local or [MongoDB Atlas](https://www.mongodb.com/atlas))
- npm

### 1. Clone the Repository

```bash
git clone https://github.com/Lavi098/team-task-manager.git
cd team-task-manager
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create the environment file:

```bash
cp .env.example .env
```

Edit `backend/.env`:

```env
MONGO_URI=mongodb://localhost:27017/team-task-manager
# Or for MongoDB Atlas:
# MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/team-task-manager

JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d

PORT=5000

FRONTEND_URL=http://localhost:5173
```

Start the backend:

```bash
npm run dev     # development (with nodemon)
# or
npm start       # production
```

The API will be available at `http://localhost:5000`.

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

Create the environment file:

```bash
cp .env.example .env
```

Edit `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## API Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register a new user |
| POST | `/api/auth/login` | Login and receive JWT |
| GET | `/api/auth/me` | Get current user profile |

### Projects

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/api/projects` | List user's projects | All |
| POST | `/api/projects` | Create a project | All |
| GET | `/api/projects/:id` | Get project details | Member+ |
| PUT | `/api/projects/:id` | Update project | Admin |
| DELETE | `/api/projects/:id` | Delete project | Admin |
| POST | `/api/projects/:id/members` | Add member | Admin |
| DELETE | `/api/projects/:id/members/:userId` | Remove member | Admin |

### Tasks

| Method | Endpoint | Description | Role |
|--------|----------|-------------|------|
| GET | `/api/tasks?projectId=xxx` | List tasks | All (members see only theirs) |
| POST | `/api/tasks` | Create a task | Admin |
| GET | `/api/tasks/:id` | Get task | All |
| PUT | `/api/tasks/:id` | Update task | Admin (full) / Member (status only) |
| DELETE | `/api/tasks/:id` | Delete task | Admin |

### Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Get stats: total tasks, by status, per user, overdue |

---

## Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/team-task-manager` |
| `JWT_SECRET` | Secret key for signing JWTs | *(required)* |
| `JWT_EXPIRES_IN` | JWT expiration time | `7d` |
| `PORT` | Server port | `5000` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |

### Frontend (`frontend/.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `/api` (uses Vite proxy in dev) |

---

## Deployment on Railway

### Prerequisites
- [Railway](https://railway.app) account
- MongoDB Atlas cluster (or Railway MongoDB plugin)

### Steps

#### 1. Prepare MongoDB
- Create a free cluster on [MongoDB Atlas](https://www.mongodb.com/atlas)
- Get your connection string: `mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/team-task-manager`
- Allow connections from `0.0.0.0/0` in Atlas network settings

#### 2. Deploy Backend on Railway
1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub Repo
2. Select your repository and set the **root directory** to `backend`
3. Railway will auto-detect Node.js and run `npm start`
4. Add these **environment variables** in Railway dashboard:
   ```
   MONGO_URI=<your MongoDB Atlas URI>
   JWT_SECRET=<long random string>
   JWT_EXPIRES_IN=7d
   PORT=5000
   FRONTEND_URL=<your frontend Railway URL>
   ```
5. Note your backend URL (e.g., `https://your-backend.up.railway.app`)

#### 3. Deploy Frontend on Railway
1. New Project → Deploy from GitHub Repo → same repo, root directory: `frontend`
2. Add build command: `npm run build`
3. Add start command: `npx serve dist -p $PORT` (or use Railway's static hosting)
4. Add environment variable:
   ```
   VITE_API_URL=https://your-backend.up.railway.app/api
   ```

**Tip:** After setting `VITE_API_URL`, redeploy the frontend (Vite bakes env vars at build time).

#### Alternative: Single Railway Service (Backend serves Frontend)
You can also build the frontend and serve it from the Express backend:
1. In the backend `server.js`, add static file serving after building frontend
2. Set `NODE_ENV=production` and serve `frontend/dist`

---

## Role-Based Access Control

| Action | Admin | Member |
|--------|-------|--------|
| Create project | ✅ | ✅ |
| Add/remove members | ✅ | ❌ |
| Delete project | ✅ | ❌ |
| Create task | ✅ | ❌ |
| Edit task (all fields) | ✅ | ❌ |
| Update task status | ✅ | ✅ (own tasks) |
| View all tasks in project | ✅ | ❌ |
| View own assigned tasks | ✅ | ✅ |
| Delete task | ✅ | ❌ |
| View dashboard | ✅ | ✅ |

---

## Development Notes

- The frontend development server proxies `/api` requests to `http://localhost:5000` via Vite config
- In production, set `VITE_API_URL` to the full backend URL
- Passwords are hashed with bcrypt (10 rounds)
- JWT tokens expire in 7 days by default
- MongoDB ObjectId validation is handled by Mongoose