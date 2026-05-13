import { Router } from "express";
import { getAll, getById, create, update, remove, adjustBalance } from "../controllers/customers.controller";

const router = Router();

router.get("/", getAll);
router.get("/:id", getById);
router.post("/", create);
router.put("/:id", update);
router.delete("/:id", remove);
router.post("/:id/balance", adjustBalance);

export default router;