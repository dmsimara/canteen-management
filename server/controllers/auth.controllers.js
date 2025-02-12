import { generateTokenAndSetCookie } from '../utils/generateTokenAndCookies.js';
import { connectDB } from '../db/connectDB.js';
import bcryptjs from 'bcryptjs';

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

        generateTokenAndSetCookie(res, admin.lastID); 

        res.status(201).json({
            success: true,
            message: "Admin registered successfully",
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
            message: "Staff registered successfully",
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

        generateTokenAndSetCookie(res, admin.adminId);

        await db.run('UPDATE users SET lastLogin = ? WHERE adminId = ?', [new Date().toISOString(), admin.adminId]);

        res.status(200).json({
            success: true,
            message: "Admin logged in successfully",
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
            message: "Staff logged in successfully",
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
    res.clearCookie("token");
    res.status(200).json({
        success: true,
        message: "Admin logged out successfully"
    });
};

export const staffLogout = async (req, res) => {
    res.clearCookie("staffToken");
    res.status(200).json({
        success: true,
        message: "Staff logged out successfully"
    });
};

export const addPurchase = async (req, res) => {
    const { productName, price, quantity, MOP, date } = req.body;

    if (!productName || !price || !quantity || !MOP || !date) {
        return res.status(400).json({
            success: false,
            message: "All fields are required"
        });
    }

    let db;
    try {
        db = await connectDB();

        const product = await db.run(
            "INSERT INTO products (productName, price, quantity, MOP, date) VALUES (?, ?, ?, ?, ?)", 
            [productName, price, quantity, MOP, date]
        );

        res.status(201).json({
            success: true,
            message: "Purchase added successfully",
            purchase: {
                productId: product.lastID,
                productName,
                price,
                quantity,
                MOP,
                date
            }
        });
    } catch (error) {
        console.error("Error adding purchase:", error);
        res.status(500).json({
            success: false,
            message: "Failed to add purchase"
        });
    } finally {
        if (db) {
            await db.close(); 
        }
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
            message: "Inventory added successfully",
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
            message: "Stall added successfully",
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
            message: "Stall added successfully",
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

export const deletePurchase = async (req, res) => {
    const { productId } = req.params;

    let db;
    try {
        db = await connectDB();

        const product = await db.get('SELECT * FROM products WHERE productId = ?', [productId]);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        await db.run('DELETE FROM products WHERE productId = ?', [productId]);

        res.status(200).json({
            success: true,
            message: "Purchase deleted successfully"
        });
    } catch (error) {
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
            message: "Stall deleted successfully"
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
            message: "Inventory item deleted successfully"
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
            `SELECT * FROM inventory 
            WHERE stallId = ? 
            AND (LOWER(productName) LIKE LOWER(?) 
            OR LOWER(unit) LIKE LOWER(?))`,
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

        const result = await db.run(
            `UPDATE inventory 
             SET productName = ?, quantity = ?, unit = ?, dateAdded = ? 
             WHERE inventoryId = ?`,
            [productName, quantity, unit, dateAdded, inventoryId]
        );

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: "Inventory not found or no changes made."
            });
        }

        res.json({
            success: true,
            message: "Inventory updated successfully",
            updatedInventory: {
                inventoryId,
                productName,
                quantity,
                unit,
                dateAdded
            }
        });
    } catch (error) {
        console.error("Error updating inventory:", error);
        res.status(500).json({
            success: false,
            message: "Database update failed"
        });
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
            "SELECT * FROM inventory WHERE inventoryId = ?",
            [inventoryId]
        );

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
