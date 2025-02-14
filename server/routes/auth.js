import express from 'express';
import { upload } from '../middleware/upload.js';
import { addInventory, addMainMenu, addPurchase, addSales, addSecondMenu, addStallA, addStallB, adminLogin, adminLogout, adminRegister, deleteInventory, deleteMenu, deletePurchase, deleteSales, deleteStall, exportSalesCSV, exportSalesPDF, filterSales, getInventory, getMenu, getSales, searchInventory, searchPurchases, staffLogin, staffLogout, staffRegister, updateInventory, updateMenu, updateSales, viewInventory, viewMenu, viewPurchases, viewSales, viewSecondMenu, viewStalls, viewStallsA, viewStallsB } from '../controllers/auth.controllers.js';

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
router.get("/admin/view/menu/main", viewMenu);
router.delete('/admin/menu/:menuId', deleteMenu);
router.post("/admin/add/menu", upload.single("picture"), addMainMenu);
router.patch("/admin/menu/update/:menuId", upload.single("picture"), updateMenu);
router.get("/admin/menu/edit/:menuId", getMenu);
router.post("/admin/add/second/menu", upload.single("picture"), addSecondMenu);
router.get("/admin/view/menu/second", viewSecondMenu);

router.post("/staff/register", staffRegister);
router.post("/staff/logout", staffLogout);
router.post("/staff/login", staffLogin);

export default router;