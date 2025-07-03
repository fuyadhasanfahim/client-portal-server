import { Router } from "express";
import PaymentController from "../controllers/payment.controller";

const router = Router();

router.get(
    "/get-payments-to-date-by-status",
    PaymentController.getPaymentsToDateByStatus
);

export const paymentRoute = router;
