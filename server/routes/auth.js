import express from 'express';
import { adminLogin, adminLogout, adminRegister } from '../controllers/auth.controllers.js';

const router = express.Router();

router.post("/admin/register", adminRegister);
router.post("/admin/logout", adminLogout);
router.post("/admin/login", adminLogin);

export default router;