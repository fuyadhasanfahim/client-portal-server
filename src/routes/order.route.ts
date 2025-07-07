import { Router } from "express";
import OrderControllers from "../controllers/order.controller";

const router = Router();

router.get("/get-orders", OrderControllers.getOrders);
router.get("/get-orders/:orderID", OrderControllers.getOrderByID);

export const orderRoute = router;
