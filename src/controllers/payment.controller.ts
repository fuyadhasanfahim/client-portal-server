import { Request, Response } from "express";
import PaymentServices from "../services/payment.service";
import { IPayment } from "../types/payment.interface";

async function newPayment(req: Request, res: Response) {
    try {
        const {
            userID,
            orderID,
            paymentOption,
            paymentIntentID,
            customerID,
            status,
        } = req.body;

        if (
            !userID ||
            !orderID ||
            !paymentOption ||
            !paymentIntentID ||
            !customerID ||
            !status
        ) {
            res.status(400).json({
                success: false,
                message: "Missing the required fields.",
            });
            return;
        }

        await PaymentServices.newPaymentInDB({
            userID,
            orderID,
            paymentOption,
            paymentIntentID,
            customerID,
            status,
        });

        res.status(200).json({
            success: true,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Internal Server Error",
        });
    }
}

async function getPaymentsByStatus(req: Request, res: Response) {
    try {
        const { status } = req.params;
        const { paymentOption, month, userID, role } = req.query;

        if (!paymentOption) {
            res.status(400).json({
                success: false,
                message: "Missing required query param: paymentOption",
            });
            return;
        }

        const { payments, current, previous } =
            await PaymentServices.getPaymentsByStatusFromDB({
                status,
                paymentOption: paymentOption as string,
                month: month as string,
                userID: userID as string,
                role: role as string,
            });

        const totalAmount = payments.reduce(
            (sum: number, payment: IPayment) => {
                if (status === "paid") {
                    return sum + (payment.totalAmount || 0);
                }

                return sum + (payment.amount || 0);
            },
            0
        );

        const sum = (payments: IPayment[]) =>
            payments.reduce(
                (acc, p) =>
                    acc +
                    (status === "paid" ? p.totalAmount || 0 : p.amount || 0),
                0
            );

        const currentTotal = sum(current);
        const previousTotal = sum(previous);

        const growthPercentage =
            previousTotal > 0
                ? ((currentTotal - previousTotal) / previousTotal) * 100
                : currentTotal > 0
                  ? 100
                  : 0;

        res.status(200).json({
            success: true,
            data: {
                amount: totalAmount,
                length: payments.length,
                currentAmount: currentTotal,
                previousAmount: previousTotal,
                growthPercentage: Number(growthPercentage.toFixed(2)),
                currentCount: current.length,
                previousCount: previous.length,
                period: month ? "monthly" : "yearly",
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Internal Server Error",
        });
    }
}

async function getPaymentByOrderID(req: Request, res: Response) {
    try {
        const { orderID } = req.params;

        if (!orderID) {
            res.status(400).json({
                success: false,
                message: "Order id is required",
            });
            return;
        }

        const payment =
            await PaymentServices.getPaymentByOrderIDFromDB(orderID);

        if (!payment) {
            res.status(404).json({
                success: false,
                message: "No payment found with this order id.",
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: payment,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Internal Server Error",
        });
    }
}

async function getPaymentsByUserID(req: Request, res: Response) {
    try {
        const { userID } = req.params;

        if (!userID) {
            res.status(400).json({
                success: false,
                message: "User id is required",
            });
            return;
        }

        const payments =
            await PaymentServices.getPaymentsByUserIDFromDB(userID);

        if (!payments || payments.length === 0) {
            res.status(404).json({
                success: false,
                message: "No payments found with this user id.",
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: payments,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Internal Server Error",
        });
    }
}

const PaymentControllers = {
    newPayment,
    getPaymentsByStatus,
    getPaymentByOrderID,
    getPaymentsByUserID,
};

export default PaymentControllers;
