// controllers/order.controller.ts
import { Request, Response } from "express";
import OrderServices from "../services/order.service.js";
import { sendEmail } from "../lib/nodemailer.js";
import { deliveryEmail } from "../html-templates/deliveryEmail.js";
import envConfig from "../config/env.config.js";
import {
    getAdminRevisionEmail,
    getCustomerRevisionEmail,
} from "../html-templates/getRevisionRequestEmail.js";
import { getOrderCompletionEmail } from "../html-templates/getOrderCompletionEmail.js";
import { sendNotification } from "../utils/sendNotification.js";
import { io } from "../server.js";

async function newOrder(req: Request, res: Response) {
    try {
        const { orderStage } = req.params;
        const { userID, services, orderID, details, total, payment } =
            req.body ?? {};

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
            page: Number(page),
            limit: Number(limit),
            sortBy: sortBy as string,
            filter: filter as string,
            sortOrder: sortOrder as "asc" | "desc",
        });

        res.status(200).json({ success: true, data: response });
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

async function getDraftOrders(req: Request, res: Response) {
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

        const response = await OrderServices.getDraftOrdersFromDB({
            userID: userID as string,
            role: role as string,
            search: search as string,
            page: Number(page),
            limit: Number(limit),
            sortBy: sortBy as string,
            filter: filter as string,
            sortOrder: sortOrder as "asc" | "desc",
        });

        res.status(200).json({ success: true, data: response });
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

        res.status(200).json({ success: true, data: order });
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

        if (updatedOrder.status === "in-progress") {
            await sendNotification({
                userID: updatedOrder.user.userID,
                title: `🎁 Order #${orderID} Accepted`,
                message: `Hi ${updatedOrder.user.name}, your order has been Accepted. Click to view the details.`,
                link: `${envConfig.frontend_url}/orders/details/${orderID}`,
            });
        } else {
            await sendNotification({
                userID: updatedOrder.user.userID,
                title: `Order #${orderID} Canceled`,
                message: `Hi ${updatedOrder.user.name}, your order has been Canceled. Click to view the details.`,
                link: `${envConfig.frontend_url}/orders/details/${orderID}`,
            });
        }

        io.to(orderID).emit("order-updated");

        res.status(200).json({ success: true });
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

        await sendNotification({
            userID: order.user.userID,
            title: `🎁 Order #${orderID} Delivered`,
            message: `Hi ${order.user.name}, your order has been successfully delivered. Click to view the details.`,
            link: `${envConfig.frontend_url}/orders/details/${orderID}`,
        });

        io.to(orderID).emit("order-updated");

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
        const { orderID, instructions } = req.body as {
            orderID?: string;
            instructions?: string;
        };

        if (!orderID || !instructions?.trim()) {
            res.status(400).json({
                success: false,
                message: "Order ID and instructions are required.",
            });
            return;
        }

        const result = await OrderServices.reviewOrderToAdmin({
            orderID,
            instructions,
        });

        if (!result) {
            res.status(404).json({
                success: false,
                message: "Order not found or already in revision.",
            });
            return;
        }

        const { order, revision } = result;

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

        await sendNotification({
            isAdmin: true,
            title: `🔁 Revision Requested on Order #${orderID}`,
            message: `A customer has submitted a revision request for order #${orderID}.`,
            link: `${envConfig.frontend_url}/orders/details/${orderID}`,
        });

        io.to(orderID).emit("revision-updated");
        io.to(orderID).emit("order-updated");

        res.status(200).json({
            success: true,
            message: "Revision request submitted successfully.",
            revision,
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
} // 👈 this closing brace was missing

async function getRevision(req: Request, res: Response) {
    try {
        const orderID = String(req.params.orderID ?? "").trim();
        if (!orderID) {
            res.status(400).json({
                success: false,
                message: "Order ID is required.",
            });
            return;
        }

        const revision = await OrderServices.getRevisionByOrderID(orderID);
        res.status(200).json({ success: true, revision });
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
        const { orderID } = req.body as { orderID?: string };
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

        await sendNotification({
            isAdmin: true,
            title: `✅ Order #${orderID} Marked Completed`,
            message: `The order has been marked as completed. Review or archive if needed.`,
            link: `${envConfig.frontend_url}/orders/details/${orderID}`,
        });

        io.to(orderID).emit("order-updated");
        io.to(orderID).emit("revision-updated");

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
        const { userID, role } = req.query as { userID: string; role: string };

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

        res.status(200).json({ success: true, data: orders });
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

async function getOrdersByUserID(req: Request, res: Response) {
    try {
        const {
            userID,
            search = "",
            page = 1,
            limit = 10,
            filter,
            sort,
        } = req.query;

        if (!userID) {
            res.status(400).json({
                success: false,
                message: "User ID is required.",
            });
            return;
        }

        const { orders, pagination } =
            await OrderServices.getOrdersByUserIDFromDB({
                userID: userID as string,
                search: search as string,
                page: Number(page),
                limit: Number(limit),
                filter: filter as string,
                sort: sort as string,
            });

        if (!orders || orders.length === 0) {
            res.status(404).json({
                success: false,
                message: "No orders found for this user.",
            });
            return;
        }

        res.status(200).json({ success: true, data: { orders, pagination } });
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
    getDraftOrders,
    getOrderByID,
    newOrder,
    updateOrder,
    deliverOrder,
    reviewOrder,
    getRevision,
    completeOrder,
    getOrdersByStatus,
    getOrdersByUserID,
};

export default OrderControllers;
