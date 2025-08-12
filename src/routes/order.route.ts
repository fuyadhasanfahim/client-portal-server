import { Router } from "express";
import OrderControllers from "../controllers/order.controller.js";

const router = Router();

router.get("/get-orders", OrderControllers.getOrders);
router.get("/get-draft-orders", OrderControllers.getDraftOrders);
router.get("/get-orders/:orderID", OrderControllers.getOrderByID);
router.get("/get-orders-by-status/:status", OrderControllers.getOrdersByStatus);
router.get("/get-orders-by-user", OrderControllers.getOrdersByUserID);
router.get("/get-revisions/:orderID", OrderControllers.getRevision);

router.post("/new-order/:orderStage", OrderControllers.newOrder);

router.put("/update-order/:orderID", OrderControllers.updateOrder);
router.put("/deliver-order", OrderControllers.deliverOrder);
router.put("/review-order", OrderControllers.reviewOrder);
router.put("/complete-order", OrderControllers.completeOrder);
router.put("/revision-message", OrderControllers.sendRevisionMessage);

export const orderRoute = router;
