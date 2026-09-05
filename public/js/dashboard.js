async function loadRegistrations() {

    const token = getToken();

    if (!token) {
        window.location.href = "/login.html";
        return;
    }

    const container = document.getElementById("registrations");

    try {

        const response = await fetch(
            "/api/registrations/my",
            {
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

        if (data.registrations.length === 0) {
            container.innerHTML = `
                <div class="card">
                    <p>You haven't registered for any events yet.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = data.registrations.map(registration => {

            const cancelled =
                registration.registration_status === "cancelled";

            return `
                <div class="event-card">

                    <span class="badge">
                        ${cancelled ? "Cancelled" : "Registered"}
                    </span>

                    <h3>
                        ${escapeHtml(registration.title)}
                    </h3>

                    <p>
                        ${escapeHtml(
                            registration.description ||
                            "No description provided."
                        )}
                    </p>

                    <div class="event-meta">
                        📅 ${formatDate(registration.event_date)}
                    </div>

                    <div class="event-meta">
                        📍 ${escapeHtml(registration.location)}
                    </div>

                    <div class="event-meta">
                        👤 ${escapeHtml(registration.organizer_name)}
                    </div>

                    ${
                        !cancelled
                        ? `
                            <button
                                class="danger"
                                onclick="cancelRegistration(${registration.event_id})"
                            >
                                Cancel Registration
                            </button>
                        `
                        : ""
                    }

                </div>
            `;
        }).join("");

    } catch (error) {
        console.error(error);
        showMessage("Failed to load registrations", "error");
    }
}


async function cancelRegistration(eventId) {

    const confirmed = confirm(
        "Are you sure you want to cancel this registration?"
    );

    if (!confirmed) {
        return;
    }

    try {

        const response = await fetch(
            `/api/registrations/events/${eventId}`,
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
            "Registration cancelled successfully.",
            "success"
        );

        loadRegistrations();

    } catch (error) {
        console.error(error);
        showMessage("Failed to cancel registration", "error");
    }
}


loadRegistrations();