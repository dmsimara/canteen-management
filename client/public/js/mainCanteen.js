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

document.addEventListener("DOMContentLoaded", async function () {
    const stallContainer = document.getElementById("stall-container");
    const addStallButton = document.getElementById("add-stall");

    async function fetchStalls() {
        try {
            const response = await fetch('/api/auth/admin/view/stalls/a');
            const data = await response.json();

            stallContainer.innerHTML = ""; 
            stallContainer.appendChild(addStallButton); 

            if (data.success && data.stalls.length > 0) {
                data.stalls.forEach(stall => {
                    const stallCard = document.createElement("div");
                    stallCard.classList.add("stall-card"); 
                    stallCard.dataset.stallId = stall.stallId;

                    stallCard.innerHTML = `
                        <a href="/admin/inventory/canteen/${stall.stallId}" class="text-decoration-none">
                            <div class="card" style="width: 18rem; cursor: pointer;">
                                <img src="/images/canteen1.jpg" class="card-img-top" alt="Canteen Stall">
                                <div class="card-body">
                                    <h5 class="card-title">${stall.stallName}</h5>
                                    <p class="card-description">${stall.category || 'No Category'}</p>
                                    <a href="/admin/inventory/stall/${stall.stallId}" class="btn btn-primary">View</a>
                                    <button class="btn btn-danger delete-stall" data-stall-id="${stall.stallId}">Delete</button>
                                </div>
                            </div>
                        </a>
                    `;

                    stallContainer.insertBefore(stallCard, addStallButton);
                });

                attachDeleteEventListeners();
            }
        } catch (error) {
            console.error("Error fetching stalls:", error);
        }
    }

    async function deleteStall(stallId, stallCard) {
        const confirmation = await swal({
            title: "Are you sure?",
            text: "This action cannot be undone.",
            icon: "warning",
            buttons: true,
            dangerMode: true,
        });
    
        if (!confirmation) return; 
    
        try {
            const response = await fetch(`/api/auth/admin/inventory/stall/${stallId}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json"
                }
            });
    
            const data = await response.json();
    
            if (data.success) {
                stallCard.remove();  
                swal({
                    title: "Success!",
                    text: "Stall deleted successfully!",
                    icon: "success",
                    button: "OK",
                });
            } else {
                swal({
                    title: "Error",
                    text: data.message || "Failed to delete the stall.",
                    icon: "error",
                    button: "OK",
                });
            }
        } catch (error) {
            console.error("Error deleting stall:", error);
            swal({
                title: "Oops!",
                text: "An error occurred while deleting the stall.",
                icon: "error",
                button: "OK",
            });
        }
    }    

    function attachDeleteEventListeners() {
        document.querySelectorAll(".delete-stall").forEach(button => {
            button.addEventListener("click", function (event) {
                event.preventDefault();  
                const stallId = this.dataset.stallId;
                const stallCard = this.closest(".stall-card");
                deleteStall(stallId, stallCard);
            });
        });
    }

    fetchStalls();
});

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("stallForm");
    const submitButton = form.querySelector("button[type='submit']");

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const stallName = document.getElementById("stallName").value.trim();
        const category = document.getElementById("category").value.trim();

        if (!stallName || !category) {
            swal({
                title: "Validation Error",
                text: "Please fill in both stall name and category.",
                icon: "warning",
                button: "OK",
            });
            return;
        }

        submitButton.disabled = true;

        try {
            const response = await fetch("/api/auth/admin/inventory/stall/a", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    stallName,
                    category,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                swal({
                    title: "Success!",
                    text: data.message || "Stall added successfully!",
                    icon: "success",
                    button: "OK",
                }).then(() => {
                    window.location.reload();
                });
            } else {
                swal({
                    title: "Error",
                    text: data.message || "Failed to add stall. Please try again.",
                    icon: "error",
                    button: "OK",
                });
            }
        } catch (error) {
            console.error("Error:", error);
            swal({
                title: "Oops!",
                text: "An error occurred. Please try again later.",
                icon: "error",
                button: "OK",
            });
        } finally {
            submitButton.disabled = false;
        }
    });
});
