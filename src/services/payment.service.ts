import { endOfMonth, startOfMonth, parse } from "date-fns";
import { PaymentModel } from "../models/payment.model";
import { IPayment } from "../types/payment.interface";
import { OrderModel } from "../models/order.model";
import { nanoid } from "nanoid";

async function newPaymentInDB({
    userID,
    orderID,
    paymentOption,
    paymentIntentID,
    customerID,
    status,
}: Partial<IPayment>) {
    const order = await OrderModel.findOne({ orderID });

    if (!order) {
        throw new Error("Order not found with this order id.");
    }

    await PaymentModel.create({
        paymentID: `WBP${nanoid(10)}`,
        userID,
        orderID,
        paymentOption,
        paymentIntentID,
        customerID,
        status: status as "pending" | "succeeded" | "failed" | "refunded",
        amount: order.total,
    });

    order.paymentStatus = "pay-later";
    order.orderStage = "payment-completed";
    await order.save();
}

async function getPaymentsByStatusFromDB({
    status,
    paymentOption,
    month,
    userID,
    role,
}: {
    status?: string;
    paymentOption: string;
    month?: string;
    userID?: string;
    role?: string;
}) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: Record<string, any> = {
        paymentOption,
    };

    if (status) {
        query.status = status;
    }

    if (role === "user" && userID) {
        query.userID = userID;
    }

    if (month) {
        const monthDate = parse(month, "MMMM", new Date());
        const start = startOfMonth(monthDate);
        const end = endOfMonth(monthDate);

        query.createdAt = {
            $gte: start,
            $lte: end,
        };
    }

    const payments = await PaymentModel.find(query);
    return payments;
}

const PaymentServices = {
    newPaymentInDB,
    getPaymentsByStatusFromDB,
};

export default PaymentServices;
