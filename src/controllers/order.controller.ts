import { Request, Response } from "express";
import OrderServices from "../services/order.service";

async function newOrder(req: Request, res: Response) {
    try {
        const { orderStage } = req.params;
        const { userID, services, orderID, details, total, payment } = req.body;

        if (!orderStage || !userID) {
            res.status(400).json({
                success: false,
                message: "User id and order stage is required.",
            });
            return;
        }

        const order = await OrderServices.newOrderInDB({
            orderStage,
            userID,
            services,
            orderID,
            details,
            total,
            payment,
        });

        res.status(201).json({
            success: true,
            orderID: order?.orderID as string,
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
}

async function getOrders(req: Request, res: Response) {
    try {
        const {
            userID,
            role,
            search = "",
            page = 1,
            limit = 10,
            sortBy = "createdAt",
            sortOrder = "desc",
            filter,
        } = req.query;

        if (!userID || !role) {
            res.status(400).json({
                success: false,
                message: "User id, and role not found.",
            });
            return;
        }

        const response = await OrderServices.getOrdersFromDB({
            userID: userID as string,
            role: role as string,
            search: search as string,
            page: parseFloat(page as string),
            limit: parseFloat(limit as string),
            sortBy: sortBy as string,
            filter: filter as string,
            sortOrder: sortOrder as "asc" | "desc",
        });

        res.status(200).json({
            success: true,
            data: response,
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
}

async function getOrderByID(req: Request, res: Response) {
    try {
        const { orderID } = req.params;

        if (!orderID) {
            res.status(400).json({
                success: false,
                message: "Order id is required.",
            });
            return;
        }

        const order = await OrderServices.getOrderByIDFromDB(orderID);

        if (!order) {
            res.status(404).json({
                success: false,
                message: "No order found.",
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: order,
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
}

async function updateOrder(req: Request, res: Response) {
    try {
        const { orderID } = req.params;
        const data = req.body;

        if (!orderID || !data) {
            res.status(400).json({
                success: false,
                message: "Order id and data is required.",
            });
            return;
        }

        const updatedOrder = await OrderServices.updateOrderInDB({
            orderID,
            data,
        });

        if (!updatedOrder) {
            res.status(404).json({
                success: false,
                message: "Can't find the order to update.",
            });
            return;
        }

        res.status(200).json({
            success: true,
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
}

const OrderControllers = { getOrders, getOrderByID, newOrder, updateOrder };

export default OrderControllers;
