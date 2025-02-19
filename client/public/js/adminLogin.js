document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("form");

    form.addEventListener("submit", async (event) => {
        event.preventDefault(); 

        const adminEmail = document.getElementById("adminEmail").value;
        const adminPassword = document.getElementById("adminPassword").value;

        try {
            const response = await fetch("/api/auth/admin/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ adminEmail, adminPassword }),
            });

            const data = await response.json();

            if (response.ok) {
                swal({
                    title: "Success!",
                    text: data.message,
                    icon: "success",
                    button: "OK",
                }).then(() => {
                    window.location.href = "/admin/dashboard"; 
                });
            } else {
                swal({
                    title: "Error",
                    text: data.message || "Login failed. Please try again.",
                    icon: "error",
                    button: "Try Again",
                });
                console.error("Login error data:", data);
            }
        } catch (error) {
            swal({
                title: "Oops!",
                text: "An error occurred. Please try again later.",
                icon: "error",
                button: "OK",
            });
            console.error("Error:", error);
        }
    });
});


document.getElementById('togglePassword').addEventListener('click', function () {
    const passwordField = document.getElementById('adminPassword');
    const isPassword = passwordField.type === 'password';
    passwordField.type = isPassword ? 'text' : 'password';
    this.querySelector('i').textContent = isPassword ? 'visibility_off' : 'visibility';
});
