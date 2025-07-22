import cron from "node-cron";
import { OrderModel } from "../models/order.model.js";
import { PaymentModel } from "../models/payment.model.js";
import StripeServices from "../services/stripe.service.js";

cron.schedule("0 0 * * *", async () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const unpaidOrders = await OrderModel.find({
        createdAt: { $lt: thirtyDaysAgo },
        paymentStatus: { $ne: "paid" },
    });

    for (const order of unpaidOrders) {
        const payment = await PaymentModel.findOne({ orderID: order.orderID });

        if (payment?.paymentMethodID && payment?.customerID) {
            try {
                await StripeServices.chargeSavedCard({
                    amount: order.total ?? 0,
                    customerID: payment.customerID,
                    paymentMethodID: payment.paymentMethodID,
                    orderID: order.orderID,
                    userID: order.user.userID,
                });
            } catch (error) {
                console.error(
                    error instanceof Error
                        ? error.message
                        : "Failed to charge card"
                );
            }
        }
    }
});
