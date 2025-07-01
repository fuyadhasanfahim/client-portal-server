import { Schema, model } from "mongoose";
import { orderSchema } from "./order.model";
import { IInvoice } from "../types/invoice.interface";

const InvoiceSchema = new Schema<IInvoice>(
    {
        invoiceID: {
            type: String,
            unique: true,
        },
        invoiceNo: { type: Number, required: true },
        client: {
            name: { type: String, required: true },
            address: String,
            phone: String,
        },
        company: {
            name: { type: String, default: "WebBriks" },
            address: String,
            phone: String,
        },
        orders: [orderSchema],
        date: {
            from: { type: Date, required: true },
            to: { type: Date, required: true },
            issued: { type: Date, required: true },
        },
        taxRate: { type: Number, default: 0 },
        subTotal: { type: Number, required: true },
        total: { type: Number, required: true },
        createdBy: {
            type: String,
            ref: "User",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

const InvoiceModel = model<IInvoice>("Invoice", InvoiceSchema);
export default InvoiceModel;
