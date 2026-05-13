import { Router } from "express";
import {
  getDeliveries,
  getDeliveriesByOrder,
  getDeliveriesByCustomer,
  createDelivery,
  deleteDelivery,
  uploadDelivery,
} from "../controllers/deliveries.controller";

const router = Router();

router.get("/", getDeliveries);
router.get("/order/:orderId", getDeliveriesByOrder);
router.get("/customer/:customerId", getDeliveriesByCustomer);
router.post("/", uploadDelivery.single("dosya"), createDelivery);
router.delete("/:id", deleteDelivery);

export default router;