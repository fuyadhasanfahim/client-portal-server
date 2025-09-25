import { nanoid } from "nanoid";
import stripe from "../lib/stripe.js";
import { OrderModel } from "../models/order.model.js";
import UserModel from "../models/user.model.js";
import Stripe from "stripe";
import { PaymentModel } from "../models/payment.model.js";
import { sendEmail } from "../lib/nodemailer.js";
import envConfig from "../config/env.config.js";

async function newOrderCheckoutInDB(
    orderID: string,
    paymentOption: string,
    paymentMethod: string
) {
    try {
        const order = await OrderModel.findOne({ orderID });

        if (!order) {
            throw new Error("Order not found with this id.");
        }

        const user = await UserModel.findOne({
            userID: order.user.userID,
        });

        if (!user) {
            throw new Error("No user info found in the order.");
        }

        const orderSessionId = `PAYMENT-${nanoid(10)}`;

        const session = await stripe.checkout.sessions.create({
            mode: "payment",
            ui_mode: "embedded",
            payment_method_types: ["card"],
            line_items: [
                {
                    price_data: {
                        currency: user?.currency ?? "usd",
                        product_data: { name: `Order #${orderID}` },
                        unit_amount: Math.round((order.total ?? 0) * 100),
                    },
                    quantity: 1,
                },
            ],
            return_url: `${envConfig.frontend_url}/orders/order-payment/complete?session_id={CHECKOUT_SESSION_ID}`,
            metadata: {
                orderID,
                userID: order.user.userID,
                orderSessionId,
                paymentOption,
                paymentMethod,
            },
        });

        // ✅ Record pending payment immediately
        await PaymentModel.create({
            paymentID: orderSessionId,
            checkoutSessionID: session.id,
            userID: order.user.userID,
            orderID,
            paymentOption,
            paymentMethod,
            status: "pending",
            amount: order.total ?? 0,
            currency: "usd",
        });

        order.paymentID = orderSessionId;
        order.paymentStatus = "pending";
        order.orderStage = "payment-completed"; // ✅ force stage for counting
        await order.save();

        return session.client_secret;
    } catch (error) {
        console.error(error);
        throw error;
    }
}

async function constructStripeEvent(
    rawBody: Buffer,
    signature: string,
    secret: string
) {
    return stripe.webhooks.constructEvent(rawBody, signature, secret);
}

async function paymentWebhookInDB(session: Stripe.Checkout.Session) {
    try {
        const metadata = session.metadata;

        if (!metadata?.orderID || !metadata?.userID) {
            throw new Error("Missing metadata in session.");
        }

        const { orderID, userID, paymentOption, paymentMethod } = metadata;

        const existingPayment = await PaymentModel.findOne({ orderID });

        const paymentData = {
            paymentID: session.metadata?.orderSessionId,
            checkoutSessionID: session.id,
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
            await PaymentModel.updateOne(
                { _id: existingPayment._id },
                paymentData
            );
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
    } catch (error) {
        console.log(error);
    }
}

const StripeServices = {
    newOrderCheckoutInDB,
    constructStripeEvent,
    paymentWebhookInDB,
};
export default StripeServices;
