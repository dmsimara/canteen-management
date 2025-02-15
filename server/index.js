import express from 'express';
import dotenv from 'dotenv';
import { fileURLToPath } from "url"; 
import { dirname } from "path";
import path from "path";
import { connectDB } from './db/connectDB.js';
import authRoutes from './routes/auth.js'; 
import exphbs from 'express-handlebars';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT 

app.use(express.urlencoded({ extended: true }));  
app.use(express.json());

app.engine("hbs", exphbs.engine({
    extname: ".hbs",
    defaultLayout: "main", 
    layoutsDir: path.join(__dirname, "../client/views/layouts"), 
}));


app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "../client/views")); 
console.log("Views Directory: ", path.join(__dirname, "../client/views"));
app.use(express.static(path.join(__dirname, "../client/public"))); 
console.log("Serving static files from:", path.join(__dirname, "uploads"));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));


app.get("/", (req, res) => {
    res.render("adminLogin", { title: "Scope", styles: ["adminLogin"] });
})

app.get("/admin/register", (req, res) => {
    res.render("adminRegister", { title: "Scope", styles: ["adminRegister"] });
})

app.get("/admin/dashboard", async (req, res) => {
    try {
        let db = await connectDB(); 

        const mainMenuCount = await db.get("SELECT COUNT(*) AS count FROM menu WHERE canteenId = 1");
        const secondMenuCount = await db.get("SELECT COUNT(*) AS count FROM menu WHERE canteenId = 2");

        db.close();

        res.render("adminDashboard", { 
            title: "Scope", 
            styles: ["adminDashboard"],
            mainMenu: mainMenuCount.count,  
            secondMenu: secondMenuCount.count
        });

    } catch (error) {
        console.error("Error fetching menu counts:", error);
        res.status(500).send("Server Error");
    }
});

app.get("/admin/purchases", (req, res) => {
    res.render("adminPurchases", { title: "Scope", styles: ["adminPurchases"] });
});

app.get("/admin/inventory", (req, res) => {
    res.render("adminInventory", { title: "Scope", styles: ["adminInventory"] });
});

app.get("/admin/inventory/canteen/main", (req, res) => {
    res.render("mainCanteen", { title: "Scope", styles: ["mainCanteen"] });
})

app.get("/admin/inventory/canteen/secondary", (req, res) => {
    res.render("secondCanteen", { title: "Scope", styles: ["secondCanteen"] });
})

app.get("/admin/inventory/stall/:stallId", async (req, res) => {
    const { stallId } = req.params;
    try {
        const db = await connectDB();
        const stall = await db.get("SELECT * FROM stalls WHERE stallId = ?", [stallId]);
        await db.close();

        if (!stall) {
            return res.status(404).send("Stall not found");
        }

        let canteenName = "Unknown Canteen";
        let canteenPath = "#"; 

        if (stall.canteenId === 1) {
            canteenName = "Main Canteen";
            canteenPath = "/admin/inventory/canteen/main";
        } else if (stall.canteenId === 2) {
            canteenName = "Secondary Canteen";
            canteenPath = "/admin/inventory/canteen/secondary";
        }

        res.render("stallInventory", {
            title: "Scope",
            styles: ["stallInventory"],
            stallName: stall.stallName,
            canteenName: canteenName,
            canteenPath: canteenPath
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Error loading stall inventory");
    }
});

app.get("/admin/sales", (req, res) => {
    res.render("adminSales", { title: "Scope", styles: ["adminSales"] });
});

app.get("/admin/schedule", (req, res) => {
    res.render("adminSchedule", { title: "Scope", styles: ["adminSchedule"] });
});

app.get("/admin/menu", (req, res) => {
    res.render("adminMenu", { title: "Scope", styles: ["adminMenu"] });
});

app.get("/admin/menu/main", async (req, res) => {
    try {
        const db = await connectDB();
        const menus = await db.all("SELECT * FROM menu");

        res.render("mainMenu", {
            title: "Scope",
            styles: ["mainMenu"],
            menus, 
        });
    } catch (error) {
        console.error("Error fetching menus:", error);
        res.status(500).send("Internal Server Error");
    }
});


app.get("/admin/menu/secondary", async (req, res) => {
    try {
        const db = await connectDB();
        const menus = await db.all("SELECT * FROM menu");

        console.log("Menus retrieved:", menus); 

        res.render("secondMenu", {
            title: "Scope",
            styles: ["secondMenu"],
            menus,
        });
    } catch (error) {
        console.error("Error fetching menus:", error);
        res.status(500).send("Internal Server Error");
    }
});


app.get("/admin/staff", (req, res) => {
    res.render("adminStaff", { title: "Scope", styles: ["adminStaff"] });
});

// staff pages
app.get("/staff/dashboard", (req, res) => {
    res.render("staffDashboard", { title: "Scope", styles: ["staffDashboard"] });
});

app.use("/api/auth", authRoutes);

app.listen(PORT, async () => {
    try {
        await connectDB(); 
        console.log(`Server running on http://localhost:${PORT}`);
    } catch (error) {
        console.error("Failed to connect to the database:", error);
        process.exit(1);  
    }
});
