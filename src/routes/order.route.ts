import { Router } from "express";
import OrderControllers from "../controllers/order.controller";

const router = Router();

router.post("/new-order/:orderStage", OrderControllers.newOrder);
router.get("/get-orders", OrderControllers.getOrders);
router.get("/get-orders/:orderID", OrderControllers.getOrderByID);
router.put("/update-order/:orderID", OrderControllers.updateOrder);

export const orderRoute = router;
