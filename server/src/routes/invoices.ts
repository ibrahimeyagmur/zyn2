import { Router } from "express";
import { getAll, getById, create, update, remove, getCashflow, addCashflowEntry, removeCashflowEntry } from "../controllers/invoices.controller";

const router = Router();

router.get("/", getAll);
router.get("/cashflow", getCashflow);
router.get("/:id", getById);
router.post("/", create);
router.put("/:id", update);
router.delete("/:id", remove);
router.post("/cashflow/entries", addCashflowEntry);
router.delete("/cashflow/entries/:id", removeCashflowEntry);

export default router;