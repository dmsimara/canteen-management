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

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("inventoryForm");  
    const submitButton = form.querySelector("button[type='submit']");

    const stallId = window.location.pathname.split("/").pop(); 

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const productName = document.getElementById("productName").value.trim();
        const quantity = parseInt(document.getElementById("quantity").value, 10);
        const unit = document.getElementById("unit").value;

        submitButton.disabled = true;

        try {
            const response = await fetch(`/api/auth/admin/inventory/stall/${stallId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productName,
                    quantity,
                    unit,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                Swal.fire({
                    icon: 'success',
                    title: 'Record added successfully!',
                    text: data.message || 'The product record has been added.',
                    confirmButtonText: 'OK'
                }).then(() => {
                    window.location.reload(); 
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Failed to add record!',
                    text: data.message || 'Please try again.',
                    confirmButtonText: 'OK'
                });
            }
        } catch (error) {
            console.error("Error:", error);
            Swal.fire({
                icon: 'error',
                title: 'An error occurred!',
                text: 'Something went wrong. Please try again later.',
                confirmButtonText: 'OK'
            });
        } finally {
            submitButton.disabled = false;
        }
    });
});


function getStallIdFromPath() {
    const pathSegments = window.location.pathname.split('/');  
    return pathSegments[pathSegments.length - 1];  
}

document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.querySelector("#search");
    const resultsBody = document.querySelector("#results");
    const paginationContainer = document.createElement("div"); 
    paginationContainer.classList.add("pagination-container");
    resultsBody.parentElement.appendChild(paginationContainer);

    const noPurchasesRow = document.createElement("tr");
    noPurchasesRow.innerHTML = `<td colspan="7" class="text-center">No inventories found</td>`;
    noPurchasesRow.id = "no-purchases";
    noPurchasesRow.style.display = "none";
    resultsBody.appendChild(noPurchasesRow);

    let inventories = []; 
    let currentPage = 1;
    const rowsPerPage = 6; 

    async function loadData(query = "") {
        const stallId = getStallIdFromPath();

        if (!stallId || isNaN(stallId)) {
            console.error("❌ Error: stallId is missing or invalid in the URL.");
            return;
        }

        try {
            const response = await fetch(
                `/api/auth/admin/search/inventory?q=${encodeURIComponent(query)}&stallId=${stallId}`
            );
            const data = await response.json();

            if (data.success && data.inventories.length > 0) {
                inventories = data.inventories.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
                noPurchasesRow.style.display = "none";
                currentPage = 1; 
                renderPage(currentPage);
            } else {
                inventories = [];
                renderPage(currentPage);
            }
        } catch (error) {
            console.error("Error fetching search results:", error);
        }
    }

    function renderPage(page) {
        resultsBody.innerHTML = "";
        const startIndex = (page - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        const pageItems = inventories.slice(startIndex, endIndex);

        if (pageItems.length > 0) {
            pageItems.forEach((inventory) => {
                const isLowStock = checkLowStock(inventory.quantity, inventory.unit);
                const row = `
                    <tr data-id="${inventory.inventoryId}" class="${isLowStock ? 'low-stock' : ''}">
                        <td>${inventory.dateAdded}</td>
                        <td>${inventory.productName}</td>
                        <td>${inventory.quantity}</td>
                        <td>${inventory.unit}</td>
                        <td class="text-end">
                            <button class="btn btn-warning edit-btn" data-id="${inventory.inventoryId}">Edit</button>
                            <button class="btn btn-danger delete-btn" data-id="${inventory.inventoryId}">Delete</button>
                        </td>
                    </tr>
                `;
                resultsBody.insertAdjacentHTML("beforeend", row);
            });
        } else {
            resultsBody.appendChild(noPurchasesRow);
            noPurchasesRow.style.display = "table-row";
        }

        updatePaginationButtons();
    }

    function updatePaginationButtons() {
        paginationContainer.innerHTML = "";

        if (inventories.length <= rowsPerPage) return; 

        const totalPages = Math.ceil(inventories.length / rowsPerPage);

        const prevButton = document.createElement("button");
        prevButton.textContent = "Previous";
        prevButton.classList.add("btn", "btn-secondary", "me-2");
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener("click", () => {
            if (currentPage > 1) {
                currentPage--;
                renderPage(currentPage);
            }
        });

        const nextButton = document.createElement("button");
        nextButton.textContent = "Next";
        nextButton.classList.add("btn", "btn-secondary");
        nextButton.disabled = currentPage === totalPages;
        nextButton.addEventListener("click", () => {
            if (currentPage < totalPages) {
                currentPage++;
                renderPage(currentPage);
            }
        });

        paginationContainer.appendChild(prevButton);
        paginationContainer.appendChild(nextButton);
    }

    function checkLowStock(quantity, unit) {
        const thresholds = {
            pieces: 10,
            kilogram: 1,
            gram: 500,
            pack: 2,
            box: 1
        };
        return quantity < (thresholds[unit.toLowerCase()] || Infinity);
    }

    resultsBody.addEventListener("click", (event) => {
        if (event.target.classList.contains("delete-btn")) {
            const inventoryId = event.target.getAttribute("data-id");
            deletePurchase(inventoryId);
        }
    });

    async function deletePurchase(inventoryId) {
        const { value: isConfirmed } = await Swal.fire({
            title: 'Are you sure?',
            text: "Do you really want to delete this record?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'No, cancel!',
            reverseButtons: true
        });
    
        if (!isConfirmed) return;
    
        try {
            const response = await fetch(`/api/auth/admin/stall/inventory/${inventoryId}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" }
            });
    
            const data = await response.json();
    
            if (response.ok) {
                inventories = inventories.filter((item) => item.inventoryId !== parseInt(inventoryId));
                renderPage(currentPage);
    
                Swal.fire({
                    icon: 'success',
                    title: 'Record deleted successfully!',
                    text: data.message || 'The record has been deleted.',
                    confirmButtonText: 'OK'
                });
    
                if (inventories.length === 0) {
                    noPurchasesRow.style.display = "table-row";
                    setTimeout(() => {
                        location.reload();
                    }, 50);
                }
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Deletion failed!',
                    text: data.message || 'Failed to delete the record.',
                    confirmButtonText: 'OK'
                });
            }
        } catch (error) {
            console.error("Error deleting record:", error);
            Swal.fire({
                icon: 'error',
                title: 'An error occurred!',
                text: 'Something went wrong. Please try again later.',
                confirmButtonText: 'OK'
            });
        }
    }    

    searchInput.addEventListener("input", () => {
        const query = searchInput.value.trim();
        loadData(query);
    });

    loadData();
});

