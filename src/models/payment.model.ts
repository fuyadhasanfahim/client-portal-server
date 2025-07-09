import { model, Schema } from "mongoose";
import { IPayment } from "../types/payment.interface";

const paymentSchema = new Schema<IPayment>(
    {
        userID: { type: String, required: true, unique: true },
        orderID: { type: String, required: true },
        paymentOption: { type: String, required: true },
        paymentIntentID: { type: String },
        customerID: { type: String },
        amount: { type: Number, required: true },
        currency: { type: String, required: true },
        tax: { type: Number, required: true },
        totalAmount: { type: Number, required: true },
        status: {
            type: String,
            enum: ["pending", "succeeded", "failed", "refunded"],
            default: "pending",
        },
    },
    { timestamps: true }
);

export const PaymentModel = model<IPayment>("Payment", paymentSchema);
