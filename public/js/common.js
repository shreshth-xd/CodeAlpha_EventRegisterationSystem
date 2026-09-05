function getToken() {
    return localStorage.getItem("token");
}

function getUser() {
    const user = localStorage.getItem("user");

    try {
        return user ? JSON.parse(user) : null;
    } catch {
        return null;
    }
}

function saveAuth(data) {
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
}

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    window.location.href = "/";
}

function showMessage(message, type = "") {
    const element = document.getElementById("message");

    if (!element) return;

    element.innerHTML = `
        <div class="message ${type}">
            ${message}
        </div>
    `;
}

function escapeHtml(value) {
    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatDate(date) {
    return new Date(date).toLocaleString();
}

function updateNavbar() {
    const navLinks = document.getElementById("navLinks");

    if (!navLinks) return;

    const user = getUser();

    if (!user) {
        navLinks.innerHTML = `
            <a href="/login.html">Login</a>
            <a href="/register.html">Register</a>
        `;
        return;
    }

    let links = `
        <a href="/">Events</a>
        <a href="/dashboard.html">My Registrations</a>
    `;

    if (user.role === "organizer") {
        links += `<a href="/organizer.html">Organizer</a>`;
    }

    links += `
        <span class="muted">${escapeHtml(user.name)}</span>
        <a href="#" onclick="logout()">Logout</a>
    `;

    navLinks.innerHTML = links;
}

updateNavbar();