-- ============================================
-- EVENT REGISTRATION SYSTEM
-- Database Schema
-- ============================================

-- ============================================
-- USERS
-- ============================================

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    email VARCHAR(255) NOT NULL,

    password_hash TEXT NOT NULL,

    role VARCHAR(20) NOT NULL DEFAULT 'user'
        CHECK (role IN ('user', 'organizer')),

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- Email should be unique regardless of letter casing.
CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique
ON users (LOWER(email));


-- ============================================
-- EVENTS
-- ============================================

CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,

    title VARCHAR(200) NOT NULL,

    description TEXT,

    location VARCHAR(255),

    event_date TIMESTAMPTZ NOT NULL,

    capacity INTEGER NOT NULL
        CHECK (capacity > 0),

    organizer_id INTEGER NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_events_organizer
        FOREIGN KEY (organizer_id)
        REFERENCES users(id)
        ON DELETE RESTRICT
);


-- ============================================
-- REGISTRATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS registrations (
    id SERIAL PRIMARY KEY,

    user_id INTEGER NOT NULL,

    event_id INTEGER NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'registered'
        CHECK (status IN ('registered', 'cancelled')),

    registered_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    cancelled_at TIMESTAMPTZ,

    CONSTRAINT fk_registrations_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_registrations_event
        FOREIGN KEY (event_id)
        REFERENCES events(id)
        ON DELETE CASCADE
);


-- ============================================
-- PREVENT DUPLICATE ACTIVE REGISTRATIONS
-- ============================================

CREATE UNIQUE INDEX IF NOT EXISTS
registrations_active_user_event_unique
ON registrations (user_id, event_id)
WHERE status = 'registered';


-- ============================================
-- USEFUL INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS events_date_index
ON events (event_date);

CREATE INDEX IF NOT EXISTS events_organizer_index
ON events (organizer_id);

CREATE INDEX IF NOT EXISTS registrations_user_index
ON registrations (user_id);

CREATE INDEX IF NOT EXISTS registrations_event_index
ON registrations (event_id);