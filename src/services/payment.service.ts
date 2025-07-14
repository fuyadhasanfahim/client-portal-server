import {
    endOfMonth,
    startOfMonth,
    parse,
    subMonths,
    startOfYear,
    endOfYear,
    subYears,
} from "date-fns";
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

export async function getPaymentsByStatusFromDB({
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
}): Promise<{
    current: IPayment[];
    previous: IPayment[];
    payments: IPayment[];
}> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const baseQuery: Record<string, any> = {
        paymentOption,
    };

    if (status) baseQuery.status = status;
    if (role === "user" && userID) baseQuery.userID = userID;

    let currentStart: Date, currentEnd: Date;
    let previousStart: Date, previousEnd: Date;

    if (month) {
        const parsed = parse(month, "MMMM", new Date());
        currentStart = startOfMonth(parsed);
        currentEnd = endOfMonth(parsed);

        const prevDate = subMonths(parsed, 1);
        previousStart = startOfMonth(prevDate);
        previousEnd = endOfMonth(prevDate);
    } else {
        const now = new Date();
        currentStart = startOfYear(now);
        currentEnd = endOfYear(now);

        const prevDate = subYears(now, 1);
        previousStart = startOfYear(prevDate);
        previousEnd = endOfYear(prevDate);
    }

    const current = await PaymentModel.find({
        ...baseQuery,
        createdAt: {
            $gte: currentStart,
            $lte: currentEnd,
        },
    });

    const previous = await PaymentModel.find({
        ...baseQuery,
        createdAt: {
            $gte: previousStart,
            $lte: previousEnd,
        },
    });

    const payments = await PaymentModel.find(baseQuery);

    return { current, previous, payments };
}

async function getPaymentByOrderIDFromDB(orderID: string) {
    const payment = await PaymentModel.findOne({ orderID });

    return payment;
}

const PaymentServices = {
    newPaymentInDB,
    getPaymentsByStatusFromDB,
    getPaymentByOrderIDFromDB,
};

export default PaymentServices;
