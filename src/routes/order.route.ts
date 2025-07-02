import { Router } from "express";
import OrderControllers from "../controllers/order.controller";

const router = Router();

router.get("/get-order-by-id", OrderControllers.getOrderByID);

router.get("/get-draft-order", OrderControllers.getDraftOrder);

router.get("/get-all-orders", OrderControllers.getAllOrders);

router.get("/get-all-orders-by-user-id", OrderControllers.getAllOrdersByUserID);

router.get("/get-orders-by-status", OrderControllers.getOrdersByStatus);

export const orderRoute = router;
