import { Router } from "express";
import {
  getAll, getUnreadCount, markAllRead, markRead,
  deleteNotification, clearAll, getSettings, updateSettings, heartbeat,
} from "../controllers/notifications.controller";

const router = Router();

router.get("/settings", getSettings);
router.put("/settings", updateSettings);
router.post("/heartbeat", heartbeat);
router.get("/unread-count", getUnreadCount);
router.get("/", getAll);
router.put("/read-all", markAllRead);
router.delete("/clear-all", clearAll);
router.put("/:id/read", markRead);
router.delete("/:id", deleteNotification);

export default router;
