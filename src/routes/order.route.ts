import { Router } from "express";
import OrderControllers from "../controllers/order.controller";

const router = Router();

router.get("/get-order-by-id", OrderControllers.getOrderByID);

router.get("/get-draft-order", OrderControllers.getDraftOrder);

export const orderRoute = router;
