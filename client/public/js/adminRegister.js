document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("form");
    const submitButton = form.querySelector("button[type='submit']");
    const errorMessageDiv = document.createElement("div");
    errorMessageDiv.className = "text-danger";
    form.appendChild(errorMessageDiv);

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const adminFirstName = document.getElementById("adminFirstName").value.trim();
        const adminLastName = document.getElementById("adminLastName").value.trim();
        const adminEmail = document.getElementById("adminEmail").value.trim();
        const adminPassword = document.getElementById("adminPassword").value;
        const confirmPassword = document.getElementById("confirmPassword").value;

        errorMessageDiv.textContent = "";

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(adminEmail)) {
            errorMessageDiv.textContent = "Invalid email format";
            return;
        }

        if (adminPassword !== confirmPassword) {
            errorMessageDiv.textContent = "Passwords do not match. Please try again.";
            return;
        }

        submitButton.disabled = true;

        try {
            const response = await fetch("/api/auth/admin/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    adminFirstName,
                    adminLastName,
                    adminEmail,
                    adminPassword,
                    confirmPassword,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message);
                window.location.href = "/";
            } else {
                errorMessageDiv.textContent = data.message || "Registration failed. Please try again.";
            }
        } catch (error) {
            errorMessageDiv.textContent = "An error occurred. Please try again later.";
            console.error("Error:", error);
        } finally {
            submitButton.disabled = false;
        }
    });
});
