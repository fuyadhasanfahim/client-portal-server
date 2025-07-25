import { model, Schema } from "mongoose";
import { IPayment } from "../types/payment.interface.js";

const paymentSchema = new Schema<IPayment>(
    {
        paymentID: { type: String, required: true, unique: true },
        userID: { type: String, required: true },
        orderID: { type: String, required: true },
        paymentOption: { type: String, required: true },
        paymentMethod: { type: String },
        paymentIntentID: { type: String },
        paymentMethodID: { type: String },
        customerID: { type: String },
        amount: { type: Number, required: true },
        currency: { type: String },
        tax: { type: Number },
        totalAmount: { type: Number },
        status: {
            type: String,
            enum: ["pending", "succeeded", "paid", "failed", "refunded"],
            default: "pending",
        },
    },
    { timestamps: true }
);

export const PaymentModel = model<IPayment>("Payment", paymentSchema);
