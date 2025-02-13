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
    const resultContainer = document.getElementById("result");

    try {
        const response = await fetch("/api/auth/admin/view/menu/main");
        const data = await response.json();

        if (!data.success || !data.menu.length) {
            resultContainer.innerHTML = `<p class="no-result">No menu added yet</p>`;
            return;
        }

        resultContainer.innerHTML = data.menu.map(menu => `
            <a href="#" data-bs-toggle="modal" data-bs-target="#menuModal" onclick="setMenuId(${menu.menuId})">
                <div class="card" style="width: 18rem;">
                    <img src="${menu.picture}" class="card-img-top" alt="${menu.name}">
                    <div class="card-body">
                        <h5 class="card-title">${menu.name}</h5>
                    </div>
                </div>
            </a>
        `).join("");
    } catch (error) {
        resultContainer.innerHTML = `<p class="text-center text-danger">Failed to load menu. Try again later.</p>`;
        console.error("Error fetching menu:", error);
    }
});

function setMenuId(menuId) {
    document.getElementById("deleteButton").setAttribute("data-menuId", menuId);
    
    fetch(`/api/auth/admin/menu/edit/${menuId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                document.getElementById("menuImage").src = data.menu.picture;
                document.getElementById("menuName").innerText = data.menu.name;
                document.getElementById("menuPrice").innerText = "₱" + data.menu.sellingPrice;

                const ingredientsList = document.getElementById("menuIngredients");
                ingredientsList.innerHTML = "";
                data.ingredients.forEach(ingredient => {
                    const li = document.createElement("li");
                    li.innerHTML = `${ingredient.ingredient} - <span class="ingredient-cost">₱${ingredient.cost}</span>`;
                    ingredientsList.appendChild(li);
                });
            }
        })
        .catch(error => console.error("Error fetching menu details:", error));
}

document.getElementById("deleteButton")?.addEventListener("click", async () => {
    const menuId = document.getElementById("deleteButton").getAttribute("data-menuId");

    const isConfirmed = confirm("Are you sure you want to delete this menu? This action cannot be undone.");
    
    if (!isConfirmed) {
        return; 
    }

    try {
        const response = await fetch(`/api/auth/admin/menu/${menuId}`, {
            method: "DELETE",
        });

        const data = await response.json();

        if (data.success) {
            alert("Menu deleted successfully");
            location.reload();  
        } else {
            alert("Failed to delete menu: " + data.message);
        }
    } catch (error) {
        console.error("Error deleting menu:", error);
        alert("An error occurred while deleting the menu");
    }
});

async function fetchMenuDetails(menuId) {
    try {
        const response = await fetch(`/api/auth/admin/menu/edit/${menuId}`);
        const data = await response.json();

        if (!data.success) {
            alert("Menu details not found!");
            return;
        }

        document.getElementById("menuImage").src = data.menu.picture;
        document.getElementById("menuName").textContent = data.menu.name;
        document.getElementById("menuPrice").textContent = `₱${data.menu.sellingPrice}`;

        const ingredientsList = document.getElementById("menuIngredients");
        ingredientsList.innerHTML = data.ingredients.map(ingredient => `
            <li>
               ${ingredient.ingredient} -&nbsp;
               <span class="ingredient-cost">₱${ingredient.cost}</span>
            </li>
        `).join("");

    } catch (error) {
        console.error("Error fetching menu details:", error);
        alert("Failed to load menu details.");
    }
}


document.getElementById("menuForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    
    const formData = new FormData(this);

    const ingredients = [];
    document.querySelectorAll(".ingredient-row").forEach(row => {
        const ingredient = row.querySelector('.ingredient-input').value;
        const quantity = row.querySelector('.quantity-input').value;
        const cost = row.querySelector('.cost-input').value;

        if (ingredient && quantity && cost) {
            ingredients.push({ ingredient, quantity, cost });
        }
    });

    formData.append("ingredients", JSON.stringify(ingredients));

    try {
        const response = await fetch("/api/auth/admin/add/menu", {
            method: "POST",
            body: formData
        });

        const result = await response.json();
        if (result.success) {
            alert("Menu added successfully!");
            location.reload();
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Failed to add menu.");
    }
});

document.getElementById("addIngredient").addEventListener("click", function () {
    const container = document.getElementById("ingredientsContainer");

    const newRow = document.createElement("div");
    newRow.classList.add("row", "mb-3", "ingredient-row");
    newRow.innerHTML = `
        <div class="col">
            <input type="text" class="form-control ingredient-input" required placeholder="Ingredient">
        </div>
        <div class="col">
            <input type="text" class="form-control quantity-input" required placeholder="Quantity">
        </div>
        <div class="col">
            <input type="number" class="form-control cost-input" required placeholder="Cost">
        </div>
        <div class="col-auto d-flex align-items-end">
            <button type="button" class="btn btn-danger remove-ingredient">X</button>
        </div>
    `;
    container.appendChild(newRow);
});

document.getElementById("ingredientsContainer").addEventListener("click", function (e) {
    if (e.target.classList.contains("remove-ingredient")) {
        e.target.closest(".ingredient-row").remove();
    }
});
