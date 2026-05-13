import { Router } from "express";
import {
  getServices,
  getActiveServices,
  createService,
  updateService,
  deleteService,
} from "../controllers/services.controller";

const router = Router();

router.get("/", getServices);
router.get("/active", getActiveServices);
router.post("/", createService);
router.put("/:id", updateService);
router.delete("/:id", deleteService);

export default router;