import { open } from "sqlite";
import sqlite3 from "sqlite3";

export const connectDB = async () => {
    let db;
    try {
        db = await open({
            filename: "canteen.db",
            driver: sqlite3.Database,
        });

        console.log("Connected to SQLite database");

        await db.run("BEGIN TRANSACTION");

        await db.exec("DROP TABLE IF EXISTS inventory_new;");

        await db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                adminId INTEGER PRIMARY KEY AUTOINCREMENT,
                adminEmail TEXT NOT NULL UNIQUE,
                adminPassword TEXT NOT NULL,
                adminFirstName TEXT NOT NULL,
                adminLastName TEXT NOT NULL,
                lastLogin TEXT
            );
        `);

        await db.exec(`
            CREATE TABLE IF NOT EXISTS staff (
                staffId INTEGER PRIMARY KEY AUTOINCREMENT,
                staffFirstName TEXT NOT NULL,
                staffLastName TEXT NOT NULL,
                stall TEXT NOT NULL,
                staffEmail TEXT NOT NULL UNIQUE,
                staffPassword TEXT NOT NULL
            );
        `);

        await db.exec(`
            CREATE TABLE IF NOT EXISTS products (
                productId INTEGER PRIMARY KEY AUTOINCREMENT,
                productName TEXT NOT NULL,
                price REAL NOT NULL,
                quantity INTEGER NOT NULL,
                MOP TEXT NOT NULL,
                date TEXT NOT NULL
            );
        `);

        await db.exec(`
            CREATE TABLE IF NOT EXISTS canteens (
                canteenId INTEGER PRIMARY KEY AUTOINCREMENT,
                canteenName TEXT NOT NULL UNIQUE
            );
        `);

        await db.exec(`
            INSERT INTO canteens (canteenName)
            SELECT 'Main Canteen'
            WHERE NOT EXISTS (SELECT 1 FROM canteens WHERE canteenName = 'Main Canteen');
        `);

        await db.exec(`
            INSERT INTO canteens (canteenName)
            SELECT 'Secondary Canteen'
            WHERE NOT EXISTS (SELECT 1 FROM canteens WHERE canteenName = 'Secondary Canteen');
        `);

        await db.exec(`
            CREATE TABLE IF NOT EXISTS stalls (
                stallId INTEGER PRIMARY KEY AUTOINCREMENT,
                stallName TEXT NOT NULL,
                category TEXT NOT NULL,  
                canteenId INTEGER NOT NULL,
                FOREIGN KEY (canteenId) REFERENCES canteens(canteenId) ON DELETE CASCADE
            );
        `);

        await db.exec(`
            CREATE TABLE inventory_new (
                inventoryId INTEGER PRIMARY KEY AUTOINCREMENT,
                productName TEXT NOT NULL,
                quantity INTEGER NOT NULL,
                unit TEXT NOT NULL,
                stallId INTEGER NOT NULL,
                dateAdded TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, 
                FOREIGN KEY (stallId) REFERENCES stalls(stallId) ON DELETE CASCADE
            );
        `);

        await db.exec(`
            INSERT INTO inventory_new (inventoryId, productName, quantity, unit, stallId, dateAdded)
            SELECT inventoryId, productName, quantity, unit, stallId, dateAdded FROM inventory;
        `);

        await db.exec("DROP TABLE inventory;");
        await db.exec("ALTER TABLE inventory_new RENAME TO inventory;");

        await db.run("COMMIT");

        return db;
    } catch (error) {
        console.error("Database connection error:", error);

        if (db) {
            await db.run("ROLLBACK").catch(() => console.error("Failed to rollback transaction"));
        }

        process.exit(1);
    }
};
