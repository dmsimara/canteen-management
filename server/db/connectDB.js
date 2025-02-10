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
        `);

        return db;
    } catch (error) {
        console.error("Database connection error:", error);
        process.exit(1); 
    }
};
