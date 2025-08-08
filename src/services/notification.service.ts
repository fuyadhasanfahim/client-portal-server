import NotificationModel from "../models/notification.model.js";
import UserModel from "../models/user.model.js";

async function getNotificationsFromDB(userID: string) {
    const user = await UserModel.findOne({ userID });

    if (!user) {
        throw new Error("User not found");
    }

    let notifications;

    if (user.role === "admin") {
        notifications = await NotificationModel.find({
            userID,
        })
            .sort({ createdAt: -1 })
            .limit(50);
    } else {
        notifications = await NotificationModel.find({ userID })
            .sort({ createdAt: -1 })
            .limit(50);
    }

    return notifications;
}

async function updateNotificationInDB(notificationID: string) {
    const notification = await NotificationModel.findById(notificationID);

    if (!notification) {
        throw new Error("No notification found to update.");
    }

    notification.read = true;
    notification.save();

    return notification;
}

const NotificationServices = {
    getNotificationsFromDB,
    updateNotificationInDB,
};
export default NotificationServices;
