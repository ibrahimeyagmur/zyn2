import { Router } from "express";
import { getAll, getById, create, update, remove, addMessage, updateStatus, waRemind, upload } from "../controllers/support.controller";

const router = Router();

router.get("/", getAll);
router.get("/:id", getById);
router.post("/", create);
router.put("/:id", update);
router.delete("/:id", remove);
router.post("/:id/messages", upload.array("dosyalar", 10), addMessage);
router.patch("/:id/status", updateStatus);
router.post("/:id/wa-remind", waRemind);

export default router;