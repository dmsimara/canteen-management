import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        return res.redirect("/admin/login");
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.adminId = decoded.adminId;
        next();
    } catch (error) {
        console.log("Error in verifyToken", error);
        return res.redirect("/admin/login");
    }
}

export const verifyTenantToken = (req, res, next) => {
    const token = req.cookies.staffToken; 
    if (!token) {
        return res.redirect("/tenant/login");
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET); 
        console.log('Decoded token:', decoded);

        if (!decoded) {
            return res.redirect("/tenant/login");
        }

        req.staffId = decoded.staffId;
        next();
    } catch (error) {
        console.log("Error in verifyTenantToken", error);
        return res.redirect("/tenant/login");
    }
};