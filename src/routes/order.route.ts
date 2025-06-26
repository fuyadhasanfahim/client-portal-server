import { Router } from "express";
import OrderControllers from "../controllers/order.controller";

const router = Router();

router.get("/get-order-by-id", OrderControllers.getOrderByID);

router.get("/get-draft-order", OrderControllers.getDraftOrder);

router.get("/get-all-orders", OrderControllers.getAllOrders);

export const orderRoute = router;
