import { nanoid } from "nanoid";
import stripe from "../lib/stripe.js";
import { OrderModel } from "../models/order.model.js";
import UserModel from "../models/user.model.js";
import Stripe from "stripe";
import { PaymentModel } from "../models/payment.model.js";
import { sendEmail } from "../lib/nodemailer.js";
import envConfig from "../config/env.config.js";

async function createSetupIntentInDB(userID: string, orderID: string) {
    const user = await UserModel.findOne({ userID });

    if (!user) {
        throw new Error("User not found with this ID.");
    }

    let customerId = user?.stripeCustomerId;
    let customer;

    if (customerId) {
        try {
            customer = await stripe.customers.retrieve(customerId);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            if (err.code === "resource_missing") {
                // recreate customer if old one was deleted
                customer = await stripe.customers.create({
                    metadata: { userID, orderID },
                });
                customerId = customer.id;
                if (user) {
                    user.stripeCustomerId = customerId;
                    await user.save();
                }
            } else {
                throw err;
            }
        }
    } else {
        customer = await stripe.customers.create({
            metadata: { userID, orderID },
        });

        customerId = customer.id;
        if (user) {
            user.stripeCustomerId = customerId;
            await user.save();
        }
    }

    const setupIntent = await stripe.setupIntents.create({
        customer: customerId,
        usage: "off_session",
    });

    return {
        client_secret: setupIntent.client_secret,
        customer_id: customerId,
    };
}

async function newOrderCheckoutInDB(
    orderID: string,
    paymentOption: string,
    paymentMethod: string
) {
    const order = await OrderModel.findOne({
        orderID,
    });

    if (!order) {
        throw new Error("Order not found with this id.");
    }

    const orderSessionId = `PAYMENT-${nanoid(10)}`;

    const session = await stripe.checkout.sessions.create({
        mode: "payment",
        ui_mode: "embedded",
        payment_method_types: ["card"],
        line_items: [
            {
                price_data: {
                    currency: "usd",
                    product_data: {
                        name: `Order #${orderID}`,
                    },
                    unit_amount: Math.round((order.total ?? 0) * 100),
                },
                quantity: 1,
            },
        ],
        return_url: `${envConfig.frontend_url!}/orders/order-payment/complete?session_id={CHECKOUT_SESSION_ID}`,
        metadata: {
            orderID,
            userID: order.user.userID,
            orderSessionId,
            paymentOption,
            paymentMethod,
        },
    });

    return session.client_secret;
}

async function constructStripeEvent(
    rawBody: Buffer,
    signature: string,
    secret: string
) {
    return stripe.webhooks.constructEvent(rawBody, signature, secret);
}

async function paymentWebhookInDB(session: Stripe.Checkout.Session) {
    const metadata = session.metadata;

    if (!metadata?.orderID || !metadata?.userID) {
        throw new Error("Missing metadata in session.");
    }

    const { orderID, userID, paymentOption, paymentMethod } = metadata;

    const existingPayment = await PaymentModel.findOne({ orderID });

    const paymentData = {
        userID,
        orderID,
        paymentOption,
        paymentMethod,
        customerID: session.customer?.toString(),
        amount: (session.amount_subtotal ?? 0) / 100,
        tax: (session.total_details?.amount_tax ?? 0) / 100,
        totalAmount: (session.amount_total ?? 0) / 100,
        currency: session.currency,
        status: session.payment_status as
            | "pending"
            | "succeeded"
            | "failed"
            | "refunded",
        paymentIntentID: session.payment_intent?.toString(),
    };

    if (existingPayment) {
        await PaymentModel.updateOne({ _id: existingPayment._id }, paymentData);
    } else {
        await PaymentModel.create(paymentData);
    }

    await OrderModel.findOneAndUpdate(
        { orderID },
        {
            paymentStatus: "paid",
            orderStage: "payment-completed",
            paymentID: session.payment_intent?.toString(),
        }
    );

    console.log(session.payment_intent?.toString());

    const user = await UserModel.findOne({ userID });

    if (user?.email) {
        await sendEmail({
            from: process.env.EMAIL_USER!,
            to: user.email,
            subject: `✅ Payment Completed - Order #${orderID}`,
            html: `<div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 16px; color: #333; line-height: 1.6;">
            <div style="max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 8px; padding: 24px;">
                <h2 style="color: #0f9d58; margin-bottom: 12px;">🎉 Payment Confirmed!</h2>

                <p>Hi ${user.name || "there"},</p>

                <p>Thank you for your payment! We're excited to let you know that your order has been successfully marked as <strong style="color: #0f9d58;">Paid</strong> and is now being processed via <strong>Stripe</strong>.</p>

                <div style="margin: 20px 0; padding: 16px; background-color: #f9f9f9; border-left: 4px solid #0f9d58;">
                    <p><strong>User ID:</strong> ${userID}</p>
                    <p><strong>Order ID:</strong> ${orderID}</p>
                    <p><strong>Amount Paid:</strong> ${(session.amount_total ?? 0) / 100} ${session.currency?.toUpperCase()}</p>
                </div>

                <p>You can expect an update once your order is completed and ready for delivery.</p>
                <p>If you have any questions, feel free to reach out to us anytime.</p>

                <p style="margin-top: 30px;">Best regards,<br /><strong>The Project Pixel Forge Team</strong></p>
            </div>
        </div>`,
        });
    }
}

const StripeServices = {
    createSetupIntentInDB,
    newOrderCheckoutInDB,
    constructStripeEvent,
    paymentWebhookInDB,
};
export default StripeServices;
