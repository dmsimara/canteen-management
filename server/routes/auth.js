import express from 'express';
import { addPurchase, adminLogin, adminLogout, adminRegister, deletePurchase, searchPurchases, staffLogin, staffLogout, staffRegister, viewPurchases } from '../controllers/auth.controllers.js';

const router = express.Router();

router.post("/admin/register", adminRegister);
router.post("/admin/logout", adminLogout);
router.post("/admin/login", adminLogin);
router.post("/admin/add/purchase", addPurchase);
router.delete('/admin/purchases/:productId', deletePurchase);
router.get("/admin/view/purchases", viewPurchases);
router.get("/admin/search", searchPurchases);

router.post("/staff/register", staffRegister);
router.post("/staff/logout", staffLogout);
router.post("/staff/login", staffLogin);

export default router;