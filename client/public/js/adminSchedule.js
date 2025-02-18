document.addEventListener("DOMContentLoaded", function() {
    const toggler = document.querySelector(".toggler-btn");
    const sidebar = document.querySelector("#sidebar");

    const isCollapsed = localStorage.getItem("sidebarCollapsed") === "true";

    if (isCollapsed) {
        sidebar.classList.add("collapsed");
    } else {
        sidebar.classList.remove("collapsed");
    }

    toggler.addEventListener("click", function() {
        const isNowCollapsed = sidebar.classList.toggle("collapsed"); 

        localStorage.setItem("sidebarCollapsed", isNowCollapsed.toString());

        console.log("Sidebar collapsed state:", isNowCollapsed);
        console.log("Stored in localStorage:", localStorage.getItem("sidebarCollapsed"));
    });
});

document.addEventListener("DOMContentLoaded", () => {
    const logoutButton = document.getElementById("logoutButton");

    logoutButton.addEventListener("click", async () => {
        const isConfirmed = await swal({
            title: "Are you sure?",
            text: "Do you want to log out?",
            icon: "warning",
            buttons: ["Cancel", "Log Out"],
            dangerMode: true,
        });

        if (!isConfirmed) {
            return; 
        }

        try {
            const response = await fetch("/api/auth/admin/logout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();

            if (response.ok) {
                swal({
                    title: "Logged out successfully!",
                    text: data.message,
                    icon: "success",
                    button: "OK",
                }).then(() => {
                    window.location.href = "/"; 
                });
            } else {
                swal({
                    title: "Error",
                    text: data.message || "Logout failed. Please try again.",
                    icon: "error",
                    button: "Try Again",
                });
            }
        } catch (error) {
            swal({
                title: "Oops!",
                text: "An error occurred during logout. Please try again later.",
                icon: "error",
                button: "OK",
            });
            console.error("Error:", error);
        }
    });
});

document.addEventListener('DOMContentLoaded', function () {
    const path = window.location.pathname.replace(/\/$/, "");
    console.log('Current path:', path);

    const sidebarItems = document.querySelectorAll('.sidebar-item');

    sidebarItems.forEach(item => {
        const link = item.querySelector('a');
        const linkHref = link.getAttribute('href').replace(/\/$/, "");
        console.log('Comparing', linkHref, 'to', path);

        if (linkHref === path) {
            console.log('Match found for:', linkHref);
            item.classList.add('active');
            console.log('Active class added to:', item);
        } else {
            item.classList.remove('active');
        }
    });
});

// adding a new schedule
document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("scheduleForm");

    form.addEventListener("submit", async function (event) {
        event.preventDefault();  

        const eventName = document.getElementById("eventName").value.trim();
        const eventDate = document.getElementById("eventDate").value;
        const eventDescription = document.getElementById("eventDescription").value.trim();

        if (!eventName || !eventDate) {
            swal({
                title: "Error",
                text: "Event Name and Event Date are required!",
                icon: "error",
                button: "OK",
            });
            return;
        }

        const formData = {
            eventName,
            eventDate,
            eventDescription: eventDescription || null, 
        };

        try {
            const response = await fetch("/api/auth/admin/add/schedule", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (response.ok) {
                swal({
                    title: "Success",
                    text: "Schedule added successfully!",
                    icon: "success",
                    button: "OK",
                }).then(() => {
                    form.reset();  
                    window.location.reload();  
                });
            } else {
                swal({
                    title: "Error",
                    text: result.message || "Failed to add schedule.",
                    icon: "error",
                    button: "OK",
                });
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            swal({
                title: "Oops!",
                text: "Something went wrong. Please try again.",
                icon: "error",
                button: "OK",
            });
        }
    });
});

document.getElementById('deleteScheduleBtn').addEventListener('click', async function () {
    const scheduleId = document.getElementById('editScheduleId').value; 

    if (!scheduleId) {
        console.error("Error: Schedule ID is missing!");
        return;
    }

    const confirmation = await swal({
        title: "Are you sure?",
        text: "Once deleted, this schedule cannot be recovered.",
        icon: "warning",
        buttons: true,
        dangerMode: true,
    });

    if (!confirmation) return; 

    try {
        const response = await fetch(`/api/auth/admin/schedule/${scheduleId}`, {
            method: 'DELETE',
        });

        const result = await response.json();
        if (result.success) {
            swal({
                title: "Success!",
                text: "Schedule deleted successfully!",
                icon: "success",
                button: "OK",
            }).then(() => {
                bootstrap.Modal.getInstance(document.getElementById('editScheduleModal')).hide();
                location.reload();  
            });
        } else {
            swal({
                title: "Error",
                text: result.message || "Failed to delete schedule.",
                icon: "error",
                button: "OK",
            });
        }
    } catch (error) {
        console.error("Error deleting schedule:", error);
        swal({
            title: "Oops!",
            text: "An error occurred while deleting the schedule.",
            icon: "error",
            button: "OK",
        });
    }
});
