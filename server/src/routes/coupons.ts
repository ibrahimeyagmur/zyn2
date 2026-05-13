import { Router } from "express";
import { getAll, getById, create, update, remove, assign, unassign, validateCoupon } from "../controllers/coupons.controller";

const router = Router();

router.get("/", getAll);
router.get("/:id", getById);
router.post("/", create);
router.post("/validate", validateCoupon);
router.put("/:id", update);
router.delete("/:id", remove);
router.post("/:id/assign", assign);
router.post("/:id/unassign", unassign);

export default router;