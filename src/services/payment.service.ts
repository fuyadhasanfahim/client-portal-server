import { endOfMonth, startOfMonth, parse } from "date-fns";
import PaymentModel from "../models/payment.model";

const getPaymentsToDateByStatusFromDB = async ({
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
}) => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const query: Record<string, any> = {
            paymentOption,
        };

        if (status) {
            query.status = status;
        }

        if (role === "User" && userID) {
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
    } catch (error) {
        throw new Error(
            error instanceof Error
                ? error.message
                : "Something went wrong! Please try again later."
        );
    }
};

const PaymentServices = { getPaymentsToDateByStatusFromDB };

export default PaymentServices;
