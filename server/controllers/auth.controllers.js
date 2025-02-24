import { connectDB } from '../db/connectDB.js';
import { Parser } from "json2csv";
import bcryptjs from 'bcryptjs';
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { connect } from 'http2';

export const adminRegister = async (req, res) => {
    const { adminEmail, adminFirstName, adminLastName, adminPassword, confirmPassword } = req.body;

    try {
        if (!adminEmail || !adminFirstName || !adminLastName || !adminPassword || !confirmPassword) {
            throw new Error("All fields are required");
        }

        if (adminPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match"
            });
        }

        const db = await connectDB(); 

        const userAlreadyExists = await db.get('SELECT * FROM users WHERE adminEmail = ?', [adminEmail]);

        if (userAlreadyExists) {
            return res.status(400).json({
                success: false,
                message: "User already exists"
            });
        }

        const hashedPassword = await bcryptjs.hash(adminPassword, 10);

        const admin = await db.run(
            'INSERT INTO users (adminEmail, adminPassword, adminFirstName, adminLastName) VALUES (?, ?, ?, ?)', 
            [adminEmail, hashedPassword, adminFirstName, adminLastName] 
        );

        res.status(201).json({
            success: true,
            message: "Admin registered successfully!",
            admin: {
                adminEmail,
                adminFirstName,
                adminLastName
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const staffRegister = async (req, res) => {
    const { staffEmail, staffFirstName, staffLastName, stall, staffPassword, confirmPassword } = req.body;

    try {
        if (!staffEmail || !staffFirstName || !staffLastName || !stall || !staffPassword || !confirmPassword) {
            throw new Error("All fields are required");
        }

        if (staffPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: "Passwords do not match"
            });
        }

        const db = await connectDB(); 

        const userAlreadyExists = await db.get('SELECT * FROM staff WHERE staffEmail = ?', [staffEmail]);

        if (userAlreadyExists) {
            return res.status(400).json({
                success: false,
                message: "User already exists"
            });
        }

        const hashedPassword = await bcryptjs.hash(staffPassword, 10);

        const staff = await db.run(
            'INSERT INTO staff (staffEmail, staffPassword, staffFirstName, staffLastName, stall) VALUES (?, ?, ?, ?, ?)', 
            [staffEmail, hashedPassword, staffFirstName, staffLastName, stall] 
        );

        generateTokenAndSetCookie(res, staff.lastID); 

        res.status(201).json({
            success: true,
            message: "Staff registered successfully!",
            staff: {
                staffEmail,
                staffFirstName,
                staffLastName,
                stall
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const adminLogin = async (req, res) => {
    const { adminEmail, adminPassword } = req.body;

    try {
        const db = await connectDB();

        const admin = await db.get('SELECT * FROM users WHERE adminEmail = ?', [adminEmail]);

        if (!admin) {
            return res.status(400).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const isPasswordValid = await bcryptjs.compare(adminPassword, admin.adminPassword);

        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        await db.run('UPDATE users SET lastLogin = ? WHERE adminId = ?', [new Date().toISOString(), admin.adminId]);

        res.status(200).json({
            success: true,
            message: "Admin logged in successfully!",
            admin: {
                adminEmail: admin.adminEmail,
                adminFirstName: admin.adminFirstName,
                adminLastName: admin.adminLastName
            }
        });
    } catch (error) {
        console.log("Error in login: ", error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const staffLogin = async (req, res) => {
    const { staffEmail, staffPassword } = req.body;

    try {
        const db = await connectDB();

        const staff = await db.get('SELECT * FROM staff WHERE staffEmail = ?', [staffEmail]);

        if (!staff) {
            return res.status(400).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const isPasswordValid = await bcryptjs.compare(staffPassword, staff.staffPassword);

        if (!isPasswordValid) {
            return res.status(400).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        generateTokenAndSetCookie(res, staff.staffId);

        res.status(200).json({
            success: true,
            message: "Staff logged in successfully!",
            admin: {
                staffEmail: staff.staffEmail,
                staffFirstName: staff.staffFirstName,
                stall: staff.stall,
                staffLastName: staff.staffLastName
            }
        });
    } catch (error) {
        console.log("Error in login: ", error);
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

export const adminLogout = async (req, res) => {
    res.status(200).json({
        success: true,
        message: "Admin logged out successfully!"
    });
};


export const staffLogout = async (req, res) => {
    res.clearCookie("staffToken");
    res.status(200).json({
        success: true,
        message: "Staff logged out successfully"
    });
};

export const addSchedule = async (req, res) => {
    const { eventDate, eventName, eventDescription } = req.body;

    if (!eventDate || !eventName) {
        return res.status(400).json({
            success: false,
            message: "All fields are required"
        });
    }

    let db;
    try {
        db = await connectDB();

        const schedule = await db.run(
            "INSERT INTO schedule (eventDate, eventName, eventDescription) VALUES (?,?, ?)", 
            [eventDate, eventName, eventDescription]
        );

        res.status(201).json({
            success: true,
            message: "Schedule added successfully!",
            schedule: {
                scheduleId: schedule.lastID,
                eventDate,
                eventName,
                eventDescription
            }
        });
    } catch (error) {
        console.error("Error adding schedule:", error);
        res.status(500).json({
            success: false,
            message: "Failed to add schedule"
        });
    } finally {
        if (db) {
            await db.close();
        }
    }
};

export const addPurchase = async (req, res) => {
    const { productName, price, quantity, MOP, date, stallId, unit } = req.body;

    if (!productName || !price || !quantity || !MOP || !date || !stallId || !unit) {
        return res.status(400).json({
            success: false,
            message: "All fields are required, including stallId and unit."
        });
    }

    let db;
    try {
        db = await connectDB();
        await db.run("BEGIN TRANSACTION");

        let existingProduct = await db.get(
            "SELECT productId FROM products WHERE productName = ? AND stallId = ?", 
            [productName, stallId]
        );

        let productId;
        if (existingProduct) {
            productId = existingProduct.productId;

            await db.run(
                `INSERT INTO products (productName, price, quantity, unit, MOP, date, stallId) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`, 
                [productName, price, quantity, unit, MOP, date, stallId]
            );
        } else {
            const newProduct = await db.run(
                `INSERT INTO products (productName, price, quantity, unit, MOP, date, stallId) 
                VALUES (?, ?, ?, ?, ?, ?, ?)`, 
                [productName, price, quantity, unit, MOP, date, stallId]
            );
            productId = newProduct.lastID;
        }

        const existingInventory = await db.get(
            "SELECT inventoryId FROM inventory WHERE productId = ? AND stallId = ?", 
            [productId, stallId]
        );

        if (existingInventory) {
            await db.run(
                "UPDATE inventory SET quantity = quantity + ? WHERE inventoryId = ?", 
                [quantity, existingInventory.inventoryId]
            );
        } else {
            await db.run(
                `INSERT INTO inventory (productId, quantity, unit, stallId, dateAdded) 
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)`, 
                [productId, quantity, unit, stallId]
            );
        }

        await db.run("COMMIT");

        res.status(201).json({
            success: true,
            message: "Purchase recorded and inventory updated!",
            purchase: {
                productId,
                productName,
                price,
                quantity,
                MOP,
                date
            }
        });
    } catch (error) {
        await db.run("ROLLBACK");
        console.error("Error adding purchase:", error);
        res.status(500).json({
            success: false,
            message: "Failed to add purchase and update inventory"
        });
    } finally {
        if (db) {
            await db.close();
        }
    }
};


export const addMainMenu = async (req, res) => {
    try {
        const { name, sellingPrice } = req.body;
        let ingredients = [];

        try {
            ingredients = JSON.parse(req.body.ingredients || "[]");
        } catch (error) {
            return res.status(400).json({ success: false, message: "Invalid ingredients format." });
        }

        const canteenId = 1;
        const picture = req.file ? `/uploads/${req.file.filename}` : null;

        if (!name || !picture || !sellingPrice || ingredients.length === 0) {
            return res.status(400).json({
                success: false,
                message: "All fields are required, including at least one ingredient."
            });
        }

        let db;
        try {
            db = await connectDB();

            const result = await db.run(
                "INSERT INTO menu (name, picture, sellingPrice, canteenId) VALUES (?, ?, ?, ?)",
                [name, picture, sellingPrice, canteenId]
            );

            const menuId = result.lastID;

            const ingredientInsertPromises = ingredients.map(({ ingredient, quantity, cost }) => {
                return db.run(
                    "INSERT INTO ingredients (menuId, ingredient, quantity, cost) VALUES (?, ?, ?, ?)",
                    [menuId, ingredient, quantity, cost]
                );
            });

            await Promise.all(ingredientInsertPromises);

            res.status(201).json({
                success: true,
                message: "Menu added successfully!",
                menuId: menuId
            });

        } catch (error) {
            console.error("Error adding menu:", error);
            res.status(500).json({
                success: false,
                message: "Failed to add menu."
            });
        } finally {
            if (db) {
                await db.close();
            }
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "An unexpected error occurred",
            error: error.message
        });
    }
};

export const addSecondMenu = async (req, res) => {
    try {
        const { name, sellingPrice } = req.body;
        let ingredients = [];

        try {
            ingredients = JSON.parse(req.body.ingredients || "[]");
        } catch (error) {
            return res.status(400).json({ success: false, message: "Invalid ingredients format." });
        }

        const canteenId = 2;
        const picture = req.file ? `/uploads/${req.file.filename}` : null;

        if (!name || !picture || !sellingPrice || ingredients.length === 0) {
            return res.status(400).json({
                success: false,
                message: "All fields are required, including at least one ingredient."
            });
        }

        let db;
        try {
            db = await connectDB();

            const result = await db.run(
                "INSERT INTO menu (name, picture, sellingPrice, canteenId) VALUES (?, ?, ?, ?)",
                [name, picture, sellingPrice, canteenId]
            );

            const menuId = result.lastID;

            const ingredientInsertPromises = ingredients.map(({ ingredient, quantity, cost }) => {
                return db.run(
                    "INSERT INTO ingredients (menuId, ingredient, quantity, cost) VALUES (?, ?, ?, ?)",
                    [menuId, ingredient, quantity, cost]
                );
            });

            await Promise.all(ingredientInsertPromises);

            res.status(201).json({
                success: true,
                message: "Menu added successfully!",
                menuId: menuId
            });

        } catch (error) {
            console.error("Error adding menu:", error);
            res.status(500).json({
                success: false,
                message: "Failed to add menu."
            });
        } finally {
            if (db) {
                await db.close();
            }
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "An unexpected error occurred",
            error: error.message
        });
    }
};

export const addInventory = async (req, res) => {
    const { productName, quantity, unit } = req.body;
    const { stallId } = req.params; 

    if (!productName || !quantity || !unit || !stallId) {
        return res.status(400).json({
            success: false,
            message: "All fields are required, including stallId from URL"
        });
    }

    let db;
    try {
        db = await connectDB();

        const dateAdded = new Date().toISOString().split("T")[0]; 

        const product = await db.run(
            "INSERT INTO inventory (productName, quantity, unit, dateAdded, stallId) VALUES (?, ?, ?, ?, ?)", 
            [productName, quantity, unit, dateAdded, stallId]
        );

        res.status(201).json({
            success: true,
            message: "Inventory added successfully!",
            inventory: {
                inventoryId: product.lastID,
                productName,
                quantity,
                unit,
                dateAdded,
                stallId
            }
        });
    } catch (error) {
        console.error("Error adding inventory:", error);
        res.status(500).json({
            success: false,
            message: "Failed to add inventory"
        });
    } finally {
        if (db) {
            await db.close(); 
        }
    }
};

export const addSales = async (req, res) => {
    const { salesDate, canteenId, stallId, productId, quantitySold, totalPrice, profit } = req.body;

    let db;
    try {
        if (!salesDate || !canteenId || !stallId || !productId || !quantitySold || !totalPrice || !profit) {
            throw new Error("All required fields must be filled");
        }

        db = await connectDB();

        const sales = await db.run(
            `INSERT INTO sales (salesDate, canteenId, stallId, productId, quantitySold, totalPrice, profit) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [salesDate, canteenId, stallId, productId, quantitySold, totalPrice, profit]
        );

        await db.run(
            `UPDATE inventory SET quantity = quantity - ? WHERE productId = ?`,
            [quantitySold, productId]
        );

        res.status(201).json({
            success: true,
            message: "Sales record added successfully!",
            sales: {
                saleId: sales.lastID,
                salesDate,
                canteenId,
                stallId,
                productId,
                quantitySold,
                totalPrice,
                profit
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    } finally {
        if (db) {
            await db.close();
        }
    }
};


export const getProduct = async (req, res) => {
    const { productId } = req.params;

    let db;
    try {
        db = await connectDB();

        const product = await db.get(
            `SELECT productId, productName, price, quantity, unit, MOP, date, stallId 
             FROM products 
             WHERE productId = ?`,
            [productId]
        );

        console.log("Fetched Product Data from DB:", product);

        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        res.json({ success: true, product });
    } catch (error) {
        console.error("Error fetching product:", error);
        res.status(500).json({ success: false, message: "Database query failed" });
    } finally {
        if (db) {
            await db.close();
        }
    }
};


export const addStallA = async (req, res) => {
    const { stallName, category } = req.body;
    const canteenId = 1; 

    let db;
    try {
        if (!stallName || !category) {
            throw new Error("All fields are required");
        }

        db = await connectDB();

        const result = await db.run(
            'INSERT INTO stalls (stallName, category, canteenId) VALUES (?, ?, ?)',
            [stallName, category, canteenId]
        );

        res.status(201).json({
            success: true,
            message: "Stall added successfully!",
            stall: {
                stallId: result.lastID,  
                stallName,
                category,
                canteenId  
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    } finally {
        if (db) {
            await db.close(); 
        }
    }
};

export const addStallB = async (req, res) => {
    const { stallName, category } = req.body;
    const canteenId = 2;  

    let db;
    try {
        if (!stallName || !category) {
            throw new Error("All fields are required");
        }

        db = await connectDB();

        const result = await db.run(
            'INSERT INTO stalls (stallName, category, canteenId) VALUES (?, ?, ?)',
            [stallName, category, canteenId]
        );

        res.status(201).json({
            success: true,
            message: "Stall added successfully!",
            stall: {
                stallId: result.lastID,  
                stallName,
                category,
                canteenId  
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    } finally {
        if (db) {
            await db.close(); 
        }
    }
};

export const deleteSchedule = async (req, res) => {
    const { scheduleId } = req.params;

    let db;
    try {
        db = await connectDB();

        const schedule = await db.get('SELECT * FROM schedule WHERE scheduleId = ?', [scheduleId]);

        if (!schedule) {
            return res.status(404).json({
                success: false,
                message: "Schedule not found"
            });
        }

        await db.run('DELETE FROM schedule WHERE scheduleId = ?', [scheduleId]);

        res.status(200).json({
            success: true,
            message: "Schedule deleted successfully!"
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "An error occurred while deleting the schedule",
            error: error.message
        });
    }
};

export const deleteMenu = async (req, res) => {
    const { menuId } = req.params;

    let db;
    try {
        db = await connectDB();

        const menu = await db.get('SELECT * FROM menu WHERE menuId = ?', [menuId]);

        if (!menu) {
            return res.status(404).json({
                success: false,
                message: "Menu not found"
            });
        }

        await db.run('DELETE FROM menu WHERE menuId = ?', [menuId]);

        res.status(200).json({
            success: true,
            message: "Menu deleted successfully!"
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "An error occurred while deleting the menu",
            error: error.message
        });
    }
};

export const deletePurchase = async (req, res) => {
    const { productId } = req.params;

    let db;
    try {
        db = await connectDB();
        await db.run("BEGIN TRANSACTION"); 

        const product = await db.get('SELECT * FROM products WHERE productId = ?', [productId]);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Purchase not found"
            });
        }

        const inventory = await db.get(
            "SELECT * FROM inventory WHERE productId = (SELECT productId FROM products WHERE productName = ? AND stallId = ? LIMIT 1)",
            [product.productName, product.stallId]
        );

        if (inventory) {
            const updatedQuantity = inventory.quantity - product.quantity;

            if (updatedQuantity > 0) {
                await db.run(
                    "UPDATE inventory SET quantity = ? WHERE productId = ? AND stallId = ?",
                    [updatedQuantity, inventory.productId, product.stallId]
                );
            } else {
                await db.run(
                    "DELETE FROM inventory WHERE productId = ? AND stallId = ?",
                    [inventory.productId, product.stallId]
                );
            }
        }

        await db.run('DELETE FROM products WHERE productId = ?', [productId]);

        await db.run("COMMIT"); 

        res.status(200).json({
            success: true,
            message: "Purchase deleted successfully, and inventory updated!"
        });
    } catch (error) {
        await db.run("ROLLBACK"); 
        res.status(500).json({
            success: false,
            message: "An error occurred while deleting the purchase",
            error: error.message
        });
    } finally {
        if (db) {
            await db.close();
        }
    }
};


export const deleteSales = async (req, res) => {
    const { saleId } = req.params;

    let db;
    try {
        db = await connectDB();

        const sales = await db.get('SELECT * FROM sales WHERE saleId = ?', [saleId]);

        if (!sales) {
            return res.status(404).json({
                success: false,
                message: "Sales report not found"
            });
        }

        await db.run('DELETE FROM sales WHERE saleId = ?', [saleId]);

        res.status(200).json({
            success: true,
            message: "Sales report deleted successfully!"
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "An error occurred while deleting the sales report",
            error: error.message
        })
    }
}

export const deleteStall = async (req, res) => {
    const { stallId } = req.params;

    let db;
    try {
        db = await connectDB();

        const stall = await db.get('SELECT * FROM stalls WHERE stallId = ?', [stallId]);

        if (!stall) {
            return res.status(404).json({
                success: false,
                message: "Stall not found"
            });
        }

        const inventoryItems = await db.get('SELECT * FROM inventory WHERE stallId = ?', [stallId]);

        if (inventoryItems) {
            return res.status(400).json({
                success: false,
                message: "Cannot delete stall. Please delete the associated inventory items first.",
            });
        }

        // if no inventory items found
        await db.run('DELETE FROM stalls WHERE stallId = ?', [stallId]);

        res.status(200).json({
            success: true,
            message: "Stall deleted successfully!"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "An error occurred while deleting the stall",
            error: error.message,
        });
    } finally {
        if (db) {
            await db.close(); 
        }
    }
}

export const deleteInventory = async (req, res) => {
    const { inventoryId } = req.params;

    let db;
    try {
        db = await connectDB();
        
        const inventory = await db.get('SELECT * FROM inventory WHERE inventoryId =?', [inventoryId]);

        if (!inventory) {
            return res.status(404).json({
                success: false,
                message: "Inventory item not found"
            });
        }

        await db.run('DELETE FROM inventory WHERE inventoryId =?', [inventoryId]);

        res.status(200).json({
            success: true,
            message: "Inventory item deleted successfully!"
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "An error occurred while deleting the inventory item",
            error: error.message
        });
    } finally {
        if (db) {
            await db.close(); 
        }
    }
}

export const viewMenu = async (req, res) => {
    let db;
    try {
        db = await connectDB();
        const baseUrl = "http://localhost:3000";  

        const menuWithIngredients = await db.all(`
            SELECT m.menuId, m.name, m.picture, m.sellingPrice, 
                   i.ingredientId, i.ingredient, i.quantity, i.cost
            FROM menu m
            LEFT JOIN ingredients i ON m.menuId = i.menuId
            WHERE m.canteenId = 1
        `);

        const menuMap = {};
        menuWithIngredients.forEach(row => {
            if (!menuMap[row.menuId]) {
                menuMap[row.menuId] = {
                    menuId: row.menuId,
                    name: row.name,
                    picture: row.picture ? `${baseUrl}${row.picture}` : null, 
                    sellingPrice: row.sellingPrice,
                    ingredients: []
                };
            }
            if (row.ingredientId) { 
                menuMap[row.menuId].ingredients.push({
                    ingredientId: row.ingredientId,
                    ingredient: row.ingredient,
                    quantity: row.quantity,
                    cost: row.cost
                });
            }
        });

        res.status(200).json({
            success: true,
            message: "Menu retrieved successfully!",
            menu: Object.values(menuMap)
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "An error occurred while retrieving the menu",
            error: error.message
        });
    } finally {
        if (db) {
            await db.close(); 
        }
    }
};

export const viewSecondMenu = async (req, res) => {
    let db;
    try {
        db = await connectDB();
        const baseUrl = "http://localhost:3000";  

        const menuWithIngredients = await db.all(`
            SELECT m.menuId, m.name, m.picture, m.sellingPrice, 
                   i.ingredientId, i.ingredient, i.quantity, i.cost
            FROM menu m
            LEFT JOIN ingredients i ON m.menuId = i.menuId
            WHERE m.canteenId = 2
        `);

        const menuMap = {};
        menuWithIngredients.forEach(row => {
            if (!menuMap[row.menuId]) {
                menuMap[row.menuId] = {
                    menuId: row.menuId,
                    name: row.name,
                    picture: row.picture ? `${baseUrl}${row.picture}` : null, 
                    sellingPrice: row.sellingPrice,
                    ingredients: []
                };
            }
            if (row.ingredientId) { 
                menuMap[row.menuId].ingredients.push({
                    ingredientId: row.ingredientId,
                    ingredient: row.ingredient,
                    quantity: row.quantity,
                    cost: row.cost
                });
            }
        });

        res.status(200).json({
            success: true,
            message: "Menu retrieved successfully",
            menu: Object.values(menuMap)
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "An error occurred while retrieving the menu",
            error: error.message
        });
    } finally {
        if (db) {
            await db.close(); 
        }
    }
};

export const viewSchedule = async (req, res) => {
    let db;
    try {
        db = await connectDB();

        const schedule = await db.all('SELECT * FROM schedule');

        res.status(200).json({
            success: true,
            message: "Schedule retrieved successfully",
            schedule
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "An error occurred while retrieving the schedule",
            error: error.message
        });
    } finally {
        if (db) {
            await db.close();
        }
    }
};

export const viewPurchases = async (req, res) => {
    let db;
    try {
        db = await connectDB();

        const products = await db.all('SELECT * FROM products');

        res.status(200).json({
            success: true,
            message: "Purchases retrieved successfully",
            purchases: products  
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "An error occurred while retrieving the purchases",
            error: error.message
        });
    } finally {
        if (db) {
            await db.close(); 
        }
    }
};

export const viewProducts = async (req, res) => {
    let db;
    const { stallId } = req.query; 

    try {
        db = await connectDB();

        const query = `
            SELECT productId, productName, price 
            FROM products 
            WHERE stallId = ?;
        `;

        const products = await db.all(query, [stallId]);

        if (products.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No products available for this stall",
                products: [],
            });
        }

        res.status(200).json({
            success: true,
            message: "Products retrieved successfully",
            products,  
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "An error occurred while retrieving the products",
            error: error.message,
        });
    } finally {
        if (db) {
            await db.close(); 
        }
    }
};

export const viewInventory = async (req, res) => {
    const { stallId } = req.params; 

    let db;
    try {
        db = await connectDB();

        const inventories = await db.all('SELECT * FROM inventory WHERE stallId =?', [stallId]);

        res.status(200).json({
            success: true,
            message: "Inventory retrieved successfully",
            inventory: inventories
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "An error occurred while retrieving the inventory",
            error: error.message
        })
    } finally {
        if (db) {
            await db.close(); 
        }
    }
}

export const viewStallsA = async (req, res) => {
    try {
        const db = await connectDB();

        const stalls = await db.all('SELECT * FROM stalls WHERE canteenId = 1');

        await db.close();

        res.status(200).json({
            success: true,
            message: "Stalls retrieved successfully",
            stalls: stalls  
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "An error occurred while retrieving the stalls",
            error: error.message
        });
    }
};

export const viewStallsB = async (req, res) => {
    try {
        const db = await connectDB();

        const stalls = await db.all('SELECT * FROM stalls WHERE canteenId = 2');

        await db.close();

        res.status(200).json({
            success: true,
            message: "Stalls retrieved successfully",
            stalls: stalls  
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "An error occurred while retrieving the stalls",
            error: error.message
        });
    }
};

export const viewSales = async (req, res) => {
    let db;
    try {
        db = await connectDB();

        const sales = await db.all('SELECT * FROM sales');

        for (let sale of sales) {
            const canteen = await db.get('SELECT canteenName FROM canteens WHERE canteenId = ?', [sale.canteenId]);
            sale.canteenName = canteen ? canteen.canteenName : "N/A";

            const stall = await db.get('SELECT stallName FROM stalls WHERE stallId = ?', [sale.stallId]);
            sale.stallName = stall ? stall.stallName : "N/A";

            const product = await db.get('SELECT productName FROM products WHERE productId = ?', [sale.productId]);
            sale.productName = product ? product.productName : "N/A";
        }

        res.status(200).json({
            success: true,
            message: "Sales retrieved successfully",
            sales: sales
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "An error occurred while retrieving the sales",
            error: error.message
        });
    }
};



export const searchPurchases = async (req, res, next) => {
    let db;
    try {
        const searchTerm = req.query.q?.trim() || "";
        console.log("Search Term:", searchTerm);

        db = await connectDB();

        let purchases;

        if (searchTerm) {
            purchases = await db.all(
                `SELECT * FROM products 
                 WHERE LOWER(productName) LIKE LOWER(?) 
                 OR LOWER(MOP) LIKE LOWER(?) 
                 OR date LIKE ?`,
                [`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`]
            );
        } else {
            purchases = await db.all(`SELECT * FROM products`);
        }

        return res.json({ success: true, purchases });

    } catch (error) {
        console.error("Error executing search query:", error);
        return res.status(500).json({ success: false, message: "Database query failed" });
    } finally {
        if (db) {
            await db.close();
        }
    }
};

export const searchInventory = async (req, res, next) => {
    let db;

    try {
        const searchTerm = req.query.q?.trim() || "";
        const stallId = req.query.stallId;

        console.log("Search Term:", searchTerm);
        console.log("Stall ID:", stallId);

        if (!stallId) {
            return res.status(400).json({ success: false, message: "Stall ID is required in query parameters" });
        }

        db = await connectDB();

        const inventories = await db.all(
            `SELECT i.inventoryId, i.productId, p.productName, i.quantity, i.unit, i.stallId, i.dateAdded
            FROM inventory i
            JOIN products p ON i.productId = p.productId
            WHERE i.stallId = ?
            AND (LOWER(p.productName) LIKE LOWER(?) OR LOWER(i.unit) LIKE LOWER(?))`,
            [stallId, `%${searchTerm}%`, `%${searchTerm}%`]
        );

        return res.json({ success: true, inventories });
    } catch (error) {
        console.error("Error executing inventory query:", error);
        return res.status(500).json({ success: false, message: "Database query failed" });
    } finally {
        if (db) {
            await db.close();
        }
    }
};


export const updateMenu = async (req, res) => {
    const { menuId } = req.params;
    const { name, sellingPrice, ingredients } = req.body;
    let db;

    try {
        db = await connectDB();

        await db.run(
            'UPDATE menu SET name = ?, sellingPrice = ? WHERE menuId = ?',
            [name, sellingPrice, menuId]
        );

        await db.run('DELETE FROM ingredients WHERE menuId = ?', [menuId]);

        if (ingredients) {
            const parsedIngredients = JSON.parse(ingredients);

            for (const ing of parsedIngredients) {
                await db.run(
                    'INSERT INTO ingredients (menuId, ingredient, quantity, cost) VALUES (?, ?, ?, ?)',
                    [menuId, ing.ingredient, ing.quantity, ing.cost]
                );
            }
        }

        res.status(200).json({ success: true, message: "Menu updated successfully!" });

    } catch (error) {
        console.error("Error updating menu:", error);
        res.status(500).json({ success: false, message: "An error occurred while updating the menu", error: error.message });
    }
};

export const updateSchedule = async (req, res) => {
    const { scheduleId } = req.params;
    const { eventName, eventDate, eventDescription } = req.body;

    let db;
    try {
        if (!eventName || !eventDate) {
            throw new Error("Event name and date are required");
        }

        db = await connectDB();

        const schedule = await db.run(
            `UPDATE schedule
            SET eventName = ?, eventDate = ?, eventDescription = ?
            WHERE scheduleId = ?`,
            [eventName, eventDate, eventDescription, scheduleId]
        );

        if (schedule.changes === 0) {
            return res.status(404).json({
                success: false,
                message: "Schedule not found or no changes made."
            });
        }

        res.status(200).json({
            success: true,
            message: "Schedule updated successfully!",
            updatedSchedule: {
                scheduleId,
                eventName,
                eventDate,
                eventDescription
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Invalid event date",
            error: error.message
        });
    } finally {
        if (db) {
            await db.close();
        }
    }
};

export const updateSales = async (req, res) => {
    const { saleId } = req.params;
    const { salesDate, canteenId, stallId, productId, quantitySold, profit, totalPrice } = req.body;

    let db;
    try {
        if (!salesDate || !canteenId || !stallId || !productId || quantitySold === undefined || !profit) {
            throw new Error("All fields are required");
        }

        db = await connectDB();

        const existingSale = await db.get(
            "SELECT productId, quantitySold FROM sales WHERE saleId = ?",
            [saleId]
        );

        if (!existingSale) {
            return res.status(404).json({
                success: false,
                message: "Sale report not found."
            });
        }

        const oldProductId = existingSale.productId;
        const oldQuantitySold = existingSale.quantitySold;

        if (oldProductId !== productId) {
            const oldInventory = await db.get(
                "SELECT quantity FROM inventory WHERE productId = ?",
                [oldProductId]
            );

            if (oldInventory) {
                let restoredQuantity = oldInventory.quantity + oldQuantitySold;
                await db.run(
                    "UPDATE inventory SET quantity = ? WHERE productId = ?",
                    [restoredQuantity, oldProductId]
                );
            }
        }

        const result = await db.run(
            `UPDATE sales 
             SET salesDate = ?, canteenId = ?, stallId = ?, productId = ?, quantitySold = ?, profit = ?, totalPrice = ?
             WHERE saleId = ?`,
            [salesDate, canteenId, stallId, productId, quantitySold, profit, totalPrice, saleId]
        );

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: "Sale report not found or no changes made."
            });
        }

        const newInventoryRecord = await db.get(
            "SELECT quantity FROM inventory WHERE productId = ?",
            [productId]
        );

        if (!newInventoryRecord) {
            return res.status(404).json({
                success: false,
                message: "Inventory record not found for this product."
            });
        }

        let newInventoryQuantity = newInventoryRecord.quantity - quantitySold;

        await db.run(
            "UPDATE inventory SET quantity = ? WHERE productId = ?",
            [newInventoryQuantity, productId]
        );

        res.status(200).json({
            success: true,
            message: "Sale report and inventory updated successfully!",
            updatedSale: {
                saleId,
                salesDate,
                profit,
                totalPrice,
                canteenId,
                stallId,
                productId,
                quantitySold
            },
            updatedInventory: {
                productId,
                newQuantity: newInventoryQuantity
            }
        });

    } catch (error) {
        res.status(400).json({
            success: false,
            message: "Invalid request payload",
            error: error.message
        });
    } finally {
        if (db) {
            await db.close();
        }
    }
};

export const updateInventory = async (req, res) => {
    const { inventoryId } = req.params;
    const { productName, quantity, unit } = req.body;
    const dateAdded = new Date().toISOString().split("T")[0]; 

    let db;
    try {
        if (!inventoryId || !productName || !quantity || !unit) {
            return res.status(400).json({
                success: false,
                message: "All fields (inventoryId, productName, quantity, unit) are required."
            });
        }

        db = await connectDB();
        await db.run("BEGIN TRANSACTION"); 

        const inventory = await db.get(
            "SELECT productId FROM inventory WHERE inventoryId = ?",
            [inventoryId]
        );

        if (!inventory) {
            return res.status(404).json({
                success: false,
                message: "Inventory not found."
            });
        }

        const { productId } = inventory;

        await db.run(
            "UPDATE products SET productName = ? WHERE productId = ?",
            [productName, productId]
        );

        const result = await db.run(
            `UPDATE inventory 
             SET quantity = ?, unit = ?, dateAdded = ? 
             WHERE inventoryId = ?`,
            [quantity, unit, dateAdded, inventoryId]
        );

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: "Inventory not found or no changes made."
            });
        }

        await db.run("COMMIT"); 

        res.json({
            success: true,
            message: "Inventory updated successfully!",
            updatedInventory: {
                inventoryId,
                productName,
                quantity,
                unit,
                dateAdded
            }
        });
    } catch (error) {
        await db.run("ROLLBACK"); 
        console.error("Error updating inventory:", error);
        res.status(500).json({
            success: false,
            message: "Database update failed",
            error: error.message
        });
    } finally {
        if (db) {
            await db.close(); 
        }
    }
};


export const getMenu = async (req, res) => {
    const { menuId } = req.params;

    let db;
    try {
        db = await connectDB();

        const menu = await db.get(
            "SELECT * FROM menu WHERE menuId = ?",
            [menuId]
        );

        if (!menu) {
            return res.status(404).json({ 
                success: false, 
                message: "Menu not found" 
            });
        }

        const ingredients = await db.all(
            "SELECT * FROM ingredients WHERE menuId = ?",
            [menuId]
        );

        res.status(200).json({ 
            success: true, 
            menu, 
            ingredients 
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "An error occurred while fetching the menu",
            error: error.message
        });
    } finally {
        if (db) {
            await db.close();  
        }
    }
};

export const getSchedules = async (req, res) => {
    const { scheduleId } = req.params;

    let db;
    try {
        db = await connectDB();
        const schedule = await db.get(
            "SELECT * FROM schedule WHERE scheduleId = ?",
            [scheduleId]
        );

        if (!schedule) {
            return res.status(404).json({ success: false, message: "Schedule not found" });
        }

        res.json({ success: true, schedule });
    } catch (error) {
        console.error("Error fetching schedule:", error);
        res.status(500).json({ success: false, message: "Database query failed" });
    } finally {
        if (db) {
            await db.close();  
        }
    }
};

export const getInventory = async (req, res) => {
    const { inventoryId } = req.params;

    let db;
    try {
        db = await connectDB();
        
        const inventory = await db.get(
            `SELECT inventory.*, products.productName 
             FROM inventory 
             JOIN products ON inventory.productId = products.productId 
             WHERE inventory.inventoryId = ?`,
            [inventoryId]
        );

        console.log("Fetched Inventory Data from DB:", inventory); 

        if (!inventory) {
            return res.status(404).json({ success: false, message: "Inventory not found" });
        }

        res.json({ success: true, inventory });
    } catch (error) {
        console.error("Error fetching inventory:", error);
        res.status(500).json({ success: false, message: "Database query failed" });
    } finally {
        if (db) {
            await db.close(); 
        }
    }
};

export const getSales = async (req, res) => {
    const { saleId } = req.params;

    let db;
    try {
        db = await connectDB();

        const sale = await db.get(
            "SELECT * FROM sales WHERE saleId = ?",
            [saleId]
        );

        if (!sale) {
            return res.status(404).json({ success: false, message: "Sale report not found" });
        }

        const stall = await db.get(
            "SELECT stallName FROM stalls WHERE stallId = ?",
            [sale.stallId]
        );

        const product = await db.get(
            "SELECT productName FROM products WHERE productId = ?",
            [sale.productId]
        );

        res.json({
            success: true,
            sale: {
                ...sale,
                stallName: stall ? stall.stallName : null,
                productName: product ? product.productName : null
            }
        });

    } catch (error) {
        console.error("Error fetching sale report:", error);
        res.status(500).json({ success: false, message: "Database query failed" });
    } finally {
        if (db) {
            await db.close();
        }
    }
};

export const filterSales = async (req, res) => {
    const { startDate, endDate } = req.body;
    console.log("Received filter request:", { startDate, endDate });

    let db;
    try {
        db = await connectDB();

        let query = "SELECT * FROM sales WHERE DATE(salesDate) >= DATE(?) AND DATE(salesDate) <= DATE(?)";
        const params = [startDate, endDate];

        console.log("🛠 SQL Query:", query, params);
        const sales = await db.all(query, params);

        for (let sale of sales) {
            const canteen = await db.get("SELECT canteenName FROM canteens WHERE canteenId = ?", [sale.canteenId]);
            sale.canteenName = canteen ? canteen.canteenName : "N/A";

            const stall = await db.get("SELECT stallName FROM stalls WHERE stallId = ?", [sale.stallId]);
            sale.stallName = stall ? stall.stallName : "N/A";
        }

        console.log("Filtered sales with names:", sales);

        res.json({
            sales,
            noSales: sales.length === 0,
            noSalesOverall: sales.length === 0 && !startDate && !endDate,
        });
    } catch (error) {
        console.error("Database error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    } finally {
        if (db) {
            await db.close();
            console.log("Database connection closed");
        }
    }
};

export const viewStalls = async (req, res) => {
    const { canteenId } = req.query;

    if (!canteenId) {
        return res.status(400).json({ success: false, message: "canteenId is required" });
    }

    let db;
    try {
        db = await connectDB();
        const stalls = await db.all("SELECT * FROM stalls WHERE canteenId = ?", [canteenId]);

        res.status(200).json({ success: true, stalls });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error retrieving stalls", error: error.message });
    } finally {
        if (db) await db.close();
    }
};

export const exportSalesCSV = async (req, res) => {
    try {
        const { period } = req.params;
        const db = await connectDB();

        let query = `
            SELECT c.canteenName, s.stallName, p.productName, sa.salesDate, sa.quantitySold, sa.totalPrice, (sa.quantitySold * p.price) AS totalCost
            FROM sales sa
            JOIN stalls s ON sa.stallId = s.stallId
            JOIN canteens c ON sa.canteenId = c.canteenId
            JOIN products p ON sa.productId = p.productId
        `;

        if (period === "daily") {
            query += " WHERE sa.salesDate = date('now')";
        } else if (period === "weekly") {
            query += " WHERE sa.salesDate >= date('now', '-7 days')";
        } else if (period === "monthly") {
            query += " WHERE sa.salesDate >= date('now', '-30 days')";
        } else {
            return res.status(400).json({ error: "Invalid period. Use 'daily', 'weekly', or 'monthly'." });
        }

        query += " ORDER BY sa.salesDate DESC"; 

        const salesData = await db.all(query);

        if (salesData.length === 0) {
            return res.status(404).json({ error: "No sales data available for the selected period." });
        }

        const totalCost = salesData.reduce((sum, row) => sum + row.totalCost, 0);
        const totalCash = salesData.reduce((sum, row) => sum + row.totalPrice, 0);
        const totalProfit = totalCash - totalCost;

        salesData.push({
            canteenName: "TOTAL",
            stallName: "",
            productName: "",
            salesDate: "",
            quantitySold: "",
            totalPrice: `**${totalCash.toFixed(2)}**`, 
            totalCost: `**${totalCost.toFixed(2)}**`, 
            totalProfit: `**${totalProfit.toFixed(2)}**` 
        });

        const fields = ["canteenName", "stallName", "productName", "salesDate", "quantitySold", "totalPrice", "totalCost", "totalProfit"];
        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(salesData);

        res.header("Content-Type", "text/csv");
        res.attachment(`sales_${period}.csv`);
        res.send(csv);
    } catch (error) {
        console.error("Error exporting sales data:", error);
        res.status(500).json({ error: "Error exporting sales data" });
    }
};

export const exportSalesPDF = async (req, res) => {
    try {
        const { period } = req.params;
        const db = await connectDB();

        let query = `
            SELECT c.canteenName, s.stallName, p.productName, sa.salesDate, sa.quantitySold, sa.totalPrice, (sa.quantitySold * p.price) AS totalCost
            FROM sales sa
            JOIN stalls s ON sa.stallId = s.stallId
            JOIN canteens c ON sa.canteenId = c.canteenId
            JOIN products p ON sa.productId = p.productId
        `;

        if (period === "daily") {
            query += " WHERE sa.salesDate = date('now')";
        } else if (period === "weekly") {
            query += " WHERE sa.salesDate >= date('now', '-7 days')";
        } else if (period === "monthly") {
            query += " WHERE sa.salesDate >= date('now', '-30 days')";
        } else {
            return res.status(400).json({ error: "Invalid period. Use 'daily', 'weekly', or 'monthly'." });
        }

        query += " ORDER BY sa.salesDate DESC"; 

        const salesData = await db.all(query);

        if (salesData.length === 0) {
            return res.status(404).json({ error: "No sales data available for the selected period." });
        }

        const exportDir = path.join(process.cwd(), "exports");
        if (!fs.existsSync(exportDir)) {
            fs.mkdirSync(exportDir, { recursive: true });
        }

        const fileName = `sales_${period}.pdf`;
        const filePath = path.join(exportDir, fileName);
        const doc = new PDFDocument();
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        doc.fontSize(18).text(`Sales Report (${period})`, { align: "center" }).moveDown(2);

        doc.fontSize(12).text("Canteen", 40, 100, { bold: true });
        doc.text("Stall", 130, 100, { bold: true });
        doc.text("Item", 220, 100, { bold: true });
        doc.text("Sales Date", 310, 100, { bold: true });
        doc.text("Qty Sold", 400, 100, { bold: true });
        doc.text("Total Price", 470, 100, { bold: true });

        let y = 120;
        let totalCost = 0;
        let totalCash = 0;

        salesData.forEach((sale) => {
            doc.text(sale.canteenName, 40, y);
            doc.text(sale.stallName, 130, y);
            doc.text(sale.productName, 220, y);
            doc.text(sale.salesDate, 310, y);
            doc.text(sale.quantitySold.toString(), 400, y);
            doc.text(`₱${sale.totalPrice.toFixed(2)}`, 470, y);

            totalCost += sale.totalCost;
            totalCash += sale.totalPrice;
            y += 20;
        });

        const totalProfit = totalCash - totalCost;

        doc.moveTo(40, y).lineTo(550, y).stroke();
        y += 10;

        doc.fontSize(12).font("Helvetica-Bold");
        doc.text("TOTAL", 40, y);
        doc.text("", 130, y); 
        doc.text("", 220, y);
        doc.text("", 310, y);
        doc.text("", 400, y);
        doc.text(`₱${totalCash.toFixed(2)}`, 470, y);
        y += 20;
        doc.text(`Total Cost: ₱${totalCost.toFixed(2)}`, 40, y);
        doc.text(`Total Profit: ₱${totalProfit.toFixed(2)}`, 40, y + 20);

        doc.end();

        stream.on("finish", () => {
            res.download(filePath, fileName, (err) => {
                if (err) {
                    console.error("Error sending PDF:", err);
                    res.status(500).json({ error: "Error exporting sales data to PDF" });
                } else {
                    fs.unlinkSync(filePath); 
                }
            });
        });

    } catch (error) {
        console.error("Error exporting sales data to PDF:", error);
        res.status(500).json({ error: "Error exporting sales data to PDF" });
    }
};
