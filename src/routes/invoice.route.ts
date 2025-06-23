import { Router } from "express";
import OrderControllers from "../controllers/order.controller";

const router = Router();

router.get("/send-invoice-to-client", OrderControllers.getOrderByID);

export const invoiceRoute = router;
