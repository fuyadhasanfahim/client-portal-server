import { Router } from "express";
import StripeControllers from "../controllers/stripe.controller.js";

const router = Router();

router.post("/create-setup-intent", StripeControllers.createSetupIntent);
router.post("/new-order-checkout", StripeControllers.newOrderCheckout);

export const stripeRoute = router;
