const express = require("express");

const {
    getEvents,
    getEventById,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventRegistrations
} = require("../controllers/eventController");

const {
    authenticate,
    requireOrganizer
} = require("../middleware/authMiddleware");

const router = express.Router();

// Public
router.get("/", getEvents);
router.get("/:id", getEventById);

// Organizer only
router.post(
    "/",
    authenticate,
    requireOrganizer,
    createEvent
);

router.patch(
    "/:id",
    authenticate,
    requireOrganizer,
    updateEvent
);

router.delete(
    "/:id",
    authenticate,
    requireOrganizer,
    deleteEvent
);

router.get(
    "/:id/registrations",
    authenticate,
    requireOrganizer,
    getEventRegistrations
);

module.exports = router;