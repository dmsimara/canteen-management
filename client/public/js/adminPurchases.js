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

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("purchaseForm");  
    const submitButton = form.querySelector("button[type='submit']");

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const productName = document.getElementById("productName").value.trim();
        const price = parseFloat(document.getElementById("price").value).toFixed(2);  
        const quantity = parseInt(document.getElementById("quantity").value, 10);
        const MOP = document.getElementById("MOP").value;
        const date = document.getElementById("date").value;

        submitButton.disabled = true;

        try {
            const response = await fetch("/api/auth/admin/add/purchase", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productName,
                    price: parseFloat(price),  
                    quantity,
                    MOP,
                    date,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                alert(data.message);
                window.location.reload();
            } else {
                alert(data.message || "Failed to add purchase. Please try again.");
            }
        } catch (error) {
            console.error("Error:", error);
            alert("An error occurred. Please try again later.");
        } finally {
            submitButton.disabled = false;
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
        if (!confirm("Are you sure you want to delete this purchase?")) return;
    
        try {
            const response = await fetch(`/api/auth/admin/purchases/${productId}`, {
                method: "DELETE",
                headers: { "Content-Type": "application/json" }
            });
    
            const data = await response.json();
    
            if (response.ok) {
                purchasesData = purchasesData.filter(purchase => purchase.productId !== parseInt(productId));
                
                if (purchasesData.length === 0) {
                    alert("Purchase deleted successfully!");
                    location.reload(); 
                    return;
                }
    
                renderTable();
                renderPagination();
                alert("Purchase deleted successfully!");
            } else {
                alert(data.message || "Failed to delete purchase");
            }
        } catch (error) {
            console.error("Error deleting purchase:", error);
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

