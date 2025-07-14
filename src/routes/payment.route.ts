import { Router } from "express";
import PaymentControllers from "../controllers/payment.controller";

const router = Router();

// Get Routes
router.get(
    "/get-payments-amount/:status",
    PaymentControllers.getPaymentsByStatus
);
router.get("/get-payment/:orderID", PaymentControllers.getPaymentByOrderID);

// Post Routes
router.post("/new-payment", PaymentControllers.newPayment);

export const paymentRoute = router;
