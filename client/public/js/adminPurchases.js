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
    const form = document.getElementById("purchaseForm");
    const canteenSelect = document.getElementById("canteenId");
    const stallSelect = document.getElementById("stallId");

    canteenSelect.addEventListener("change", async () => {
        const canteenId = canteenSelect.value;
        stallSelect.innerHTML = `<option selected disabled value="">Loading stalls...</option>`;

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

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const productName = document.getElementById("productName").value.trim();
        const price = parseFloat(document.getElementById("price").value);
        const quantity = parseInt(document.getElementById("quantity").value, 10);
        const unit = document.getElementById("unit").value;
        const MOP = document.getElementById("MOP").value;
        const date = document.getElementById("date").value;
        const stallId = stallSelect.value ? parseInt(stallSelect.value) : null;

        if (!productName || isNaN(price) || isNaN(quantity) || !unit || !MOP || !date || isNaN(stallId)) {
            swal({
                title: "Error",
                text: "Please fill out all fields correctly, including selecting a stall.",
                icon: "warning",
                button: "OK",
            });
            return;
        }

        console.log("Sending request:", JSON.stringify({
            productName, price, quantity, unit, MOP, date, stallId
        }));

        try {
            const response = await fetch("/api/auth/admin/add/purchase", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ productName, price, quantity, unit, MOP, date, stallId })
            });

            const data = await response.json();

            if (response.ok) {
                swal({ title: "Success!", text: data.message, icon: "success", button: "OK" })
                    .then(() => {
                        form.reset();
                        window.location.reload();
                    });
            } else {
                swal({ title: "Error", text: data.message || "Failed to add purchase.", icon: "error", button: "Try Again" });
            }
        } catch (error) {
            swal({ title: "Oops!", text: "An error occurred.", icon: "error", button: "OK" });
            console.error("Error:", error);
        }
    });
});

document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.querySelector("#search");
    const resultsBody = document.querySelector("#results");
    const noPurchasesRow = document.createElement("tr");
    const paginationContainer = document.createElement("div");

    noPurchasesRow.innerHTML = `<td colspan="7" class="text-center">No purchases found</td>`;
    noPurchasesRow.id = "no-purchases";
    noPurchasesRow.style.display = "none";
    resultsBody.appendChild(noPurchasesRow);

    paginationContainer.classList.add("pagination-container", "text-center", "mt-3");
    document.querySelector(".table-container").after(paginationContainer);

    let currentPage = 1;
    const rowsPerPage = 7;
    let purchasesData = [];

    async function loadData(query = "") {
        try {
            const response = await fetch(`/api/auth/admin/search?q=${encodeURIComponent(query)}`);
            const data = await response.json();

            if (data.success && data.purchases.length > 0) {
                purchasesData = data.purchases.sort((a, b) => new Date(b.date) - new Date(a.date));
                noPurchasesRow.style.display = "none";
                currentPage = 1; 
                renderTable();
                renderPagination();
            } else {
                resultsBody.innerHTML = "";
                resultsBody.appendChild(noPurchasesRow);
                noPurchasesRow.style.display = "table-row";
                paginationContainer.innerHTML = ""; 
            }
        } catch (error) {
            console.error("Error fetching search results:", error);
        }
    }

    function renderTable() {
        resultsBody.innerHTML = "";

        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        const paginatedPurchases = purchasesData.slice(startIndex, endIndex);

        paginatedPurchases.forEach(purchase => {
            const total = (purchase.price * purchase.quantity).toFixed(2);

            const row = `
                <tr data-id="${purchase.productId}">
                    <td>${purchase.productName}</td>
                    <td>₱${purchase.price.toFixed(2)}</td>
                    <td>${purchase.quantity}</td>
                    <td>${purchase.MOP}</td>
                    <td>${purchase.date}</td>
                    <td class="total text-end">₱${total}</td>
                    <td class="text-end">
                        <button class="btn btn-danger delete-btn" data-id="${purchase.productId}">Delete</button>
                    </td>
                </tr>
            `;
            resultsBody.insertAdjacentHTML("beforeend", row);
        });
    }

    function renderPagination() {
        paginationContainer.innerHTML = "";

        const totalPages = Math.ceil(purchasesData.length / rowsPerPage);
        if (totalPages <= 1) return;

        const prevButton = document.createElement("button");
        prevButton.textContent = "Previous";
        prevButton.classList.add("btn", "btn-danger", "me-2");
        prevButton.disabled = currentPage === 1;
        prevButton.addEventListener("click", () => {
            if (currentPage > 1) {
                currentPage--;
                renderTable();
                renderPagination();
            }
        });

        const nextButton = document.createElement("button");
        nextButton.textContent = "Next";
        nextButton.classList.add("btn", "btn-success");
        nextButton.disabled = currentPage === totalPages;
        nextButton.addEventListener("click", () => {
            if (currentPage < totalPages) {
                currentPage++;
                renderTable();
                renderPagination();
            }
        });

        paginationContainer.appendChild(prevButton);
        paginationContainer.appendChild(nextButton);
    }

    async function deletePurchase(productId) {
        const isConfirmed = await swal({
            title: "Are you sure?",
            text: "Do you really want to delete this purchase?",
            icon: "warning",
            buttons: ["Cancel", "Delete"],
            dangerMode: true,
        });
    
        if (!isConfirmed) {
            return; 
        }
    
        try {
            const response = await fetch(`/api/auth/admin/purchases/${productId}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
            });
    
            const data = await response.json();
    
            if (response.ok) {
                purchasesData = purchasesData.filter(purchase => purchase.productId !== parseInt(productId));
    
                if (purchasesData.length === 0) {
                    swal({
                        title: "Success!",
                        text: "Purchase deleted successfully!",
                        icon: "success",
                        button: "OK",
                    }).then(() => {
                        location.reload(); 
                    });
                    return;
                }
    
                renderTable();
                renderPagination();
    
                swal({
                    title: "Deleted",
                    text: "Purchase deleted successfully!",
                    icon: "success",
                    button: "OK",
                });
            } else {
                swal({
                    title: "Error",
                    text: data.message || "Failed to delete purchase",
                    icon: "error",
                    button: "OK",
                });
            }
        } catch (error) {
            console.error("Error deleting purchase:", error);
            swal({
                title: "Oops!",
                text: "An error occurred while deleting the purchase. Please try again later.",
                icon: "error",
                button: "OK",
            });
        }
    }    
    
    resultsBody.addEventListener("click", event => {
        if (event.target.classList.contains("delete-btn")) {
            const productId = event.target.getAttribute("data-id");
            deletePurchase(productId);
        }
    });

    searchInput.addEventListener("input", () => {
        const query = searchInput.value.trim();
        loadData(query);
    });

    loadData();
});
