import { Router } from "express";
import OrderControllers from "../controllers/order.controller.js";

const router = Router();

// Get Routes
router.get("/get-orders", OrderControllers.getOrders);
router.get("/get-orders/:orderID", OrderControllers.getOrderByID);
router.get("/get-orders-by-status/:status", OrderControllers.getOrdersByStatus);

// Post Routes
router.post("/new-order/:orderStage", OrderControllers.newOrder);

// Put/Patch Routes
router.put("/update-order/:orderID", OrderControllers.updateOrder);
router.put("/deliver-order", OrderControllers.deliverOrder);
router.put("/review-order", OrderControllers.reviewOrder);
router.put("/complete-order", OrderControllers.completeOrder);

export const orderRoute = router;