document.addEventListener("DOMContentLoaded", function () {
    const editModal = new bootstrap.Modal(document.querySelector("#editModal"));
    const editForm = document.querySelector("#editForm");
    const resultsBody = document.querySelector("#results");

    if (!editModal || !editForm || !resultsBody) {
        console.error("Modal or form elements not found.");
        return;
    }

    resultsBody.addEventListener("click", async (event) => {
        if (event.target.classList.contains("edit-btn")) {
            const inventoryId = event.target.getAttribute("data-id");
            if (!inventoryId) return;
    
            try {
                const response = await fetch(`/api/auth/admin/inventory/${inventoryId}`);
                const data = await response.json();
    
                if (data.success) {
                    document.querySelector("#editInventoryId").value = inventoryId;
                    document.querySelector("#editProductName").value = data.inventory.productName;
                    document.querySelector("#editQuantity").value = data.inventory.quantity;
                    document.querySelector("#editUnit").value = data.inventory.unit;
    
                    editModal.show(); 
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error!',
                        text: "Inventory data not found.",
                        confirmButtonText: 'OK'
                    });
                }
            } catch (error) {
                console.error("Error fetching inventory:", error);
                Swal.fire({
                    icon: 'error',
                    title: 'Failed to Load Inventory!',
                    text: "An error occurred while fetching the inventory details. Please try again later.",
                    confirmButtonText: 'OK'
                });
            }
        }
    });    

    editForm.addEventListener("submit", async (event) => {
        event.preventDefault();
    
        const inventoryId = document.querySelector("#editInventoryId").value;
        const productName = document.querySelector("#editProductName").value.trim();
        const quantity = document.querySelector("#editQuantity").value.trim();
        const unit = document.querySelector("#editUnit").value.trim();
    
        if (!productName || !quantity || !unit) {
            Swal.fire({
                icon: 'warning',
                title: 'Missing Information',
                text: "Please fill in all fields.",
                confirmButtonText: 'OK'
            });
            return;
        }
    
        try {
            const response = await fetch(`/api/auth/admin/inventory/update/${inventoryId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productName, quantity, unit })
            });
    
            const result = await response.json();
    
            if (result.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Success!',
                    text: "Inventory updated successfully!",
                    confirmButtonText: 'OK'
                }).then(() => {
                    editModal.hide(); 
                    location.reload(); 
                });
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Failed!',
                    text: result.message || "Failed to update inventory.",
                    confirmButtonText: 'OK'
                });
            }
        } catch (error) {
            console.error("Error updating inventory:", error);
            Swal.fire({
                icon: 'error',
                title: 'Error!',
                text: "An error occurred while updating.",
                confirmButtonText: 'OK'
            });
        }
    });
    
});
