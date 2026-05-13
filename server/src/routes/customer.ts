import { Router } from "express";
import * as auth from "../controllers/auth.controller";
import * as customerCtrl from "../controllers/customer.controller";

const router = Router();

// Auth
router.post("/login", auth.customerLogin);
router.post("/logout", auth.customerLogout);

// Protected customer routes
router.get("/me", customerCtrl.getMe);
router.get("/invoices", customerCtrl.getInvoices);
router.get("/orders", customerCtrl.getOrders);
router.get("/support", customerCtrl.getSupport);
router.post("/support", customerCtrl.createSupport);

export default router;