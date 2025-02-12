import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

export const connectDB = async () => {
    try {
        const db = await open({
            filename: 'canteen.db',
            driver: sqlite3.Database
        });

        console.log("Connected to SQLite database");

        await db.run('BEGIN TRANSACTION');

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
            CREATE TABLE IF NOT EXISTS inventory (
                inventoryId INTEGER PRIMARY KEY AUTOINCREMENT,
                productName TEXT NOT NULL,
                category TEXT NOT NULL,  
                quantity INTEGER NOT NULL,
                unit TEXT NOT NULL,      
                price REAL NOT NULL,   
                stallId INTEGER NOT NULL,
                dateAdded TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, 
                FOREIGN KEY (stallId) REFERENCES stalls(stallId) ON DELETE CASCADE
            );
        `);

        await db.run('COMMIT');

        return db;
    } catch (error) {
        console.error("Database connection error:", error);

        await db.run('ROLLBACK');
        
        process.exit(1);
    }
};
