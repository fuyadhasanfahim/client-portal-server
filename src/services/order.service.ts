import OrderModel from "../models/order.model";

const getOrderByID = async (orderID: string) => {
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

const getDraftOrder = async ({
    userID,
    userRole,
    skip = 0,
    limit = 10,
    searchQuery = "",
}: {
    userID: string;
    userRole: string;
    skip?: number;
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

const OrderServices = {
    getOrderByID,
    getDraftOrder,
};

export default OrderServices;
