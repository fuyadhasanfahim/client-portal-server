import { Request, Response } from "express";
import PaymentServices from "../services/payment.service";
import { IPayment } from "../types/payment.interface";

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

        const payments = await PaymentServices.getPaymentsByStatusFromDB({
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

        res.status(200).json({
            success: true,
            data: {
                amount: totalAmount,
                length: payments.length,
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

const PaymentController = {
    getPaymentsByStatus,
};

export default PaymentController;
