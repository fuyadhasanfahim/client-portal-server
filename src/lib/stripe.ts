import Stripe from "stripe";
import envConfig from "../config/env.config";

const stripeSecretKey = envConfig.stripe_secret_key!;
export const stripe = new Stripe(stripeSecretKey, {
    apiVersion: "2025-06-30.basil",
});

export default stripe;
