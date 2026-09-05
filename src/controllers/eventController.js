const pool = require("../db");

const getEvents = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT
                e.id,
                e.title,
                e.description,
                e.location,
                e.event_date,
                e.capacity,
                e.organizer_id,
                u.name AS organizer_name,
                COUNT(r.id)::INTEGER AS registration_count,
                (e.capacity - COUNT(r.id))::INTEGER AS remaining_capacity
            FROM events e
            JOIN users u
                ON e.organizer_id = u.id
            LEFT JOIN registrations r
                ON e.id = r.event_id
                AND r.status = 'registered'
            WHERE e.event_date >= NOW()
            GROUP BY e.id, u.name
            ORDER BY e.event_date ASC
        `);

        res.json({
            success: true,
            events: result.rows
        });

    } catch (error) {
        console.error("Get events error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch events"
        });
    }
};


const getEventById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            SELECT
                e.id,
                e.title,
                e.description,
                e.location,
                e.event_date,
                e.capacity,
                e.organizer_id,
                u.name AS organizer_name,
                COUNT(r.id)::INTEGER AS registration_count,
                (e.capacity - COUNT(r.id))::INTEGER AS remaining_capacity
            FROM events e
            JOIN users u
                ON e.organizer_id = u.id
            LEFT JOIN registrations r
                ON e.id = r.event_id
                AND r.status = 'registered'
            WHERE e.id = $1
            GROUP BY e.id, u.name
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        res.json({
            success: true,
            event: result.rows[0]
        });

    } catch (error) {
        console.error("Get event error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch event"
        });
    }
};


const createEvent = async (req, res) => {
    try {
        const {
            title,
            description,
            event_date,
            location,
            capacity
        } = req.body;

        if (!title || !event_date || !location || capacity === undefined) {
            return res.status(400).json({
                success: false,
                message: "Title, event date, location and capacity are required"
            });
        }

        const parsedDate = new Date(event_date);
        const parsedCapacity = Number(capacity);

        if (Number.isNaN(parsedDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Invalid event date"
            });
        }

        if (parsedDate <= new Date()) {
            return res.status(400).json({
                success: false,
                message: "Event date must be in the future"
            });
        }

        if (!Number.isInteger(parsedCapacity) || parsedCapacity <= 0) {
            return res.status(400).json({
                success: false,
                message: "Capacity must be a positive integer"
            });
        }

        const result = await pool.query(`
            INSERT INTO events
                (title, description, location, event_date, capacity, organizer_id)
            VALUES
                ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `, [
            title.trim(),
            description?.trim() || null,
            location.trim(),
            parsedDate,
            parsedCapacity,
            req.user.id
        ]);

        res.status(201).json({
            success: true,
            message: "Event created successfully",
            event: result.rows[0]
        });

    } catch (error) {
        console.error("Create event error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create event"
        });
    }
};


const updateEvent = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            title,
            description,
            event_date,
            location,
            capacity
        } = req.body;

        if (
            title === undefined &&
            description === undefined &&
            event_date === undefined &&
            location === undefined &&
            capacity === undefined
        ) {
            return res.status(400).json({
                success: false,
                message: "At least one field is required for update"
            });
        }

        // Get current event first so partial updates work properly.
        const existingEvent = await pool.query(
            `SELECT * FROM events WHERE id = $1 AND organizer_id = $2`,
            [id, req.user.id]
        );

        if (existingEvent.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Event not found or you are not the organizer"
            });
        }

        const current = existingEvent.rows[0];

        const newTitle = title !== undefined
            ? title.trim()
            : current.title;

        const newDescription = description !== undefined
            ? description?.trim() || null
            : current.description;

        const newLocation = location !== undefined
            ? location.trim()
            : current.location;

        const newDate = event_date !== undefined
            ? new Date(event_date)
            : new Date(current.event_date);

        const newCapacity = capacity !== undefined
            ? Number(capacity)
            : current.capacity;

        if (!newTitle || !newLocation) {
            return res.status(400).json({
                success: false,
                message: "Title and location cannot be empty"
            });
        }

        if (Number.isNaN(newDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Invalid event date"
            });
        }

        if (newDate <= new Date()) {
            return res.status(400).json({
                success: false,
                message: "Event date must be in the future"
            });
        }

        if (!Number.isInteger(newCapacity) || newCapacity <= 0) {
            return res.status(400).json({
                success: false,
                message: "Capacity must be a positive integer"
            });
        }

        // Don't allow capacity to be reduced below current registrations.
        const registrationCount = await pool.query(`
            SELECT COUNT(*)::INTEGER AS count
            FROM registrations
            WHERE event_id = $1
            AND status = 'registered'
        `, [id]);

        const currentRegistrations = registrationCount.rows[0].count;

        if (newCapacity < currentRegistrations) {
            return res.status(400).json({
                success: false,
                message: `Capacity cannot be lower than current registrations (${currentRegistrations})`
            });
        }

        const result = await pool.query(`
            UPDATE events
            SET
                title = $1,
                description = $2,
                location = $3,
                event_date = $4,
                capacity = $5,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $6
            AND organizer_id = $7
            RETURNING *
        `, [
            newTitle,
            newDescription,
            newLocation,
            newDate,
            newCapacity,
            id,
            req.user.id
        ]);

        res.json({
            success: true,
            message: "Event updated successfully",
            event: result.rows[0]
        });

    } catch (error) {
        console.error("Update event error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update event"
        });
    }
};


const deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            DELETE FROM events
            WHERE id = $1
            AND organizer_id = $2
            RETURNING id
        `, [id, req.user.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Event not found or you are not the organizer"
            });
        }

        res.json({
            success: true,
            message: "Event deleted successfully"
        });

    } catch (error) {
        console.error("Delete event error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to delete event"
        });
    }
};


const getEventRegistrations = async (req, res) => {
    try {
        const { id } = req.params;

        // Organizer can only view registrations for their own event.
        const event = await pool.query(`
            SELECT id, title
            FROM events
            WHERE id = $1
            AND organizer_id = $2
        `, [id, req.user.id]);

        if (event.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Event not found or you are not the organizer"
            });
        }

        const result = await pool.query(`
            SELECT
                r.id,
                r.user_id,
                u.name,
                u.email,
                r.status,
                r.registered_at,
                r.cancelled_at
            FROM registrations r
            JOIN users u
                ON r.user_id = u.id
            WHERE r.event_id = $1
            ORDER BY r.registered_at ASC
        `, [id]);

        res.json({
            success: true,
            event: event.rows[0],
            registrations: result.rows
        });

    } catch (error) {
        console.error("Get registrations error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch registrations"
        });
    }
};


module.exports = {
    getEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventRegistrations
};