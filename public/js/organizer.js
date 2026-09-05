const user = getUser();

if (!user || user.role !== "organizer") {
    window.location.href = "/";
}


const createEventForm = document.getElementById("createEventForm");


createEventForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const title = document.getElementById("title").value;
    const description = document.getElementById("description").value;
    const location = document.getElementById("location").value;
    const eventDate = document.getElementById("event_date").value;
    const capacity = document.getElementById("capacity").value;

    try {

        const response = await fetch("/api/events", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${getToken()}`
            },
            body: JSON.stringify({
                title,
                description,
                location,
                event_date: new Date(eventDate).toISOString(),
                capacity: Number(capacity)
            })
        });

        const data = await response.json();

        if (!response.ok) {
            showMessage(data.message, "error");
            return;
        }

        showMessage(
            "Event created successfully!",
            "success"
        );

        createEventForm.reset();

        loadMyEvents();

    } catch (error) {
        console.error(error);
        showMessage("Failed to create event", "error");
    }
});


async function loadMyEvents() {

    const container = document.getElementById("myEvents");

    try {

        const response = await fetch("/api/events");
        const data = await response.json();

        const myEvents = data.events.filter(
            event => event.organizer_id === user.id
        );

        if (myEvents.length === 0) {
            container.innerHTML = `
                <div class="card">
                    <p>You haven't created any upcoming events.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = myEvents.map(event => `
            <div class="event-card">

                <h3>${escapeHtml(event.title)}</h3>

                <p>
                    ${escapeHtml(
                        event.description ||
                        "No description provided."
                    )}
                </p>

                <div class="event-meta">
                    📅 ${formatDate(event.event_date)}
                </div>

                <div class="event-meta">
                    📍 ${escapeHtml(event.location)}
                </div>

                <div class="event-meta">
                    👥 ${event.registration_count}
                    registered /
                    ${event.capacity} capacity
                </div>

                <div class="actions">

                    <a href="/event.html?id=${event.id}">
                        <button class="secondary">
                            View
                        </button>
                    </a>

                    <button
                        class="danger"
                        onclick="deleteEvent(${event.id})"
                    >
                        Delete
                    </button>

                </div>

            </div>
        `).join("");

    } catch (error) {
        console.error(error);

        container.innerHTML = `
            <div class="card">
                <p>Failed to load your events.</p>
            </div>
        `;
    }
}


async function deleteEvent(eventId) {

    const confirmed = confirm(
        "Delete this event? All registrations for it will also be removed."
    );

    if (!confirmed) {
        return;
    }

    try {

        const response = await fetch(
            `/api/events/${eventId}`,
            {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${getToken()}`
                }
            }
        );

        const data = await response.json();

        if (!response.ok) {
            showMessage(data.message, "error");
            return;
        }

        showMessage(
            "Event deleted successfully.",
            "success"
        );

        loadMyEvents();

    } catch (error) {
        console.error(error);
        showMessage("Failed to delete event", "error");
    }
}


loadMyEvents();