import { Router } from "express";
import UserControllers from "../controllers/user.controller";

const router = Router();

router.get("/get-user-by-id", UserControllers.getUserById);

export const userRoute = router;
