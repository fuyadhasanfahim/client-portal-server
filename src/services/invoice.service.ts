import InvoiceModel from "../models/invoice.model";
import { OrderModel } from "../models/order.model";
import UserModel from "../models/user.model";
import { IOrder } from "../types/order.interface";

const sendInvoiceToClientByEmail = async (orderID: string) => {
    try {
        const order = await OrderModel.findOne({ orderID });

        const user = await UserModel.findOne({ userID: order?.user.userID });

        return user;
    } catch (error) {
        throw new Error(
            error instanceof Error
                ? error.message
                : "Something went wrong! Please, try again later."
        );
    }
};

const saveInvoiceIntoDB = async ({
    invoiceID,
    invoiceNo,
    client,
    company,
    orders,
    date,
    taxRate,
    subTotal,
    total,
    createdBy,
}: {
    invoiceID: string;
    invoiceNo?: number;
    client: {
        name: string;
        address: string;
        phone: string;
    };
    company?: {
        name?: string;
        address?: string;
        phone?: string;
    };
    orders: IOrder[];
    date: {
        from: Date;
        to: Date;
        issued: Date;
    };
    taxRate: number;
    subTotal: number;
    total: number;
    createdBy: string;
}) => {
    try {
        const isExistInvoice = await InvoiceModel.findOne({ invoiceID });
        if (isExistInvoice) {
            throw new Error("Invoice ID already exists.");
        }

        const latestInvoice = await InvoiceModel.findOne().sort({
            createdAt: -1,
        });

        const nextInvoiceNo = latestInvoice?.invoiceNo
            ? latestInvoice.invoiceNo + 1
            : 1;

        const newInvoice = await InvoiceModel.create({
            invoiceID,
            invoiceNo: invoiceNo || nextInvoiceNo,
            client,
            company,
            orders,
            date,
            taxRate,
            subTotal,
            total,
            createdBy,
        });

        return newInvoice;
    } catch (error) {
        throw new Error(
            error instanceof Error
                ? error.message
                : "Something went wrong! Please, try again later."
        );
    }
};

const getInvoiceByIdFromDB = async (invoiceID: string) => {
    try {
        const data = await InvoiceModel.findOne({
            invoiceID,
        });

        return data;
    } catch (error) {
        throw new Error(
            error instanceof Error
                ? error.message
                : "Something went wrong! Please, try again later."
        );
    }
};

const InvoiceService = {
    sendInvoiceToClientByEmail,
    saveInvoiceIntoDB,
    getInvoiceByIdFromDB,
};

export default InvoiceService;
