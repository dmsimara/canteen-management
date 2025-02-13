import { generateTokenAndSetCookie } from '../utils/generateTokenAndCookies.js';
import { connectDB } from '../db/connectDB.js';
import { Parser } from "json2csv";
import bcryptjs from 'bcryptjs';
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

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

export const addSales = async (req, res) => {
    const { salesDate, canteenId, stallId, cost, cash } = req.body;

    let db;
    try {
        if (!salesDate || !canteenId || !stallId || !cost || !cash) {
            throw new Error("All fields are required");
        }

        db = await connectDB();

        const profit = cash - cost; 

        const sales = await db.run(
            'INSERT INTO sales (salesDate, canteenId, stallId, cost, cash, profit) VALUES (?,?,?,?,?,?)',
            [salesDate, canteenId, stallId, cost, cash, profit]
        );

        res.status(201).json({
            success: true,
            message: "Sales added successfully",
            sales: {
                reportId: sales.lastID,
                salesDate,
                canteenId,
                stallId,
                cost,
                cash,
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

export const deleteSales = async (req, res) => {
    const { reportId } = req.params;

    let db;
    try {
        db = await connectDB();

        const sales = await db.get('SELECT * FROM sales WHERE reportId = ?', [reportId]);

        if (!sales) {
            return res.status(404).json({
                success: false,
                message: "Sales report not found"
            });
        }

        await db.run('DELETE FROM sales WHERE reportId = ?', [reportId]);

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

export const viewSales = async (req, res) => {
    let db;
    try {
        db = await connectDB();

        const sales = await db.all('SELECT * FROM sales');

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
}

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

export const updateSales = async (req, res) => {
    const { reportId } = req.params;
    const { salesDate, cash, cost, canteenId, stallId } = req.body;

    let db;
    try {
        if (!salesDate || !cash || !canteenId || !stallId || !cost) {
            throw new Error("All fields are required");
        }

        let profit = cash - cost;  

        db = await connectDB();

        const result = await db.run(
            `UPDATE sales 
             SET salesDate = ?, cash = ?, cost = ?, canteenId = ?, stallId = ?, profit = ? 
             WHERE reportId = ?`,
            [salesDate, cash, cost, canteenId, stallId, profit, reportId]
        );

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: "Sale report not found or no changes made."
            });
        }

        res.status(200).json({
            success: true,
            message: "Sale report updated successfully",
            updatedSale: {
                reportId,
                salesDate,
                cash,
                cost,
                profit,  
                canteenId,
                stallId
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

export const getSales = async (req, res) => {
    const { reportId } = req.params;

    let db;
    try {
        db = await connectDB();

        const sale = await db.get(
            "SELECT * FROM sales WHERE reportId =?",
            [reportId]
        );

        if (!sale) {
            return res.status(404).json({ success: false, message: "Sale report not found" });
        }

        res.json({ success: true, sale });
    } catch (error) {
        console.error("Error fetching sale report:", error);
        res.status(500).json({ success: false, message: "Database query failed" });
    } finally {
        if (db) {
            await db.close();
        }
    }
}

export const filterSales = async (req, res) => {
    const { startDate, endDate } = req.body;
    console.log("Received filter request:", { startDate, endDate });

    let db;
    try {
        db = await connectDB(); 

        let query = "SELECT * FROM sales";
        let params = [];

        if (startDate && endDate) {
            query += " WHERE DATE(salesDate) >= DATE(?) AND DATE(salesDate) <= DATE(?)";
            params = [startDate, endDate];
        }

        console.log("🛠 SQL Query:", query, params);
        const sales = await db.all(query, params);

        console.log("Filtered sales:", sales);

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
            SELECT stallId, salesDate, SUM(profit) AS totalProfit, SUM(cost) AS totalCost, SUM(cash) AS totalCash
            FROM sales
        `;

        if (period === "weekly") {
            query += " WHERE salesDate >= date('now', '-7 days')";
        } else if (period === "monthly") {
            query += " WHERE salesDate >= date('now', '-30 days')";
        } else {
            return res.status(400).json({ error: "Invalid period. Use 'weekly' or 'monthly'." });
        }

        query += " GROUP BY stallId, salesDate ORDER BY salesDate DESC";

        const salesData = await db.all(query);

        let csv;
        if (salesData.length === 0) {
            csv = "No sales data available for the selected period.";
        } else {
            const fields = ["stallId", "salesDate", "totalProfit", "totalCost", "totalCash"];
            const json2csvParser = new Parser({ fields });
            csv = json2csvParser.parse(salesData);
        }

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
            SELECT stallId, salesDate, SUM(profit) AS totalProfit, SUM(cost) AS totalCost, SUM(cash) AS totalCash
            FROM sales
        `;

        if (period === "weekly") {
            query += " WHERE salesDate >= date('now', '-7 days')";
        } else if (period === "monthly") {
            query += " WHERE salesDate >= date('now', '-30 days')";
        } else {
            return res.status(400).json({ error: "Invalid period. Use 'weekly' or 'monthly'." });
        }

        query += " GROUP BY stallId, salesDate ORDER BY salesDate DESC";

        const salesData = await db.all(query);

        const exportDir = path.join(process.cwd(), "exports");
        if (!fs.existsSync(exportDir)) {
            fs.mkdirSync(exportDir, { recursive: true });
        }

        const fileName = `sales_${period}.pdf`;
        const filePath = path.join(exportDir, fileName);
        const doc = new PDFDocument();
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        doc.fontSize(18).text(`Sales Report (${period})`, { align: "center" }).moveDown(1);

        if (salesData.length === 0) {
            doc.fontSize(14).text("No sales data available for the selected period.", { align: "center" }).moveDown(2);
        } else {
            doc.fontSize(12).text("Stall ID", 50, 100, { bold: true });
            doc.text("Sales Date", 150, 100, { bold: true });
            doc.text("Total Profit", 250, 100, { bold: true });
            doc.text("Total Cost", 350, 100, { bold: true });
            doc.text("Total Cash", 450, 100, { bold: true });

            let y = 120;
            salesData.forEach((sale) => {
                doc.text(sale.stallId, 50, y);
                doc.text(sale.salesDate, 150, y);
                doc.text(`₱${sale.totalProfit.toFixed(2)}`, 250, y);
                doc.text(`₱${sale.totalCost.toFixed(2)}`, 350, y);
                doc.text(`₱${sale.totalCash.toFixed(2)}`, 450, y);
                y += 20;
            });
        }

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