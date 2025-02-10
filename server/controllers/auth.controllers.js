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