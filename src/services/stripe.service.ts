import { nanoid } from "nanoid";
import stripe from "../lib/stripe";
import { IOrder } from "../types/order.interface";
import envConfig from "../config/env.config";

async function createSetupIntent(userID: string, orderID: string) {
    try {
        let customerId;
        let customer;

        if (userID) {
            const existingCustomers = await stripe.customers.list({
                email: userID,
            });
            customer = existingCustomers.data[0];
        }

        if (customer) {
            customerId = customer.id;
        } else {
            customer = await stripe.customers.create({
                metadata: { userID, orderID },
            });
            customerId = customer.id;
        }

        const setupIntent = await stripe.setupIntents.create({
            customer: customerId,
            usage: "off_session",
        });

        return {
            clientSecret: setupIntent.client_secret,
            customerId,
        };
    } catch (error) {
        throw new Error(
            error instanceof Error
                ? error.message
                : "Something went wrong! Please try again later."
        );
    }
}

async function createCheckoutSession(
    order: IOrder,
    paymentOption: string,
    paymentMethod: string
) {
    try {
        const orderSessionId = `Payment-${nanoid(10)}`;

        const session = await stripe.checkout.sessions.create({
            mode: "payment",
            ui_mode: "embedded",
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: "usd",
                        product_data: {
                            name: `Order #${order.orderID}`,
                        },
                        unit_amount: Math.round((order.total ?? 0) * 100),
                    },
                    quantity: 1,
                },
            ],
            return_url: `${envConfig.frontend_url!}/orders/order-payment/complete?session_id={CHECKOUT_SESSION_ID}`,
            metadata: {
                orderID: order.orderID,
                userID: order.user.userID,
                orderSessionId,
                paymentOption,
                paymentMethod,
            },
        });

        return session;
    } catch (error) {
        throw new Error(
            error instanceof Error
                ? error.message
                : "Something went wrong! Please try again later."
        );
    }
}

const StripeServices = { createSetupIntent, createCheckoutSession };
export default StripeServices;
