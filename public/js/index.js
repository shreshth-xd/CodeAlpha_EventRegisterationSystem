async function loadEvents() {
    const container = document.getElementById("events");

    container.innerHTML = "<p>Loading events...</p>";

    try {
        const response = await fetch("/api/events");
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message);
        }

        if (data.events.length === 0) {
            container.innerHTML = `
                <div class="card">
                    <p>No upcoming events found.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = data.events.map(event => `
            <div class="event-card">

                <h3>${escapeHtml(event.title)}</h3>

                <p>
                    ${escapeHtml(event.description || "No description provided.")}
                </p>

                <div class="event-meta">
                    📅 ${formatDate(event.event_date)}
                </div>

                <div class="event-meta">
                    📍 ${escapeHtml(event.location)}
                </div>

                <div class="event-meta">
                    👥 ${event.remaining_capacity} / ${event.capacity} spots available
                </div>

                <a href="/event.html?id=${event.id}">
                    <button>View Event</button>
                </a>

            </div>
        `).join("");

    } catch (error) {
        console.error(error);

        container.innerHTML = `
            <div class="card">
                <p>Failed to load events.</p>
            </div>
        `;
    }
}

loadEvents();