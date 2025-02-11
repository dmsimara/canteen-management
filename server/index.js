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

app.get("/", (req, res) => {
    res.render("home", { title: "Scope", styles: ["home"] });
});

app.get("/admin/login", (req, res) => {
    res.render("adminLogin", { title: "Scope", styles: ["adminLogin"] });
})

app.get("/staff/login", (req, res) => {
    res.render("staffLogin", { title: "Scope", styles: ["staffLogin"] });
})

app.get("/admin/register", (req, res) => {
    res.render("adminRegister", { title: "Scope", styles: ["adminRegister"] });
})

app.get("/admin/dashboard", (req, res) => {
    res.render("adminDashboard", { title: "Scope", styles: ["adminDashboard"] });
});

app.get("/staff/dashboard", (req, res) => {
    res.render("staffDashboard", { title: "Scope", styles: ["staffDashboard"] });
});

app.use("/api/auth", authRoutes);

app.listen(PORT, async () => {
    try {
        await connectDB(); 
        console.log("Server is running on port PORT");
    } catch (error) {
        console.error("Failed to connect to the database:", error);
        process.exit(1);  
    }
});
