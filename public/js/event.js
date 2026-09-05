const params = new URLSearchParams(window.location.search);
const eventId = params.get("id");

async function loadEvent() {

    if (!eventId) {
        showMessage("Event ID is missing", "error");
        return;
    }

    try {
        const response = await fetch(`/api/events/${eventId}`);
        const data = await response.json();

        if (!response.ok) {
            showMessage(data.message, "error");
            return;
        }

        const event = data.event;

        document.getElementById("event").innerHTML = `
            <div class="card event-detail">

                <span class="badge">
                    ${event.remaining_capacity > 0
                        ? "Available"
                        : "Fully Booked"}
                </span>

                <h1>${escapeHtml(event.title)}</h1>

                <div class="event-meta">
                    📅 ${formatDate(event.event_date)}
                </div>

                <div class="event-meta">
                    📍 ${escapeHtml(event.location)}
                </div>

                <div class="event-meta">
                    👤 Organized by ${escapeHtml(event.organizer_name)}
                </div>

                <div class="event-meta">
                    👥 ${event.remaining_capacity}
                    spots remaining out of ${event.capacity}
                </div>

                <p class="description">
                    ${escapeHtml(
                        event.description ||
                        "No description provided."
                    )}
                </p>

                <div class="actions">
                    ${getActionButton(event)}
                </div>

            </div>
        `;

    } catch (error) {
        console.error(error);
        showMessage("Failed to load event", "error");
    }
}


function getActionButton(event) {

    const user = getUser();

    if (!user) {
        return `
            <a href="/login.html">
                <button class="primary">
                    Login to Register
                </button>
            </a>
        `;
    }

    if (event.remaining_capacity <= 0) {
        return `
            <button disabled>
                Event Full
            </button>
        `;
    }

    return `
        <button class="primary" onclick="registerForEvent()">
            Register for Event
        </button>
    `;
}


async function registerForEvent() {

    const token = getToken();

    if (!token) {
        window.location.href = "/login.html";
        return;
    }

    try {
        const response = await fetch(
            `/api/registrations/events/${eventId}`,
            {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            showMessage(data.message, "error");
            return;
        }

        showMessage(
            "You have successfully registered for this event!",
            "success"
        );

        await loadEvent();

    } catch (error) {
        console.error(error);
        showMessage("Failed to register for event", "error");
    }
}


loadEvent();