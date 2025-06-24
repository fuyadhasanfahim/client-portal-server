import OrderModel from "../models/order.model";

const getOrderByID = async (orderID: string) => {
    try {
        const order = await OrderModel.findOne({ orderID });

        return order;
    } catch (error) {
        throw new Error(
            error instanceof Error ? error.message : "Unknown error"
        );
    }
};

const OrderServices = {
    getOrderByID,
};

export default OrderServices;
