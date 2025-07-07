import { Router } from "express";
import UserControllers from "../controllers/user.controller";
import upload from "../middleware/multer";

const router = Router();

router.get("/get-info", UserControllers.getUserInfo);
router.put("/update-info", UserControllers.updateUserInfo);
router.put("/update-password", UserControllers.updateUserPassword);
router.post(
    "/upload-avatar",
    upload.single("image"),
    UserControllers.uploadAvatar
);
router.get("/get-orders/:userID", UserControllers.getOrdersByUserID);

export const userRoute = router;
