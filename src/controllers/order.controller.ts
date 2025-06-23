import { Request, Response } from "express";
import OrderServices from "../services/order.service";

const getOrderByID = async (req: Request, res: Response) => {
    try {
        const orderID = req.query.order_id as string;

        if (!orderID) {
            res.status(400).json({
                success: false,
                message: "Order ID is required",
            });
        }

        const data = await OrderServices.getOrderByID(orderID);

        if (!data) {
            res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        res.status(200).json({
            success: true,
            data,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "An error occurred while processing your request",
            error:
                error instanceof Error
                    ? error.message
                    : "Something went wrong! Please try again later.",
        });
    }
};

const OrderControllers = {
    getOrderByID,
};

export default OrderControllers;
