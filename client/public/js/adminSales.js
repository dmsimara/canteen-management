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

document.addEventListener("DOMContentLoaded", async () => {
    const resultsTable = document.getElementById("results");
    const noPurchasesRow = document.getElementById("no-purchases");
    const paginationContainer = document.createElement("div");

    paginationContainer.classList.add("pagination-container", "text-center", "mt-3");
    document.querySelector(".table-container").appendChild(paginationContainer);

    let currentPage = 1;
    const rowsPerPage = 6;
    let salesData = [];

    async function loadData() {
        try {
            const response = await fetch("/api/auth/admin/view/sales");
            const data = await response.json();

            if (!data.success || data.sales.length === 0) {
                noPurchasesRow.style.display = "table-row";  
                paginationContainer.innerHTML = ""; 
                return;
            }

            salesData = data.sales.sort((a, b) => new Date(b.salesDate) - new Date(a.salesDate));
            noPurchasesRow.style.display = "none";
            currentPage = 1;
            renderTable();
            renderPagination();
        } catch (error) {
            console.error("Error fetching sales:", error);
            noPurchasesRow.style.display = "table-row";  
        }
    }

    function renderTable() {
        resultsTable.innerHTML = "";
    
        const startIndex = (currentPage - 1) * rowsPerPage;
        const endIndex = startIndex + rowsPerPage;
        const paginatedSales = salesData.slice(startIndex, endIndex);
    
        paginatedSales.forEach((sale) => {
            const row = document.createElement("tr");
    
            row.innerHTML = `
                <td>${sale.canteenName ? sale.canteenName : "N/A"}</td>
                <td>${sale.stallName ? sale.stallName : "N/A"}</td>
                <td>${sale.productName ? sale.productName : "N/A"}</td>
                <td>${sale.salesDate || "N/A"}</td>
                <td>${sale.quantitySold || "N/A"}</td>
                <td>₱${parseFloat(sale.totalPrice).toFixed(2)}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-warning edit-btn" data-id="${sale.saleId}" data-bs-toggle="modal" data-bs-target="#editModal">Edit</button>
                    <button class="btn btn-sm btn-danger delete-btn" data-id="${sale.saleId}">Delete</button>
                </td>
            `;
    
            resultsTable.appendChild(row);
        });
    }
    

    function renderPagination() {
        paginationContainer.innerHTML = "";

        const totalPages = Math.ceil(salesData.length / rowsPerPage);
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

    loadData();
});


document.getElementById("results").addEventListener("click", async (event) => {
    if (event.target.classList.contains("delete-btn")) {
        const saleId = event.target.dataset.id;

        const isConfirmed = await swal({
            title: "Are you sure?",
            text: "Do you really want to delete this sales report?",
            icon: "warning",
            buttons: ["Cancel", "Yes, delete it!"],
            dangerMode: true,
        });

        if (!isConfirmed) return;

        try {
            const response = await fetch(`/api/auth/admin/sales/${saleId}`, {
                method: "DELETE",
            });

            const result = await response.json();

            if (result.success) {
                swal({
                    title: "Deleted!",
                    text: "Sales report deleted successfully.",
                    icon: "success",
                    button: "OK",
                }).then(() => {
                    location.reload(); 
                });
            } else {
                swal({
                    title: "Error",
                    text: result.message || "An error occurred while deleting the sales report.",
                    icon: "error",
                    button: "OK",
                });
            }
        } catch (error) {
            swal({
                title: "Oops!",
                text: "An error occurred while deleting the sales report.",
                icon: "error",
                button: "OK",
            });
            console.error(error);
        }
    }
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
                swal({
                    title: "Success!",
                    text: "Sales record added successfully!",
                    icon: "success",
                    button: "OK",
                }).then(() => {
                    window.location.reload();  
                });
            } else {
                swal({
                    title: "Error",
                    text: `Error: ${result.message}`,
                    icon: "error",
                    button: "OK",
                });
            }
        } catch (error) {
            swal({
                title: "Oops!",
                text: "Failed to add sales. Please try again.",
                icon: "error",
                button: "OK",
            });
            console.error("Error adding sales:", error);
        }
    });
});


