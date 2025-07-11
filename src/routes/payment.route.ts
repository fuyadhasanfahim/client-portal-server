import { Router } from "express";
import PaymentControllers from "../controllers/payment.controller";

const router = Router();

router.post("/new-payment", PaymentControllers.newPayment);
router.get(
    "/get-payments-amount/:status",
    PaymentControllers.getPaymentsByStatus
);
router.get("/get-payment/:orderID", PaymentControllers.getPaymentByOrderID);

export const paymentRoute = router;
