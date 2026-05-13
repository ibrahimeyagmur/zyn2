import { Router } from "express";
import { getStats, getRecentOrders, getRecentSupport, getCashflow } from "../controllers/dashboard.controller";

const router = Router();

router.get("/stats", getStats);
router.get("/recent-orders", getRecentOrders);
router.get("/recent-support", getRecentSupport);
router.get("/cashflow", getCashflow);

export default router;