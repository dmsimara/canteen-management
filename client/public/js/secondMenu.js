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
    const resultContainer = document.getElementById("result");

    try {
        const response = await fetch("/api/auth/admin/view/menu/second");
        const data = await response.json();

        if (!data.success || !data.menu.length) {
            resultContainer.innerHTML = `<p class="no-result">No menu added yet</p>`;
            return;
        }

        resultContainer.innerHTML = data.menu.map(menu => `
            <div class="card" style="width: 18rem;">
                <img src="${menu.picture}" class="card-img-top" alt="${menu.name}">
                <div class="card-body">
                    <h5 class="card-title">${menu.name}</h5>
                    
                    <!-- View Details Button -->
                    <button class="btn btn-primary mt-2 view-menu" 
                        data-id="${menu.menuId}" 
                        data-name="${menu.name}" 
                        data-picture="${menu.picture}" 
                        data-ingredients='${JSON.stringify(menu.ingredients)}' 
                        data-price="${menu.sellingPrice}">
                        View
                    </button>

                    <!-- Edit Button -->
                    <button class="btn btn-warning mt-2 edit-menu" 
                        data-id="${menu.menuId}" 
                        data-name="${menu.name}" 
                        data-picture="${menu.picture}" 
                        data-ingredients='${JSON.stringify(menu.ingredients)}' 
                        data-price="${menu.sellingPrice}">
                        Edit
                    </button>
                </div>
            </div>
        `).join("");

        document.querySelectorAll(".view-menu").forEach(button => {
            button.addEventListener("click", (event) => {
                const menuId = event.target.getAttribute("data-id");
                const name = event.target.getAttribute("data-name");
                const picture = event.target.getAttribute("data-picture");
                const ingredients = JSON.parse(event.target.getAttribute("data-ingredients"));
                const price = event.target.getAttribute("data-price");

                showMenuDetails(menuId, name, picture, ingredients, price);
            });
        });

        document.querySelectorAll(".edit-menu").forEach(button => {
            button.addEventListener("click", (event) => {
                const menuId = event.target.getAttribute("data-id");
                const name = event.target.getAttribute("data-name");
                const picture = event.target.getAttribute("data-picture");
                const ingredients = JSON.parse(event.target.getAttribute("data-ingredients"));
                const price = event.target.getAttribute("data-price");

                editMenu(menuId, name, picture, ingredients, price);
            });
        });

    } catch (error) {
        resultContainer.innerHTML = `<p class="text-center text-danger">Failed to load menu. Try again later.</p>`;
        console.error("Error fetching menu:", error);
    }
});

function showMenuDetails(menuId, name, picture, ingredients, price) {
    document.getElementById("menuImage").src = picture;
    document.getElementById("menuName").textContent = name;
    document.getElementById("menuPrice").textContent = `₱${price}`;

    const ingredientsList = document.getElementById("menuIngredients");
    ingredientsList.innerHTML = ""; 

    if (ingredients && ingredients.length > 0) {
        ingredients.forEach(ingredient => {
            const li = document.createElement("li");
            li.innerHTML = `${ingredient.ingredient} - ${ingredient.quantity} (<span class="ingredient-cost">₱${ingredient.cost}</span>)`;
            ingredientsList.appendChild(li);
        });
    } else {
        ingredientsList.innerHTML = "<li>No ingredients listed</li>";
    }

    document.getElementById("deleteButton").setAttribute("data-menu-id", menuId);

    const menuModal = new bootstrap.Modal(document.getElementById("menuModal"));
    menuModal.show();
}

function editMenu(menuId, name, picture, ingredients, price) {
    document.getElementById("editMenuId").value = menuId;
    document.getElementById("editName").value = name;
    document.getElementById("editSellingPrice").value = price;

    const previewImage = document.getElementById("previewImage");
    if (picture) {
        previewImage.src = picture;
        previewImage.style.display = "block";
    } else {
        previewImage.style.display = "none";
    }

    const editIngredientsContainer = document.getElementById("editIngredientsContainer");
    editIngredientsContainer.innerHTML = "";

    let parsedIngredients = [];
    try {
        parsedIngredients = typeof ingredients === "string" ? JSON.parse(ingredients) : ingredients;
    } catch (error) {
        console.error("Error parsing ingredients:", error, ingredients);
    }

    console.log("Parsed Ingredients:", parsedIngredients);

    if (Array.isArray(parsedIngredients) && parsedIngredients.length) {
        parsedIngredients.forEach(ing => {
            const ingredientRow = document.createElement("div");
            ingredientRow.classList.add("input-group", "mb-2");
            ingredientRow.innerHTML = `
                <input type="text" class="form-control" value="${ing.ingredient}" name="ingredients[]" required>
                <input type="text" class="form-control" value="${ing.quantity}" name="quantities[]" required>
                <input type="number" class="form-control" value="${ing.cost}" name="costs[]" step="0.01" required>
                <button type="button" class="btn btn-danger" onclick="this.parentElement.remove()">X</button>
            `;
            editIngredientsContainer.appendChild(ingredientRow);
        });

        editIngredientsContainer.setAttribute("data-original-ingredients", JSON.stringify(parsedIngredients));
    } else {
        console.warn("No ingredients found or ingredients are empty.");
        editIngredientsContainer.setAttribute("data-original-ingredients", "[]");
    }

    const editMenuModal = new bootstrap.Modal(document.getElementById("editMenuModal"));
    editMenuModal.show();
}

