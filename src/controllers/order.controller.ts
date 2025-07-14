import { Request, Response } from "express";
import OrderServices from "../services/order.service";
import { sendEmail } from "../lib/nodemailer";
import { deliveryEmail } from "../html-templates/deliveryEmail";
import envConfig from "../config/env.config";
import {
    getAdminRevisionEmail,
    getCustomerRevisionEmail,
} from "../html-templates/getRevisionRequestEmail";
import { getOrderCompletionEmail } from "../html-templates/getOrderCompletionEmail";

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

async function deliverOrder(req: Request, res: Response) {
    try {
        const { orderID, downloadLink } = req.body;

        if (!orderID || !downloadLink) {
            res.status(400).json({
                success: false,
                message:
                    "Order ID, and download link information are all required.",
            });
            return;
        }

        const order = await OrderServices.deliverOrderToClient({ orderID });

        if (!order) {
            res.status(404).json({
                success: false,
                message: "Order not found",
            });
            return;
        }

        await sendEmail({
            to: order.user.email,
            from: envConfig.email_user!,
            subject: `Your Order #${orderID} Has Been Delivered!`,
            html: deliveryEmail(orderID, downloadLink),
        });

        res.status(200).json({
            success: true,
            message: "Order delivered successfully and customer notified.",
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

async function reviewOrder(req: Request, res: Response) {
    try {
        const { orderID, instructions } = req.body;

        if (!orderID || !instructions) {
            res.status(400).json({
                success: false,
                message: "Order ID and instructions are required.",
            });
            return;
        }

        const order = await OrderServices.reviewOrderToAdmin({
            orderID,
        });

        if (!order) {
            res.status(404).json({
                success: false,
                message: "Order not found",
            });
            return;
        }

        await sendEmail({
            to: order.user.email,
            from: envConfig.email_user!,
            subject: `Revision Request Submitted for Order #${orderID}`,
            html: getCustomerRevisionEmail(orderID, order.user.name),
        });

        await sendEmail({
            to: envConfig.email_user!,
            from: order.user.email,
            subject: `[ACTION REQUIRED] Revision Request for Order #${orderID}`,
            html: getAdminRevisionEmail(
                orderID,
                order.user.name,
                order.user.email,
                instructions
            ),
        });

        res.status(200).json({
            success: true,
            message: "Revision request submitted successfully.",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "An error occurred while processing your request",
            error:
                error instanceof Error
                    ? error.message
                    : "Internal server error",
        });
    }
}

async function completeOrder(req: Request, res: Response) {
    try {
        const { orderID } = req.body;

        if (!orderID) {
            res.status(400).json({
                success: false,
                message: "Order ID is required.",
            });
            return;
        }

        const order = await OrderServices.completeOrderInDB({ orderID });

        if (!order) {
            res.status(404).json({
                success: false,
                message: "Order not found",
            });
            return;
        }

        await sendEmail({
            to: order.user.email,
            from: envConfig.email_user!,
            subject: `Order #${orderID} Completed!`,
            html: getOrderCompletionEmail(orderID, order.user.name),
        });

        res.status(200).json({
            success: true,
            message: "Order marked as completed successfully.",
            data: order,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "An error occurred while processing your request",
            error:
                error instanceof Error
                    ? error.message
                    : "Internal server error",
        });
    }
}

async function getOrdersByStatus(req: Request, res: Response) {
    try {
        const { status } = req.params;
        const { userID, role } = req.query as {
            userID: string;
            role: string;
        };

        if (!status || !userID || !role) {
            res.status(400).json({
                success: false,
                message: "User id, status, and role is required.",
            });
            return;
        }

        const orders = await OrderServices.getOrdersByStatusFromDB({
            userID,
            role,
            status,
        });

        if (!orders) {
            res.status(404).json({
                success: false,
                message: "No order found.",
            });
            return;
        }

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
                    : "Internal server error",
        });
    }
}

const OrderControllers = {
    getOrders,
    getOrderByID,
    newOrder,
    updateOrder,
    deliverOrder,
    reviewOrder,
    completeOrder,
    getOrdersByStatus,
};

export default OrderControllers;
