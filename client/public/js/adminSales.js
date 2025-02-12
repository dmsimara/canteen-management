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

document.addEventListener("DOMContentLoaded", async () => {
    const resultsTable = document.getElementById("results");
    const noPurchasesRow = document.getElementById("no-purchases");

    try {
        const response = await fetch("/api/auth/admin/view/sales");
        const data = await response.json();

        if (!data.success || !data.sales.length) {
            noPurchasesRow.style.display = "table-row";  
            return;
        }

        resultsTable.innerHTML = "";  

        data.sales.forEach((sale) => {
            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${sale.canteenId || "N/A"}</td>
                <td>${sale.stallId || "N/A"}</td>
                <td>${sale.salesDate || "N/A"}</td>
                <td>₱${parseFloat(sale.cost).toFixed(2)}</td>
                <td>₱${parseFloat(sale.cash).toFixed(2)}</td>
                <td>₱${parseFloat(sale.profit).toFixed(2)}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-warning edit-btn" data-id="${sale.reportId}">Edit</button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${sale.reportId}">Delete</button>
                </td>
            `;

            resultsTable.appendChild(row);
        });
    } catch (error) {
        console.error("Error fetching sales:", error);
        noPurchasesRow.style.display = "table-row";  
    }
});

document.getElementById("results").addEventListener("click", async (event) => {
    if (event.target.classList.contains("delete-btn")) {
        const reportId = event.target.dataset.id;

        if (!confirm("Are you sure you want to delete this sales report?")) return;

        try {
            const response = await fetch(`/api/auth/admin/sales/${reportId}`, {
                method: "DELETE",
            });

            const result = await response.json();

            if (result.success) {
                alert("Sales report deleted successfully!");
                location.reload();  
            } else {
                alert(result.message);
            }
        } catch (error) {
            alert("An error occurred while deleting the sales report.");
            console.error(error);
        }
    }
});


document.addEventListener("DOMContentLoaded", () => {
    const canteenSelect = document.getElementById("canteenId");
    const stallSelect = document.getElementById("stallId");

    canteenSelect.addEventListener("change", async () => {
        const canteenId = canteenSelect.value;

        if (!canteenId) {
            stallSelect.innerHTML = `<option selected disabled value="">Select a stall</option>`;
            return;
        }

        try {
            const response = await fetch(`/api/auth/admin/view/stalls?canteenId=${canteenId}`);
            const data = await response.json();

            if (!data.success || !data.stalls.length) {
                stallSelect.innerHTML = `<option selected disabled value="">No stalls available</option>`;
                return;
            }

            stallSelect.innerHTML = `<option selected disabled value="">Select a stall</option>`;
            data.stalls.forEach(stall => {
                const option = document.createElement("option");
                option.value = stall.stallId;
                option.textContent = stall.stallName;
                stallSelect.appendChild(option);
            });

        } catch (error) {
            console.error("Error fetching stalls:", error);
            stallSelect.innerHTML = `<option selected disabled value="">Error loading stalls</option>`;
        }
    });
});

document.addEventListener("DOMContentLoaded", () => {
    const salesForm = document.getElementById("salesForm");

    salesForm.addEventListener("submit", async (event) => {
        event.preventDefault(); 

        const formData = new FormData(salesForm);
        const salesData = Object.fromEntries(formData.entries()); 

        try {
            const response = await fetch("/api/auth/admin/add/sales", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(salesData),
            });

            const result = await response.json();

            if (result.success) {
                alert("Sales record added successfully!");
                window.location.reload(); 
            } else {
                alert(`Error: ${result.message}`);
            }
        } catch (error) {
            console.error("Error adding sales:", error);
            alert("Failed to add sales. Please try again.");
        }
    });
});