document.addEventListener("click", async function (event) {
    if (event.target.classList.contains("edit-btn")) {
        const saleId = event.target.getAttribute("data-id");
        console.log("Clicked Sale ID:", saleId);

        if (!saleId) {
            console.error("Sale ID is missing.");
            return;
        }

        try {
            const response = await fetch(`/api/auth/admin/sales/edit/${saleId}`);
            const data = await response.json();

            if (data.success) {
                const sale = data.sale;
                console.log("Fetched Sale Data:", sale);

                document.getElementById("editReportId").value = sale.saleId;
                document.getElementById("editSalesDate").value = sale.salesDate;
                document.getElementById("editCanteenId").value = sale.canteenId;
                document.getElementById("editQuantitySold").value = sale.quantitySold;
                document.getElementById("editProfit").value = sale.profit;
                document.getElementById("editTotalPrice").value = sale.totalPrice;

                await fetchStallsForEdit(sale.canteenId, sale.stallId);

                await fetchProductsForEdit(sale.stallId, sale.productId);

                const editModal = new bootstrap.Modal(document.getElementById("editModal"));
                editModal.show();
            } else {
                alert("Failed to fetch sales data.");
            }
        } catch (error) {
            console.error("Error fetching sale data:", error);
            alert("An error occurred while fetching sales data.");
        }
    }
});

async function fetchStallsForEdit(canteenId, selectedStallId) {
    const stallDropdown = document.getElementById("editStallId");
    stallDropdown.innerHTML = `<option selected disabled value="">Select a stall</option>`; 

    if (!canteenId) return;

    try {
        const response = await fetch(`/api/auth/admin/view/stalls?canteenId=${canteenId}`);
        const data = await response.json();

        if (!data.success || !data.stalls.length) {
            stallDropdown.innerHTML = `<option selected disabled value="">No stalls available</option>`;
            document.getElementById("editProductId").innerHTML = `<option selected disabled value="">Select Product</option>`;
            return;
        }

        data.stalls.forEach(stall => {
            const option = document.createElement("option");
            option.value = stall.stallId;
            option.textContent = stall.stallName;
            if (stall.stallId == selectedStallId) {
                option.selected = true;
            }
            stallDropdown.appendChild(option);
        });

    } catch (error) {
        console.error("Error fetching stalls:", error);
        stallDropdown.innerHTML = `<option selected disabled value="">Error loading stalls</option>`;
    }
}

document.getElementById("editCanteenId").addEventListener("change", function () {
    const canteenId = this.value;
    fetchStallsForEdit(canteenId, null); 
    document.getElementById("editProductId").innerHTML = `<option selected disabled value="">Select Product</option>`; 
});

async function fetchProductsForEdit(stallId, selectedProductId) {
    const productDropdown = document.getElementById("editProductId");
    productDropdown.innerHTML = `<option selected disabled value="">Select Product</option>`; 

    if (!stallId) return;

    try {
        const response = await fetch(`/api/auth/admin/view/products?stallId=${stallId}`);
        const data = await response.json();

        if (!data.success || !data.products.length) {
            productDropdown.innerHTML = `<option selected disabled value="">No products available</option>`;
            return;
        }

        data.products.forEach(product => {
            const option = document.createElement("option");
            option.value = product.productId;
            option.textContent = product.productName;
            if (product.productId == selectedProductId) {
                option.selected = true;
            }
            productDropdown.appendChild(option);
        });

    } catch (error) {
        console.error("Error fetching products:", error);
        productDropdown.innerHTML = `<option selected disabled value="">Error loading products</option>`;
    }
}

document.getElementById("editStallId").addEventListener("change", function () {
    const stallId = this.value;
    fetchProductsForEdit(stallId, null);
});

document.getElementById("editProductId").addEventListener("change", updateEditTotalPrice);
document.getElementById("editQuantitySold").addEventListener("input", updateEditTotalPrice);
document.getElementById("editProfit").addEventListener("input", updateEditTotalPrice);

function updateEditTotalPrice() {
    const quantity = parseFloat(document.getElementById("editQuantitySold").value) || 0;
    const priceSold = parseFloat(document.getElementById("editProfit").value) || 0; 
    document.getElementById("editTotalPrice").value = (quantity * priceSold).toFixed(2);
}

