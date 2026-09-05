# Event Registration System

A full-stack Event Registration System built with **Express.js** and **PostgreSQL**, with a simple static frontend served directly by Express.

The system supports user and organizer accounts, event management, event registration/cancellation, capacity tracking, and organizer attendee management.

## Features

### Authentication & Authorization

- User registration
- Organizer registration
- Login with JWT authentication
- Password hashing with `bcryptjs`
- Role-based authorization for organizers
- Protected API routes using Bearer tokens

### Event Management

- View upcoming events
- View individual event details
- Organizers can create events
- Organizers can update their own events
- Organizers can delete their own events
- Event capacity validation
- Event date validation
- Registration count and remaining capacity displayed by the API
- Organizers can view registrations/attendees for their events

### Event Registration

- Authenticated users can register for events
- Prevents duplicate active registrations
- Prevents registration after an event has started
- Prevents registration when an event is full
- Users can cancel their registrations
- Cancelled users can register again
- Uses a PostgreSQL transaction with row locking when registering to prevent two simultaneous users from claiming the same final seat

### Frontend

The frontend is a static HTML/CSS/JavaScript interface served by Express.

Pages included:

- Home / upcoming events
- Login
- Registration
- Event details
- User dashboard
- Organizer dashboard

The frontend uses `localStorage` to maintain the JWT token and logged-in user information.

## Tech Stack

### Backend

- Node.js
- Express.js
- PostgreSQL
- `pg`
- JWT (`jsonwebtoken`)
- `bcryptjs`
- `dotenv`

### Frontend

- HTML
- CSS
- Vanilla JavaScript

### Development

- Nodemon

## Project Structure

```text
CodeAlpha_EventRegisterationSystem/
├── src/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── eventController.js
│   │   └── registrationController.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── eventRoutes.js
│   │   └── registrationRoutes.js
│   ├── db/
│   │   ├── index.js
│   │   └── schema.sql
│   └── app.js
│
├── public/
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── event.html
│   ├── dashboard.html
│   ├── organizer.html
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── common.js
│       ├── index.js
│       ├── auth.js
│       ├── event.js
│       ├── dashboard.js
│       └── organizer.js
│
├── .env
├── .env.example
├── .gitignore
└── package.json
```

## Database

The application uses PostgreSQL with three main tables:

### `users`

Stores registered users and organizers.

Important fields:

- `id`
- `name`
- `email`
- `password_hash`
- `role`
- `created_at`

Roles are restricted to:

- `user`
- `organizer`

Email addresses are uniquely indexed case-insensitively.

### `events`

Stores events created by organizers.

Important fields:

- `id`
- `title`
- `description`
- `location`
- `event_date`
- `capacity`
- `organizer_id`
- `created_at`
- `updated_at`

Each event belongs to an organizer.

### `registrations`

Stores user registrations for events.

Important fields:

- `id`
- `user_id`
- `event_id`
- `status`
- `registered_at`
- `cancelled_at`

Registration status can be:

- `registered`
- `cancelled`

A partial unique index prevents a user from having multiple active registrations for the same event while still allowing a cancelled registration to be reactivated.

Foreign keys and indexes are also used for data integrity and query performance.

## Environment Variables

Create a `.env` file in the project root.

Example:

```env
PORT=5000

DB_USER=postgres
DB_HOST=127.0.0.1
DB_NAME=event_registration
DB_PASSWORD=YOUR_POSTGRES_PASSWORD
DB_PORT=5432

JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=1d
```

Do not commit `.env` to Git. It is already included in `.gitignore`.

## Installation

Clone the repository and enter the project directory:

```bash
git clone <repository-url>
cd CodeAlpha_EventRegisterationSystem
```

Install dependencies:

```bash
npm install
```

If installing the dependencies manually:

```bash
npm install express pg dotenv bcryptjs jsonwebtoken
npm install -D nodemon
```

## Database Setup

Make sure PostgreSQL is running and the `event_registration` database exists.

Apply the schema:

```bash
docker exec -i YOUR_POSTGRES_CONTAINER \
psql -U postgres -d event_registration < src/db/schema.sql
```

You can verify the tables with:

```bash
docker exec -it YOUR_POSTGRES_CONTAINER \
psql -U postgres -d event_registration
```

Then inside `psql`:

```sql
\dt
```

The expected tables are:

```text
users
events
registrations
```

## Running the Application

Development mode:

```bash
npm run dev
```

Production/start mode:

```bash
npm start
```

The application runs on:

```text
http://localhost:5000
```

Since the frontend is served by Express, opening the root URL loads the Event Registration System interface.

## API Endpoints

### Authentication

#### Register

```http
POST /api/auth/register
```

Request body:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

For an organizer:

```json
{
  "name": "Event Organizer",
  "email": "organizer@example.com",
  "password": "password123",
  "role": "organizer"
}
```

#### Login

```http
POST /api/auth/login
```

Request body:

```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

A successful login returns a JWT token.

Use it for protected endpoints with:

```http
Authorization: Bearer YOUR_TOKEN
```

---

### Events

#### Get Upcoming Events

```http
GET /api/events
```

Public endpoint.

#### Get Event Details

```http
GET /api/events/:id
```

Public endpoint.

#### Create Event

```http
POST /api/events
```

Organizer authentication required.

Example:

```json
{
  "title": "Tech Meetup 2026",
  "description": "A backend development meetup",
  "event_date": "2026-09-20T18:30:00+05:30",
  "location": "Jhansi",
  "capacity": 100
}
```

#### Update Event

```http
PATCH /api/events/:id
```

Organizer authentication required.

Only the organizer who owns the event can update it.

#### Delete Event

```http
DELETE /api/events/:id
```

Organizer authentication required.

Only the organizer who owns the event can delete it.

#### View Event Registrations

```http
GET /api/events/:id/registrations
```

Organizer authentication required.

Only the organizer who owns the event can view its registrations.

---

### Registrations

#### Register for an Event

```http
POST /api/registrations/events/:eventId
```

Authentication required.

#### View My Registrations

```http
GET /api/registrations/my
```

Authentication required.

#### Cancel Registration

```http
DELETE /api/registrations/events/:eventId
```

Authentication required.

## API Health Check

The backend also provides:

```http
GET /api/health
```

This checks whether the Express API is running and whether it can successfully communicate with PostgreSQL.

Example response:

```json
{
  "success": true,
  "message": "Event Registration API is running",
  "database": "connected",
  "timestamp": "..."
}
```

## Application Flow

```text
User / Organizer
       │
       ▼
Static Frontend
       │
       ▼
Express.js API
       │
       ├── Authentication
       │      ├── bcryptjs
       │      └── JWT
       │
       ├── Event Management
       │
       └── Registration Management
              │
              ▼
          PostgreSQL
```

## Security & Data Integrity

The application includes:

- Password hashing with `bcryptjs`
- JWT-based authentication
- Role-based authorization
- Protected organizer routes
- Ownership checks for event updates/deletion
- Parameterized PostgreSQL queries
- Database foreign keys
- Unique email constraint
- Unique active user/event registration constraint
- Transactional event registration
- Row locking during registration to handle concurrent registrations
- Input validation for dates and capacities

## Git Ignore

The repository excludes environment secrets and installed dependencies:

```gitignore
node_modules/
.env
```

## License

This project was developed as part of a Backend Development internship project.
