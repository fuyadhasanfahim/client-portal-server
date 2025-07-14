import { Router } from "express";
import UserControllers from "../controllers/user.controller";
import upload from "../middleware/multer";

const router = Router();

router.get("/me", UserControllers.getMe);
router.get("/get-info/:userID", UserControllers.getUserInfo);
router.put("/update-info", UserControllers.updateUserInfo);
router.put("/update-password", UserControllers.updateUserPassword);
router.post(
    "/upload-avatar",
    upload.single("image"),
    UserControllers.uploadAvatar
);
router.get("/get-orders/:userID", UserControllers.getOrdersByUserID);
router.get("/get-users", UserControllers.getUsers);

export const userRoute = router;