document.getElementById("addEditIngredient").addEventListener("click", function () {
    const editIngredientsContainer = document.getElementById("editIngredientsContainer");

    const ingredientRow = document.createElement("div");
    ingredientRow.classList.add("input-group", "mb-2");
    ingredientRow.innerHTML = `
        <input type="text" class="form-control" name="ingredients[]" placeholder="Ingredient Name" required>
        <input type="text" class="form-control" name="quantities[]" placeholder="Quantity (e.g., 1 pc)" required>
        <input type="number" class="form-control" name="costs[]" placeholder="Cost" step="0.01" required>
        <button type="button" class="btn btn-danger" onclick="this.parentElement.remove()">X</button>
    `;

    editIngredientsContainer.appendChild(ingredientRow);
});

document.getElementById("editMenuForm").addEventListener("submit", async function (event) {
    event.preventDefault(); 

    const formData = new FormData(this);
    const menuId = document.getElementById("editMenuId").value;

    const ingredients = [];
    document.querySelectorAll("#editIngredientsContainer .input-group").forEach(row => {
        const ingredient = row.querySelector('input[name="ingredients[]"]').value.trim();
        const quantity = row.querySelector('input[name="quantities[]"]').value.trim();
        const cost = row.querySelector('input[name="costs[]"]').value.trim();

        if (ingredient && quantity && cost) {
            ingredients.push({ ingredient, quantity, cost });
        }
    });

    formData.delete("ingredients[]");
    formData.delete("quantities[]");
    formData.delete("costs[]");

    formData.append("ingredients", JSON.stringify(ingredients));

    const pictureInput = document.getElementById("picture");
    if (pictureInput.files.length > 0) {
        formData.append("picture", pictureInput.files[0]);
    }

    console.log("FormData being sent:");
    for (let pair of formData.entries()) {
        console.log(pair[0], pair[1]);
    }

    try {
        const response = await fetch(`/api/auth/admin/menu/update/${menuId}`, {
            method: "PATCH",
            body: formData,
        });

        const result = await response.json();
        console.log("Response from server:", result);

        if (result.success) {
            Swal.fire({
                icon: 'success',
                title: 'Menu updated successfully!',
                text: 'The menu has been updated and changes are saved.',
                confirmButtonText: 'OK'
            }).then(() => {
                location.reload();
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error!',
                text: result.message || 'Something went wrong. Please try again.',
                confirmButtonText: 'OK'
            });
        }
    } catch (error) {
        console.error("Update failed:", error);
        Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'An error occurred while updating the menu. Please try again.',
            confirmButtonText: 'OK'
        });
    }
});

document.getElementById("deleteButton").addEventListener("click", async function () {
    const menuId = this.getAttribute("data-menu-id");

    if (!menuId) {
        Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'No menu selected for deletion.',
            confirmButtonText: 'OK'
        });
        return;
    }

    const isConfirmed = await Swal.fire({
        title: 'Are you sure?',
        text: "Do you want to delete this menu? This action cannot be undone.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'Cancel'
    });

    if (!isConfirmed.isConfirmed) return; 

    try {
        const response = await fetch(`/api/auth/admin/menu/${menuId}`, {
            method: "DELETE",
        });

        const data = await response.json();

        if (data.success) {
            Swal.fire({
                icon: 'success',
                title: 'Deleted!',
                text: 'Menu deleted successfully.',
                confirmButtonText: 'OK'
            }).then(() => {
                location.reload(); 
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Failed!',
                text: 'Failed to delete menu: ' + data.message,
                confirmButtonText: 'OK'
            });
        }
    } catch (error) {
        console.error("Error deleting menu:", error);
        Swal.fire({
            icon: 'error',
            title: 'Error!',
            text: 'An error occurred while deleting the menu.',
            confirmButtonText: 'OK'
        });
    }
});

async function fetchMenuDetails(menuId) {
    try {
        const response = await fetch(`/api/auth/admin/menu/edit/${menuId}`);
        const data = await response.json();

        if (!data.success) {
            Swal.fire({
                icon: 'error',
                title: 'Menu not found!',
                text: 'The details for this menu could not be found.',
                confirmButtonText: 'OK'
            });
            return;
        }

        document.getElementById("menuImage").src = data.menu.picture;
        document.getElementById("menuName").textContent = data.menu.name;
        document.getElementById("menuPrice").textContent = `₱${data.menu.sellingPrice}`;

        const ingredientsList = document.getElementById("menuIngredients");
        ingredientsList.innerHTML = ""; 

        if (data.ingredients && data.ingredients.length > 0) {
            data.ingredients.forEach(ingredient => {
                const li = document.createElement("li");
                li.innerHTML = `${ingredient.ingredient} - ${ingredient.quantity} (<span class="ingredient-cost">₱${ingredient.cost}</span>)`;
                ingredientsList.appendChild(li);
            });
        } else {
            ingredientsList.innerHTML = "<li>No ingredients listed</li>";
        }

        document.getElementById("deleteButton").setAttribute("data-menu-id", menuId);

        const menuModal = new bootstrap.Modal(document.getElementById("menuModal"));
        menuModal.show();

    } catch (error) {
        console.error("Error fetching menu details:", error);
        Swal.fire({
            icon: 'error',
            title: 'Failed to load menu details!',
            text: 'An error occurred while fetching the menu details.',
            confirmButtonText: 'OK'
        });
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
        const response = await fetch("/api/auth/admin/add/second/menu", {
            method: "POST",
            body: formData
        });

        const result = await response.json();
        if (result.success) {
            Swal.fire({
                icon: 'success',
                title: 'Menu added successfully!',
                text: 'The menu has been successfully added.',
                confirmButtonText: 'OK'
            }).then(() => {
                location.reload();
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error adding menu!',
                text: result.message || 'Something went wrong. Please try again.',
                confirmButtonText: 'OK'
            });
        }
    } catch (error) {
        console.error("Error:", error);
        Swal.fire({
            icon: 'error',
            title: 'Failed to add menu!',
            text: 'An error occurred while adding the menu.',
            confirmButtonText: 'OK'
        });
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
