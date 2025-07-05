import { Request, Response } from "express";
import UserServices from "../services/user.service";
import { ISanitizedUser } from "../types/user.interface";

async function getUserInfo(req: Request, res: Response) {
    try {
        const { userID } = req.body;

        if (!userID) {
            res.status(400).json({
                success: false,
                message: "Something went wrong. Please try again later.",
            });
        }

        const userData = await UserServices.getUserInfoFromDB(userID);

        res.status(200).json({
            success: true,
            data: userData,
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

async function updateUserInfo(req: Request, res: Response) {
    try {
        const { userID, data } = req.body as {
            userID: string;
            data: Partial<ISanitizedUser>;
        };

        if (!userID || !data || Object.keys(data).length === 0) {
            res.status(400).json({
                success: false,
                message:
                    "Invalid input. Please provide userID and data to update.",
            });
        }

        const updatedUser = await UserServices.updateUserInfoInDB(userID, data);

        if (!updatedUser) {
            res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        res.status(200).json({
            success: true,
            message: "Information updated successfully.",
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

async function updateUserPassword(req: Request, res: Response) {
    try {
        const { userID, password } = req.body;

        if (!userID || !password) {
            res.status(400).json({
                success: false,
                message:
                    "Invalid input. Please provide userID and password to update.",
            });
        }

        const updatedUser = await UserServices.updateUserPasswordInDB(
            userID,
            password
        );

        if (!updatedUser) {
            res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        res.status(200).json({
            success: true,
            message: "Password updated successfully.",
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

async function uploadAvatar(req: Request, res: Response) {
    try {
        const { userID } = req.body;
        const file = req.file;

        if (!userID || !file) {
            res.status(400).json({
                success: false,
                message: "Please provide userID and avatar image file.",
            });
            return;
        }

        const updatedUser = await UserServices.uploadAvatarInDB(userID, file);

        if (!updatedUser) {
            res.status(404).json({
                success: false,
                message: "User not found.",
            });
        }

        res.status(200).json({
            success: true,
            message: "Avatar uploaded successfully.",
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

const UserControllers = {
    getUserInfo,
    updateUserInfo,
    updateUserPassword,
    uploadAvatar,
};

export default UserControllers;
