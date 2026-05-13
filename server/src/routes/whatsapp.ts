import { Router } from "express";
import * as wa from "../controllers/whatsapp.controller";

const router = Router();

router.get("/status", wa.getStatus);
router.post("/connect", wa.connect);
router.post("/disconnect", wa.disconnect);
router.post("/send", wa.sendMessage);
router.post("/send-bulk", wa.sendBulk);
router.post("/send-otp", wa.sendOTP);
router.post("/verify-otp", wa.verifyOTP);

// Kişi rehberi
router.get("/contacts", wa.getContacts);
router.post("/contacts", wa.addContact);
router.delete("/contacts/:id", wa.deleteContact);

// Telefonu olan müşteriler
router.get("/customers-with-phone", wa.getCustomersWithPhone);

export default router;