import { Router } from "express";
import PaymentController from "../controllers/payment.controller";

const router = Router();

router.post("/new-payment");

router.get(
    "/get-payments-to-date-by-status",
    PaymentController.getPaymentsToDateByStatus
);

router.get(
    "/get-payments-amount/:status",
    PaymentController.getPaymentsByStatus
);

export const paymentRoute = router;
