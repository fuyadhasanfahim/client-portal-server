/* eslint-disable @typescript-eslint/no-explicit-any */
import OrderModel from "../models/order.model";

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
    getOrdersFromDB,
    getOrderByIDFromDB,
};

export default OrderServices;
