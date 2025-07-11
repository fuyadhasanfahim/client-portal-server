import { Router } from "express";
import OrderControllers from "../controllers/order.controller";

const router = Router();

router.post("/new-order/:orderStage", OrderControllers.newOrder);
router.get("/get-orders", OrderControllers.getOrders);
router.get("/get-orders/:orderID", OrderControllers.getOrderByID);
router.put("/update-order/:orderID", OrderControllers.updateOrder);
router.put("/deliver-order", OrderControllers.deliverOrder);
router.put("/review-order", OrderControllers.reviewOrder);
router.put("/complete-order", OrderControllers.completeOrder);

export const orderRoute = router;
