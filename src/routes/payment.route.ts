import { Router } from "express";
import PaymentController from "../controllers/payment.controller";

const router = Router();


router.get(
    "/get-payments-amount/:status",
    PaymentController.getPaymentsByStatus
);

export const paymentRoute = router;
