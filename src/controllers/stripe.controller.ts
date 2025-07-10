import { Request, Response } from "express";
import StripeServices from "../services/stripe.service";
import Stripe from "stripe";
import envConfig from "../config/env.config";

async function createSetupIntent(req: Request, res: Response) {
    try {
        const { userID, orderID } = req.body;

        if (!userID || !orderID) {
            res.status(400).json({
                success: false,
                message: "Order ID and User ID required.",
            });
            return;
        }

        const { client_secret, customer_id } =
            await StripeServices.createSetupIntentInDB(userID, orderID);

        res.status(200).json({
            success: true,
            data: {
                client_secret,
                customer_id,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Failed to save payment method",
        });
    }
}

async function newOrderCheckout(req: Request, res: Response) {
    try {
        const { orderID, paymentOption, paymentMethod } = req.body;

        if (!orderID || !paymentOption || !paymentMethod) {
            res.status(400).json({
                success: false,
                message: "Missing orderID, payment option or payment method.",
            });
            return;
        }

        const client_secret = await StripeServices.newOrderCheckoutInDB(
            orderID,
            paymentOption,
            paymentMethod
        );

        res.status(200).json({
            success: true,
            data: client_secret,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Failed to save payment method",
        });
    }
}

export const paymentWebhook = async (req: Request, res: Response) => {
    try {
        const stripeSignature = req.headers["stripe-signature"];

        if (!stripeSignature || typeof stripeSignature !== "string") {
            res.status(400).json({
                success: false,
                message: "Missing or invalid Stripe signature.",
            });
            return;
        }

        let event: Stripe.Event;
        try {
            event = await StripeServices.constructStripeEvent(
                req.body,
                stripeSignature,
                envConfig.stripe_webhook_secret!
            );
        } catch (error) {
            res.status(400).json({
                success: false,
                message: `Webhook Error: ${(error as Error).message}`,
            });
            return;
        }

        if (event.type === "checkout.session.completed") {
            const session = event.data.object as Stripe.Checkout.Session;
            await StripeServices.paymentWebhookInDB(session);
        }

        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Internal Server Error",
        });
    }
};

const StripeControllers = {
    createSetupIntent,
    newOrderCheckout,
    paymentWebhook,
};
export default StripeControllers;
