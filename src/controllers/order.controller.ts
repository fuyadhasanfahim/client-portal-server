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

        const data = await OrderServices.getOrderByIDFromDB(orderID);

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

        const { data, pagination } = await OrderServices.getDraftOrderFromDB({
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

const getAllOrders = async (req: Request, res: Response) => {
    try {
        const userID = req.query.userID as string;
        const role = req.query.role as string;
        const limit = parseInt(req.query.limit as string) || 10;
        const page = parseInt(req.query.page as string) || 1;
        const searchQuery = (req.query.search as string) || "";

        if (!role || !userID) {
            res.status(400).json({
                success: false,
                message: "Role and User ID are required",
            });
        }

        const skip = (page - 1) * limit;

        const { orders, total } = await OrderServices.getAllOrdersFromDB({
            role,
            userID,
            skip,
            limit,
            searchQuery: searchQuery as string,
        });

        res.status(200).json({
            success: true,
            data: orders,
            pagination: {
                total,
                quantity: limit,
                page: page,
                totalPages: Math.ceil(total / limit),
            },
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

const getAllOrdersByUserID = async (req: Request, res: Response) => {
    try {
        const userID = req.query.userID as string;
        const role = req.query.role as string;

        if (!userID || !role) {
            res.status(400).json({
                success: false,
                message: "User ID & role is required",
            });
            return;
        }

        const orders = await OrderServices.getAllOrdersByUserIDFromDB({
            userID,
            role,
        });

        res.status(200).json({
            success: true,
            data: orders,
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

const getOrdersByStatus = async (req: Request, res: Response) => {
    try {
        const { userID, role, status } = req.query as {
            userID: string;
            role: string;
            status: string;
        };

        if (!role || !status) {
            res.status(400).json({
                success: false,
                message:
                    "The role and the status are required for fetching the data.",
            });
        }

        const orders = await OrderServices.getOrdersByStatusFromDB({
            userID,
            role,
            status,
        });

        res.status(200).json({
            success: true,
            data: orders,
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

const getOrders = async (req: Request, res: Response) => {
    try {
        const userID = req.query.userID as string;
        const role = req.query.role as string;

        if (!userID || !role) {
            res.status(400).json({
                success: false,
                message:
                    "The user id and role are required for fetching the data.",
            });
            return;
        }

        const orders = await OrderServices.getOrdersFromDB({
            userID,
            role,
        });

        res.status(200).json({
            success: true,
            data: orders,
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
    getAllOrders,
    getAllOrdersByUserID,
    getOrdersByStatus,
    getOrders,
};

export default OrderControllers;
