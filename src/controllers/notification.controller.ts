import { Request, Response } from "express";
import NotificationServices from "../services/notification.service.js";

async function getNotifications(req: Request, res: Response) {
    try {
        const { userID } = req.query;

        if (!userID) {
            res.status(400).json({
                success: false,
                message: "User ID is required",
            });
            return;
        }

        const notifications = await NotificationServices.getNotificationsFromDB(
            userID as string
        );

        res.status(200).json({
            success: true,
            notifications,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Internal Server Error",
        });
    }
}

async function updateNotification(req: Request, res: Response) {
    try {
        const { notificationID } = req.params;

        if (!notificationID) {
            res.status(400).json({
                success: false,
                message: "The notification id is required.",
            });
            return;
        }

        await NotificationServices.updateNotificationInDB(notificationID);

        res.status(200).json({
            success: true,
            message: "Notification updated successfully.",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Internal Server Error",
        });
    }
}

const NotificationControllers = { getNotifications, updateNotification };
export default NotificationControllers;
