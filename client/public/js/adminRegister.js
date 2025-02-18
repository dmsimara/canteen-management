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
            swal({
                title: "Invalid Email",
                text: "Please provide a valid email format.",
                icon: "error",
                button: "OK",
            });
            return;
        }

        if (adminPassword !== confirmPassword) {
            swal({
                title: "Password Mismatch",
                text: "Passwords do not match. Please try again.",
                icon: "error",
                button: "OK",
            });
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
                swal({
                    title: "Registration Successful!",
                    text: data.message,
                    icon: "success",
                    button: "OK",
                }).then(() => {
                    window.location.href = "/"; 
                });
            } else {
                swal({
                    title: "Error",
                    text: data.message || "Registration failed. Please try again.",
                    icon: "error",
                    button: "OK",
                });
            }
        } catch (error) {
            swal({
                title: "Oops!",
                text: "An error occurred. Please try again later.",
                icon: "error",
                button: "OK",
            });
            console.error("Error:", error);
        } finally {
            submitButton.disabled = false;
        }
    });
});
