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
        const isConfirmed = confirm("Are you sure you want to log out?");
        
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
                alert(data.message); 
                window.location.href = "/"; 
            } else {
                alert(data.message || "Logout failed. Please try again.");
            }
        } catch (error) {
            alert("An error occurred during logout. Please try again later.");
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
                                    <a href="#" class="btn btn-primary">View</a>
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
        if (!confirm("Are you sure you want to delete this stall? This action cannot be undone.")) {
            return;
        }

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
                alert("Stall deleted successfully!");
            } else {
                alert(data.message); 
            }
        } catch (error) {
            console.error("Error deleting stall:", error);
            alert("An error occurred while deleting the stall.");
        }
    }

    function attachDeleteEventListeners() {
        document.querySelectorAll(".delete-stall").forEach(button => {
            button.addEventListener("click", function (event) {
                event.preventDefault(); // Prevent navigation
                const stallId = this.dataset.stallId;
                const stallCard = this.closest(".stall-card");
                deleteStall(stallId, stallCard);
            });
        });
    }

    fetchStalls();
});
