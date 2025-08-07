import {Router } from "express";
import NotificationControllers from "../controllers/notification.controller";

const router = Router();

router.get("/get-notifications", NotificationControllers.getNotifications);

router.put(
    "/update-notification/:notificationID",
    NotificationControllers.updateNotification
);

export const notificationRoute = router;
