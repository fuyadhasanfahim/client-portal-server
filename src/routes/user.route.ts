import { Router } from "express";
import UserControllers from "../controllers/user.controller";

const router = Router();

router.get("/get-user-by-id", UserControllers.getUserById);

router.put("/update-user-info", UserControllers.updateUserInfo);

export const userRoute = router;
