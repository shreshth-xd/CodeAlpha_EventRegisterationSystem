const pool = require("../db");

const registerForEvent = async (req, res) => {
    const client = await pool.connect();

    try {
        const userId = req.user.id;
        const { eventId } = req.params;

        await client.query("BEGIN");

        // Lock the event row so two simultaneous registrations
        // cannot both claim the same last seat.
        const eventResult = await client.query(`
            SELECT
                id,
                title,
                event_date,
                capacity
            FROM events
            WHERE id = $1
            FOR UPDATE
        `, [eventId]);

        if (eventResult.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                success: false,
                message: "Event not found"
            });
        }

        const event = eventResult.rows[0];

        if (new Date(event.event_date) <= new Date()) {
            await client.query("ROLLBACK");

            return res.status(400).json({
                success: false,
                message: "Registration for this event is closed"
            });
        }

        // Check whether the user is already registered.
        const existingRegistration = await client.query(`
            SELECT id, status
            FROM registrations
            WHERE user_id = $1
            AND event_id = $2
            ORDER BY id DESC
            LIMIT 1
        `, [userId, eventId]);

        if (
            existingRegistration.rows.length > 0 &&
            existingRegistration.rows[0].status === "registered"
        ) {
            await client.query("ROLLBACK");

            return res.status(409).json({
                success: false,
                message: "You are already registered for this event"
            });
        }

        // Count active registrations while the event row is locked.
        const countResult = await client.query(`
            SELECT COUNT(*)::INTEGER AS count
            FROM registrations
            WHERE event_id = $1
            AND status = 'registered'
        `, [eventId]);

        const registrationCount = countResult.rows[0].count;

        if (registrationCount >= event.capacity) {
            await client.query("ROLLBACK");

            return res.status(409).json({
                success: false,
                message: "Event is fully booked"
            });
        }

        let registration;

        if (existingRegistration.rows.length > 0) {
            // Re-register after cancellation.
            const result = await client.query(`
                UPDATE registrations
                SET
                    status = 'registered',
                    registered_at = CURRENT_TIMESTAMP,
                    cancelled_at = NULL
                WHERE id = $1
                RETURNING *
            `, [existingRegistration.rows[0].id]);

            registration = result.rows[0];
        } else {
            const result = await client.query(`
                INSERT INTO registrations
                    (user_id, event_id, status)
                VALUES
                    ($1, $2, 'registered')
                RETURNING *
            `, [userId, eventId]);

            registration = result.rows[0];
        }

        await client.query("COMMIT");

        res.status(201).json({
            success: true,
            message: "Successfully registered for event",
            registration,
            remaining_capacity: event.capacity - registrationCount - 1
        });

    } catch (error) {
        await client.query("ROLLBACK");

        console.error("Register for event error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to register for event"
        });
    } finally {
        client.release();
    }
};


const getMyRegistrations = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await pool.query(`
            SELECT
                r.id AS registration_id,
                r.status AS registration_status,
                r.registered_at,
                r.cancelled_at,
                e.id AS event_id,
                e.title,
                e.description,
                e.location,
                e.event_date,
                e.capacity,
                u.name AS organizer_name
            FROM registrations r
            JOIN events e
                ON r.event_id = e.id
            JOIN users u
                ON e.organizer_id = u.id
            WHERE r.user_id = $1
            ORDER BY r.registered_at DESC
        `, [userId]);

        res.json({
            success: true,
            registrations: result.rows
        });

    } catch (error) {
        console.error("Get my registrations error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch registrations"
        });
    }
};


const cancelRegistration = async (req, res) => {
    try {
        const userId = req.user.id;
        const { eventId } = req.params;

        const result = await pool.query(`
            UPDATE registrations
            SET
                status = 'cancelled',
                cancelled_at = CURRENT_TIMESTAMP
            WHERE user_id = $1
            AND event_id = $2
            AND status = 'registered'
            RETURNING *
        `, [userId, eventId]);

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Active registration not found"
            });
        }

        res.json({
            success: true,
            message: "Registration cancelled successfully",
            registration: result.rows[0]
        });

    } catch (error) {
        console.error("Cancel registration error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to cancel registration"
        });
    }
};


module.exports = {
    registerForEvent,
    getMyRegistrations,
    cancelRegistration
};