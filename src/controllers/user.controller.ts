import { Request, Response } from "express";
import UserServices from "../services/user.service";

const getUserById = async (req: Request, res: Response) => {
    try {
        const userID = req.query.user_id as string;

        if (!userID) {
            res.status(400).json({
                success: false,
                message: "User ID is required",
            });
        }

        const data = await UserServices.getUserByID(userID);

        if (!data) {
            res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        res.status(200).json({
            success: true,
            data,
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
};

const UserControllers = {
    getUserById,
};

export default UserControllers;
