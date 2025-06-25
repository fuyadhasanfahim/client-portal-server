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

const getDraftOrder = async (req: Request, res: Response) => {
    try {
        const userID = req.query.user_id as string;
        const userRole = req.query.user_role as string;
        const limit = parseInt(req.query.limit as string) || 10;
        const page = parseInt(req.query.page as string) || 1;
        const searchQuery = (req.query.search as string) || "";

        if (!userID || !userRole) {
            res.status(400).json({
                success: false,
                message: "User ID and role is required",
            });
        }

        const skip = (page - 1) * limit;

        const { data, pagination } = await OrderServices.getDraftOrder({
            userID,
            userRole,
            skip,
            limit,
            searchQuery,
        });

        res.status(200).json({
            success: true,
            message: "Draft orders fetched successfully",
            data,
            pagination,
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
    getDraftOrder,
};

export default OrderControllers;
