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

async function fetchStallsForEdit(canteenId, selectedStallId) {
    const stallSelect = document.getElementById("editStallId");

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
            if (stall.stallId == selectedStallId) {
                option.selected = true; 
            }
            stallSelect.appendChild(option);
        });

    } catch (error) {
        console.error("Error fetching stalls:", error);
        stallSelect.innerHTML = `<option selected disabled value="">Error loading stalls</option>`;
    }
}

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
            const reportId = event.target.getAttribute("data-id");
            if (!reportId) return;

            try {
                const response = await fetch(`/api/auth/admin/sales/edit/${reportId}`);
                const data = await response.json();

                console.log("API Response:", data); 

                if (data.success && data.sale) {
                    document.querySelector("#editReportId").value = reportId;
                    document.querySelector("#editSalesDate").value = data.sale.salesDate || "";
                    document.querySelector("#editCost").value = data.sale.cost || "";
                    document.querySelector("#editCash").value = data.sale.cash || "";
                    document.querySelector("#editCanteenId").value = data.sale.canteenId || "";

                    await fetchStallsForEdit(data.sale.canteenId, data.sale.stallId);

                    editModal.show();
                } else {
                    alert("Error: Sales record not found.");
                }
            } catch (error) {
                console.error("Error fetching sales data:", error);
                alert("Failed to load sales details.");
            }
        }
    });

    editForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const reportId = document.querySelector("#editReportId").value;
        const salesDate = document.querySelector("#editSalesDate").value;
        const cost = document.querySelector("#editCost").value.trim();
        const cash = document.querySelector("#editCash").value.trim();
        const canteenId = document.querySelector("#editCanteenId").value;
        const stallId = document.querySelector("#editStallId").value;

        if (!salesDate || !cost || !cash || !canteenId || !stallId) {
            alert("Please fill in all fields.");
            return;
        }

        try {
            const response = await fetch(`/api/auth/admin/sales/update/${reportId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ salesDate, cost, cash, canteenId, stallId })
            });

            const result = await response.json();

            if (result.success) {
                alert("Sales record updated successfully!");
                editModal.hide();
                location.reload();
            } else {
                alert(result.message || "Failed to update sales record.");
            }
        } catch (error) {
            console.error("Error updating sales record:", error);
            alert("An error occurred while updating.");
        }
    });

    document.querySelector("#editCanteenId").addEventListener("change", async function () {
        const selectedCanteenId = this.value;
        await fetchStallsForEdit(selectedCanteenId, null); 
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
                    <td colspan="7" class="text-center fw-bold text-secondary">
                        No Records Yet
                    </td>
                `;
            } else if (data.noSales) {
                noPurchasesRow.style.display = "table-row";
                noPurchasesRow.innerHTML = `
                    <td colspan="7" class="text-center fw-bold text-danger">
                        No records found for this date range.
                    </td>
                `;
            } else {
                noPurchasesRow.style.display = "none";

                data.sales.forEach(sale => {
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td>${sale.canteenId}</td>
                        <td>${sale.stallId}</td>
                        <td>${sale.salesDate}</td>
                        <td>₱${sale.cost.toFixed(2)}</td>
                        <td>₱${sale.cash.toFixed(2)}</td>
                        <td>₱${sale.profit.toFixed(2)}</td>
                        <td class="text-end">
                            <button class="btn btn-sm btn-warning edit-btn" data-id="${sale.reportId}">Edit</button>
                            <button class="btn btn-sm btn-danger delete-btn" data-id="${sale.reportId}">Delete</button>
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