document.addEventListener("DOMContentLoaded", () => {
    const editForm = document.getElementById("editForm");

    editForm.addEventListener("submit", async (event) => {
        event.preventDefault(); 
        console.log("Update button clicked!"); 

        const saleId = document.getElementById("editReportId").value;
        console.log("Sale ID:", saleId); 

        const formData = {
            salesDate: document.getElementById("editSalesDate").value,
            canteenId: document.getElementById("editCanteenId").value,
            stallId: document.getElementById("editStallId").value,
            productId: document.getElementById("editProductId").value,
            quantitySold: document.getElementById("editQuantitySold").value,
            profit: document.getElementById("editProfit").value,
            totalPrice: document.getElementById("editTotalPrice").value
        };

        console.log("Form Data:", formData); 

        try {
            const response = await fetch(`/api/auth/admin/sales/update/${saleId}`, {
                method: "PATCH", 
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(formData)
            });

            console.log("Response Status:", response.status);
            const result = await response.json();
            console.log("Response Data:", result);

            if (result.success) {
                Swal.fire({
                    icon: "success",
                    title: "Updated!",
                    text: "Sale report updated successfully.",
                    confirmButtonColor: "#3085d6",
                    confirmButtonText: "OK"
                }).then(() => {
                    location.reload();
                });
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Error!",
                    text: result.message,
                    confirmButtonColor: "#d33",
                    confirmButtonText: "OK"
                });
            }
        } catch (error) {
            console.error("Error updating sale:", error);
            Swal.fire({
                icon: "error",
                title: "Oops!",
                text: "Something went wrong. Please try again later.",
                confirmButtonColor: "#d33",
                confirmButtonText: "OK"
            });
        }
    });
});








document.addEventListener("DOMContentLoaded", () => {
    console.log("FilterSales.js loaded!");

    const form = document.getElementById("sales-filter-form");
    const resultsTable = document.getElementById("results");
    const noPurchasesRow = document.getElementById("no-purchases");
    const resetButton = document.getElementById("reset-filter");

    if (!form) {
        console.error("Form not found!");
        return;
    }

    form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const startDate = document.getElementById("start-date").value;
        const endDate = document.getElementById("end-date").value;

        try {
            const response = await fetch("/api/auth/admin/filter/sales", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ startDate, endDate }),
            });

            const data = await response.json();
            console.log("Filtered Sales Response:", data);

            resultsTable.innerHTML = "";

            if (data.noSalesOverall) {
                noPurchasesRow.style.display = "table-row";
                noPurchasesRow.innerHTML = `
                    <td colspan="6" class="text-center fw-bold text-secondary">
                        No Records Yet
                    </td>
                `;
            } else if (data.noSales) {
                noPurchasesRow.style.display = "table-row";
                noPurchasesRow.innerHTML = `
                    <td colspan="6" class="text-center fw-bold text-danger">
                        No records found for this date range.
                    </td>
                `;
            } else {
                noPurchasesRow.style.display = "none";

                data.sales.forEach(sale => {
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td>${sale.canteenName}</td>
                        <td>${sale.stallName}</td>
                        <td>${sale.salesDate}</td>
                        <td>${sale.quantitySold}</td>
                        <td>₱${sale.totalPrice.toFixed(2)}</td>
                        <td class="text-end">
                            <button class="btn btn-sm btn-warning edit-btn" data-id="${sale.saleId}">Edit</button>
                            <button class="btn btn-sm btn-danger delete-btn" data-id="${sale.saleId}">Delete</button>
                        </td>
                    `;
                    resultsTable.appendChild(row);
                });
            }
        } catch (error) {
            console.error("Error fetching filtered sales:", error);
        }
    });

    if (resetButton) {
        resetButton.addEventListener("click", () => {
            location.reload();
        });
    } else {
        console.error("Reset button not found!");
    }
});


document.addEventListener("DOMContentLoaded", () => {
    const exportPeriod = document.getElementById("export-period");
    const exportCsvBtn = document.getElementById("export-csv");
    const exportPdfBtn = document.getElementById("export-pdf");

    function updateExportLinks() {
        const selectedPeriod = exportPeriod.value;
        exportCsvBtn.setAttribute("onclick", `window.location.href='/api/auth/admin/export/sales/csv/${selectedPeriod}'`);
        exportPdfBtn.setAttribute("onclick", `window.location.href='/api/auth/admin/export/sales/pdf/${selectedPeriod}'`);
    }

    exportPeriod.addEventListener("change", updateExportLinks);

    updateExportLinks();
});
