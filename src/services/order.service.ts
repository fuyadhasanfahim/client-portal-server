/* eslint-disable @typescript-eslint/no-explicit-any */
import { nanoid } from "nanoid";
import { OrderModel } from "../models/order.model";
import UserModel from "../models/user.model";
import {
    IOrderDetails,
    IOrderServiceSelection,
} from "../types/order.interface";
import { IPayment } from "../types/payment.interface";

export async function newOrderInDB({
    orderStage,
    userID,
    services,
    orderID,
    details,
    total,
    payment,
}: {
    orderStage: string;
    userID?: string;
    services?: IOrderServiceSelection[];
    orderID?: string;
    details?: IOrderDetails;
    total?: number;
    payment?: IPayment;
}) {
    try {
        const user = await UserModel.findOne({ userID });

        if (!user) throw new Error("User not found!");

        let order;

        if (orderStage === "services-selected" && services) {
            order = await OrderModel.create({
                orderID: `WBO${nanoid(10).toUpperCase()}`,
                user: {
                    userID,
                    name: user.name,
                    email: user.email,
                    image: user.image,
                    company: user.company,
                    address: user.address,
                },
                services,
                orderStage,
                paymentStatus: "pending",
                status: "pending",
            });
        }

        if (orderStage === "details-provided" && orderID && details) {
            order = await OrderModel.findOneAndUpdate(
                { orderID },
                {
                    details,
                    orderStage,
                    total,
                },
                { new: true }
            );
        }

        if (orderStage === "details-provided" && orderID && total) {
            order = await OrderModel.findOneAndUpdate(
                { orderID },
                {
                    orderStage,
                    total,
                },
                { new: true }
            );
        }

        // Stage 3: Finalize order with payment
        if (orderStage === "payment-completed" && orderID && payment) {
            order = await OrderModel.findOneAndUpdate(
                { orderID },
                {
                    paymentID: payment.paymentID,
                    paymentStatus:
                        payment.status === "succeeded"
                            ? "paid"
                            : payment.status,
                    status:
                        payment.status === "succeeded"
                            ? "in-progress"
                            : "pending",
                    orderStage,
                },
                { new: true }
            );
        }

        return order;
    } catch (error) {
        throw new Error(
            error instanceof Error
                ? error.message
                : "Something went wrong while processing the order."
        );
    }
}

async function getOrdersFromDB({
    userID,
    role,
    search,
    page,
    limit,
    sortBy = "createdAt",
    sortOrder = "desc",
}: {
    userID: string;
    role: string;
    search?: string;
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}) {
    try {
        const query: any = {};

        if (role === "user") {
            query.userID = userID;
        }

        if (search) {
            query.$or = [{ orderID: { $regex: search, $options: "i" } }];
        }

        const sort: any = {
            [sortBy]: sortOrder === "asc" ? 1 : -1,
        };

        const skip = (page - 1) * limit;

        const [orders, total] = await Promise.all([
            OrderModel.find(query).sort(sort).skip(skip).limit(limit),
            OrderModel.countDocuments(query),
        ]);

        return {
            orders,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    } catch (error) {
        throw new Error(
            error instanceof Error
                ? error.message
                : "Something went wrong! Please try again later."
        );
    }
}

async function getOrderByIDFromDB(orderID: string) {
    try {
        const orders = await OrderModel.findOne({
            orderID,
        });

        return orders;
    } catch (error) {
        throw new Error(
            error instanceof Error
                ? error.message
                : "Something went wrong! Please try again later."
        );
    }
}

const OrderServices = {
    newOrderInDB,
    getOrdersFromDB,
    getOrderByIDFromDB,
};

export default OrderServices;
