import { open } from 'sqlite';
import sqlite3 from 'sqlite3';  

export const connectDB = async () => {
    try {
        const db = await open({
            filename: 'canteen.db',
            driver: sqlite3.Database      
        });

        console.log("Connected to SQLite database");

        await db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                adminId INTEGER PRIMARY KEY AUTOINCREMENT,
                adminEmail TEXT NOT NULL UNIQUE,
                adminPassword TEXT NOT NULL,
                adminFirstName TEXT NOT NULL,
                adminLastName TEXT NOT NULL,
                lastLogin TEXT
            );

            CREATE TABLE IF NOT EXISTS staff (
                staffId INTEGER PRIMARY KEY AUTOINCREMENT,
                staffFirstName TEXT NOT NULL,
                staffLastName TEXT NOT NULL,
                stall TEXT NOT NULL,
                staffEmail TEXT NOT NULL UNIQUE,
                staffPassword TEXT NOT NULL
            );
        `);

        return db;
    } catch (error) {
        console.error("Database connection error:", error);
        process.exit(1); 
    }
};
