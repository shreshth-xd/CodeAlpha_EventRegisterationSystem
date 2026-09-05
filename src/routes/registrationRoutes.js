const express = require("express");

const {
    registerForEvent,
    getMyRegistrations,
    cancelRegistration
} = require("../controllers/registrationController");

const { authenticate } = require("../middleware/authMiddleware");

const router = express.Router();

// Get events registered by the current user
router.get(
    "/my",
    authenticate,
    getMyRegistrations
);

// Register for an event
router.post(
    "/events/:eventId",
    authenticate,
    registerForEvent
);

// Cancel registration
router.delete(
    "/events/:eventId",
    authenticate,
    cancelRegistration
);

module.exports = router;