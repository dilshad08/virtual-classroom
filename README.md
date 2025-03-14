# Virtual Classroom System

A **real-time virtual classroom system** built using **NestJS, Prisma, PostgreSQL, and Socket.IO**. This application enables teachers and students to interact in live classroom sessions with real-time updates.

## Features

- **User Authentication** (JWT-based WebSocket & HTTP Authentication)
- **Role-based Access Control** (Teacher & Student roles)
- **Classroom Management** (Create, Join, Leave, Start, and End Classrooms)
- **WebSocket-based Real-Time Updates**
- **Session Tracking** (Logging user join and leave events)

## Tech Stack

- **Backend:** NestJS, Prisma ORM, PostgreSQL
- **Real-time Communication:** Socket.IO
- **Task Queues (Optional):** BullMQ with Redis
- **Authentication:** JWT (for HTTP & WebSocket)
- **Deployment:** AWS (EC2)

## Installation

### Prerequisites

- Node.js (v18+)
- PostgreSQL

### Setup

```bash
# Clone the repository
git clone https://github.com/dilshad08/virtual-classroom.git
cd virtual-classroom

# Install dependencies
npm install

# Copy environment variables
touch .env
```

### Configure `.env`

```env
DATABASE_URL=postgresql://user:password@localhost:5432/virtual_classroom
JWT_SECRET=your_secret_key
```

### Run Migrations

```bash
npx prisma migrate dev --name init
```

### Run Seeders

```bash
npx prisma db seed
```

### Start the Server

```bash
npm run start:dev
```

## API Endpoints

### Authentication

- `POST /auth/login` – Login and get JWT token
- `POST /auth/register` – Register a new user

### Classroom Management

- `POST /classroom` – Create a new classroom (Teacher only)

## WebSocket Events

### **Client → Server**

| Event Name        | Data Payload              | Description       |
| ----------------- | ------------------------- | ----------------- |
| `join_classroom`  | `{ classroomId, userId }` | Join a classroom  |
| `leave_classroom` | `{ classroomId, userId }` | Leave a classroom |
| `start_class`     | `{ classroomId }`         | Start the class   |
| `end_class`       | `{ classroomId }`         | End the class     |

## Role-Based Access Control (RBAC)

The application enforces access control using **RolesGuard**.

- **Admin** can:
  - View classroom history
- **Teachers** can:
  - Create, start, and end classes
- **Students** can:
  - Join and leave classes
  - Participate in live sessions

### AWS EC2 Deployment

- Set up EC2 instance
- Install Node.js, PostgreSQL, and Redis
- Clone repo and set up environment
- Use **PM2** to keep the server running

```bash
pm install -g pm2
pm run build
pm start
pm2 start dist/main.js --name virtual-classroom
```

## Contributing

Feel free to submit pull requests and open issues to improve this project!

## License

MIT License

---

Happy Coding! 🚀
