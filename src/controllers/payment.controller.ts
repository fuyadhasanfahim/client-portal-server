import { Request, Response } from "express";
import PaymentServices from "../services/payment.service";

const getPaymentsToDateByStatus = async (req: Request, res: Response) => {
    try {
        const { status, paymentOption, month, userID, role } = req.query;

        if (!paymentOption) {
            res.status(400).json({
                success: false,
                message: "Payment option is required.",
            });
        }

        const payments = await PaymentServices.getPaymentsToDateByStatusFromDB({
            status: status as string,
            paymentOption: paymentOption as string,
            month: month as string,
            userID: userID as string,
            role: role as string,
        });

        if (!payments || payments.length === 0) {
            res.status(200).json({
                success: true,
                data: {
                    totalAmount: 0,
                    revenueTrend: 0,
                },
            });
        }

        const totalAmount = payments.reduce(
            (sum, p) => sum + (p.totalAmount ?? 0),
            0
        );

        const sorted = payments.sort(
            (a, b) =>
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime()
        );

        const mid = Math.floor(sorted.length / 2);
        const firstHalf = sorted.slice(0, mid);
        const secondHalf = sorted.slice(mid);

        const firstHalfAvg =
            firstHalf.reduce((sum, p) => sum + (p.totalAmount ?? 0), 0) /
            (firstHalf.length || 1);
        const secondHalfAvg =
            secondHalf.reduce((sum, p) => sum + (p.totalAmount ?? 0), 0) /
            (secondHalf.length || 1);

        const revenueTrend =
            firstHalfAvg === 0
                ? 0
                : ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

        res.status(200).json({
            success: true,
            data: {
                totalAmount,
                revenueTrend,
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Something went wrong!",
            errorMessage:
                error instanceof Error ? error.message : String(error),
        });
    }
};

const PaymentController = { getPaymentsToDateByStatus };

export default PaymentController;
