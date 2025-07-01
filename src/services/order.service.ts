import OrderModel from "../models/order.model";

const getOrderByIDFromDB = async (orderID: string) => {
    try {
        const order = await OrderModel.findOne({ orderID });

        return order;
    } catch (error) {
        throw new Error(
            error instanceof Error
                ? error.message
                : "Something went wrong! Please try again later."
        );
    }
};

const getDraftOrderFromDB = async ({
    userID,
    userRole,
    skip,
    limit = 10,
    searchQuery = "",
}: {
    userID: string;
    userRole: string;
    skip: number;
    limit?: number;
    searchQuery?: string;
}) => {
    try {
        const status = ["Awaiting For Payment Details", "Awaiting For Details"];

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let query: any;

        if (userRole === "User") {
            query = {
                userID,
                orderStatus: { $in: status },
            };
        } else {
            query = {
                orderStatus: { $in: status },
            };
        }

        if (searchQuery) {
            query.$or = [
                { "services.name": { $regex: searchQuery, $options: "i" } },
                { status: { $regex: searchQuery, $options: "i" } },
                { orderStatus: { $regex: searchQuery, $options: "i" } },
                { paymentStatus: { $regex: searchQuery, $options: "i" } },
            ];
        }

        const [orders, total] = await Promise.all([
            OrderModel.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            OrderModel.countDocuments(query),
        ]);

        const currentPage = Math.floor(skip / limit) + 1;
        const totalPages = Math.ceil(total / limit);

        return {
            data: orders,
            pagination: {
                total,
                page: currentPage,
                quantity: limit,
                totalPages,
                hasNextPage: currentPage < totalPages,
                hasPreviousPage: currentPage > 1,
            },
        };
    } catch (error) {
        throw new Error(
            error instanceof Error
                ? error.message
                : "Something went wrong! Please try again later."
        );
    }
};

const getAllOrdersFromDB = async ({
    role,
    userID,
    skip,
    limit = 10,
    searchQuery = "",
}: {
    role: string;
    userID: string;
    skip: number;
    limit?: number;
    searchQuery?: string;
}) => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const filter: any = {};

        if (role === "User") {
            filter.userID = userID;
        }

        if (searchQuery) {
            filter.$or = [
                { "services.name": { $regex: searchQuery, $options: "i" } },
                { title: { $regex: searchQuery, $options: "i" } },
                { orderStatus: { $regex: searchQuery, $options: "i" } },
                { paymentStatus: { $regex: searchQuery, $options: "i" } },
            ];
        }

        const [orders, total] = await Promise.all([
            OrderModel.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            OrderModel.countDocuments(filter),
        ]);

        return { orders, total };
    } catch (error) {
        throw new Error(
            error instanceof Error
                ? error.message
                : "Something went wrong! Please try again later."
        );
    }
};

const getAllOrdersByUserIDFromDB = async ({
    userID,
    role,
}: {
    userID: string;
    role: string;
}) => {
    try {
        let orders: (typeof OrderModel)[];

        if (role === "User") {
            orders = await OrderModel.find({
                userID,
            }).sort({
                createdAt: -1,
            });
        } else {
            orders = await OrderModel.find().sort({
                createdAt: -1,
            });
        }

        return orders;
    } catch (error) {
        throw new Error(
            error instanceof Error
                ? error.message
                : "Something went wrong! Please try again later."
        );
    }
};

const OrderServices = {
    getOrderByIDFromDB,
    getDraftOrderFromDB,
    getAllOrdersFromDB,
    getAllOrdersByUserIDFromDB,
};

export default OrderServices;
