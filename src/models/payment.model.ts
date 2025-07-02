import { model, models, Schema } from "mongoose";
import IPayment from "../types/payment.interface";

const paymentSchema = new Schema<IPayment>(
    {
        userID: {
            type: String,
            ref: "User",
            required: true,
        },
        orderID: { type: String, ref: "Order", required: true, unique: true },
        paymentOption: { type: String, required: true },
        paymentIntentId: { type: String },
        customerId: { type: String },
        amount: { type: Number, required: true },
        currency: { type: String },
        tax: { type: Number },
        totalAmount: { type: Number },
        status: {
            type: String,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

const PaymentModel =
    models?.Payment || model<IPayment>("Payment", paymentSchema);
export default PaymentModel;
