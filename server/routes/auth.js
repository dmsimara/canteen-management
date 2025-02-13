import express from 'express';
import { addInventory, addPurchase, addSales, addStallA, addStallB, adminLogin, adminLogout, adminRegister, deleteInventory, deletePurchase, deleteSales, deleteStall, exportSalesCSV, exportSalesPDF, filterSales, getInventory, getSales, searchInventory, searchPurchases, staffLogin, staffLogout, staffRegister, updateInventory, updateSales, viewInventory, viewPurchases, viewSales, viewStalls, viewStallsA, viewStallsB } from '../controllers/auth.controllers.js';

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
router.get("/admin/search/inventory", searchInventory);
router.patch("/admin/inventory/update/:inventoryId", updateInventory);
router.get("/admin/inventory/:inventoryId", getInventory);
router.post("/admin/add/sales", addSales);
router.delete('/admin/sales/:reportId', deleteSales);
router.get("/admin/view/sales", viewSales);
router.patch("/admin/sales/update/:reportId", updateSales);
router.get("/admin/sales/edit/:reportId", getSales);
router.post("/admin/filter/sales", filterSales);
router.get("/admin/view/stalls", viewStalls);
router.get("/admin/export/sales/csv/:period", exportSalesCSV);
router.get("/admin/export/sales/pdf/:period", exportSalesPDF);

router.post("/staff/register", staffRegister);
router.post("/staff/logout", staffLogout);
router.post("/staff/login", staffLogin);

export default router;