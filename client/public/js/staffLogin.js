document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("form");

    form.addEventListener("submit", async (event) => {
        event.preventDefault(); 

        const staffEmail = document.getElementById("staffEmail").value;
        const staffPassword = document.getElementById("staffPassword").value;

        try {
            const response = await fetch("/api/auth/staff/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ staffEmail, staffPassword }),
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message); 
                window.location.href = "/staff/dashboard"; 
            } else {
                alert(data.message || "Login failed. Please try again.");
                console.error("Login error data:", data);
            }
        } catch (error) {
            alert("An error occurred. Please try again later.");
            console.error("Error:", error);
        }
    });
});

document.getElementById('togglePassword').addEventListener('click', function () {
    const passwordField = document.getElementById('staffPassword');
    const isPassword = passwordField.type === 'password';
    passwordField.type = isPassword ? 'text' : 'password';
    this.querySelector('i').textContent = isPassword ? 'visibility_off' : 'visibility';
});
