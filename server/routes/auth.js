import express from 'express';
import { addInventory, addPurchase, addStallA, addStallB, adminLogin, adminLogout, adminRegister, deleteInventory, deletePurchase, deleteStall, searchPurchases, staffLogin, staffLogout, staffRegister, viewInventory, viewPurchases, viewStallsA, viewStallsB } from '../controllers/auth.controllers.js';

const router = express.Router();

router.post("/admin/register", adminRegister);
router.post("/admin/logout", adminLogout);
router.post("/admin/login", adminLogin);
router.post("/admin/add/purchase", addPurchase);
router.delete('/admin/purchases/:productId', deletePurchase);
router.get("/admin/view/purchases", viewPurchases);
router.get("/admin/search", searchPurchases);
router.post("/admin/inventory/stall/a", addStallA);
router.post("/admin/inventory/stall/b", addStallB);
router.get("/admin/view/stalls/a", viewStallsA);
router.get("/admin/view/stalls/b", viewStallsB);
router.delete('/admin/inventory/stall/:stallId', deleteStall);
router.post("/admin/inventory/stall/:stallId", addInventory);
router.delete('/admin/stall/inventory/:inventoryId', deleteInventory);
router.get("/admin/view/inventory/:stallId", viewInventory);

router.post("/staff/register", staffRegister);
router.post("/staff/logout", staffLogout);
router.post("/staff/login", staffLogin);

export default router;