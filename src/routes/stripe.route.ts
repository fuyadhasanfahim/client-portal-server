import { raw, Router } from "express";
import StripeControllers from "../controllers/stripe.controller";

const router = Router();

router.post("/create-setup-intent", StripeControllers.createSetupIntent);
router.post("/new-order-checkout", StripeControllers.newOrderCheckout);
router.post(
    "/payment-webhook",
    raw({ type: "application/json" }),
    StripeControllers.paymentWebhook
);

export const stripeRoute = router;
