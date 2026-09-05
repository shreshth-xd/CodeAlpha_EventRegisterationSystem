const loginForm = document.getElementById("loginForm");

if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email,
                    password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                showMessage(data.message, "error");
                return;
            }

            saveAuth(data);

            if (data.user.role === "organizer") {
                window.location.href = "/organizer.html";
            } else {
                window.location.href = "/";
            }

        } catch (error) {
            console.error(error);
            showMessage("Unable to connect to server", "error");
        }
    });
}


const registerForm = document.getElementById("registerForm");

if (registerForm) {
    registerForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const name = document.getElementById("name").value;
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        const role = document.getElementById("role").value;

        try {
            const response = await fetch("/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name,
                    email,
                    password,
                    role
                })
            });

            const data = await response.json();

            if (!response.ok) {
                showMessage(data.message, "error");
                return;
            }

            showMessage(
                "Account created successfully. Redirecting to login...",
                "success"
            );

            setTimeout(() => {
                window.location.href = "/login.html";
            }, 1000);

        } catch (error) {
            console.error(error);
            showMessage("Unable to connect to server", "error");
        }
    });
}