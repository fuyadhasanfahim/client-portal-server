/* eslint-disable @typescript-eslint/no-explicit-any */
import { nanoid } from "nanoid";
import { OrderModel } from "../models/order.model.js";
import UserModel from "../models/user.model.js";
import {
    IOrder,
    IOrderDetails,
    IOrderServiceSelection,
} from "../types/order.interface.js";
import { IPayment } from "../types/payment.interface.js";

async function newOrderInDB({
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
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
    filter,
}: {
    userID: string;
    role: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    filter?: string;
    sortOrder?: "asc" | "desc";
}) {
    const query: any = {
        orderStage: "payment-completed",
    };

    if (role === "user") {
        query["user.userID"] = userID;
    }

    if (search) {
        query.$or = [
            { orderID: { $regex: search, $options: "i" } },
            { "user.name": { $regex: search, $options: "i" } },
            { "user.email": { $regex: search, $options: "i" } },
        ];
    }

    if (filter && filter !== "all") {
        query.status = filter;
    }

    const sort: any = {
        [sortBy]: sortOrder === "asc" ? 1 : -1,
    };

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
        OrderModel.find(query).sort(sort).skip(skip).limit(limit).lean(),
        OrderModel.countDocuments(query),
    ]);

    return {
        orders,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
}

async function getDraftOrdersFromDB({
    userID,
    role,
    search,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
    filter,
}: {
    userID: string;
    role: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    filter?: string;
    sortOrder?: "asc" | "desc";
}) {
    const query: any = {
        orderStage: { $ne: "payment-completed" },
    };

    if (role === "user") {
        query["user.userID"] = userID;
    }

    if (search) {
        query.$or = [
            { orderID: { $regex: search, $options: "i" } },
            { "user.name": { $regex: search, $options: "i" } },
            { "user.email": { $regex: search, $options: "i" } },
        ];
    }

    if (filter && filter !== "all") {
        query.status = filter;
    }

    const sort: any = {
        [sortBy]: sortOrder === "asc" ? 1 : -1,
    };

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
        OrderModel.find(query).sort(sort).skip(skip).limit(limit).lean(),
        OrderModel.countDocuments(query),
    ]);

    return {
        orders,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
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

async function updateOrderInDB({
    orderID,
    data,
}: {
    orderID: string;
    data: Partial<IOrder>;
}) {
    const updatedOrder = await OrderModel.findOneAndUpdate({ orderID }, data, {
        new: true,
    });

    if (!updatedOrder) throw new Error("Order not found");

    return updatedOrder;
}

async function deliverOrderToClient({ orderID }: { orderID: string }) {
    const order = await OrderModel.findOneAndUpdate(
        { orderID },
        { status: "delivered" },
        { new: true }
    );

    return order;
}

async function reviewOrderToAdmin({ orderID }: { orderID: string }) {
    const order = await OrderModel.findOneAndUpdate(
        { orderID },
        { status: "in-revision" },
        { new: true }
    );

    return order;
}

async function completeOrderInDB({ orderID }: { orderID: string }) {
    const order = await OrderModel.findOneAndUpdate(
        { orderID },
        { status: "completed" },
        { new: true }
    );

    return order;
}

async function getOrdersByStatusFromDB({
    userID,
    role,
    status,
}: {
    userID: string;
    role: string;
    status: string;
}) {
    let orders;

    if (role === "user") {
        orders = await OrderModel.find({
            "user.userID": userID,
            status,
        });
    } else {
        orders = await OrderModel.find({
            status,
        });
    }

    return orders;
}

async function getOrdersByUserIDFromDB({
    userID,
    search,
    page = 1,
    limit = 10,
    filter,
    sort,
}: {
    userID: string;
    search?: string;
    page?: number;
    limit?: number;
    filter?: string;
    sort?: string;
}) {
    const user = await UserModel.findOne({ userID });

    if (!user) throw new Error("User not found");

    const query: any = {
        "user.userID": userID,
        orderStage: "payment-completed",
    };

    if (search) {
        query.$or = [
            { orderID: { $regex: search, $options: "i" } },
            { "user.name": { $regex: search, $options: "i" } },
            { "user.email": { $regex: search, $options: "i" } },
        ];
    }

    if (filter && filter !== "all") {
        query.status = filter;
    }

    const sortOptions: any = {
        createdAt: -1,
    };

    if (sort) {
        const [field, order] = sort.split(":");
        sortOptions[field] = order === "asc" ? 1 : -1;
    }

    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
        OrderModel.find(query).sort(sortOptions).skip(skip).limit(limit).lean(),
        OrderModel.countDocuments(query),
    ]);

    return {
        orders,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
}

const OrderServices = {
    newOrderInDB,
    getOrdersFromDB,
    getDraftOrdersFromDB,
    getOrderByIDFromDB,
    updateOrderInDB,
    deliverOrderToClient,
    reviewOrderToAdmin,
    completeOrderInDB,
    getOrdersByStatusFromDB,
    getOrdersByUserIDFromDB,
};

export default OrderServices;
