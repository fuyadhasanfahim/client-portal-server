import { Request, Response } from "express";
import UserServices from "../services/user.service.js";

async function createExistingUser(req: Request, res: Response) {
    try {
        const {
            name,
            username,
            email,
            phone,
            company,
            password,
            provider,
            isExistingUser,
            services,
            address,
        } = req.body;

        if (!name || !email || !username || !address || !password) {
            res.status(400).json({
                success: false,
                message: "Some required fields are missing.",
            });
            return;
        }

        const user = await UserServices.createExistingUserInDB({
            name,
            username,
            email,
            phone,
            company,
            password,
            provider,
            isExistingUser,
            services,
            address,
        });

        res.status(201).json({
            success: true,
            message: "User created successfully!",
            data: user,
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

async function getMe(req: Request, res: Response) {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const userID = (req as any).user?.id as string;

        if (!userID) {
            res.status(401).json({ message: "Unauthorized: Missing user ID" });
            return;
        }

        const user = await UserServices.getMeFromDB(userID);

        res.status(200).json({
            success: true,
            data: user,
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

async function getUserInfo(req: Request, res: Response) {
    try {
        const { userID } = req.params;

        if (!userID) {
            res.status(400).json({
                success: false,
                message: "Something went wrong. Please try again later.",
            });
            return;
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
        const { userID } = req.params;
        const data = req.body;

        if (!userID || !data) {
            res.status(400).json({
                success: false,
                message:
                    "Invalid input. Please provide userID and data to update.",
            });
            return;
        }

        const updatedUser = await UserServices.updateUserInfoInDB(userID, data);

        if (!updatedUser) {
            res.status(404).json({
                success: false,
                message: "User not found.",
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: "Information updated successfully.",
            data: updatedUser,
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
        const { userID } = req.params;
        const { newPassword, currentPassword } = req.body;

        if (!userID || !currentPassword || !newPassword) {
            res.status(400).json({
                success: false,
                message:
                    "Invalid input. Please provide userID and password to update.",
            });
        }

        const updatedUser = await UserServices.updateUserPasswordInDB({
            userID,
            currentPassword,
            newPassword,
        });

        if (!updatedUser) {
            res.status(404).json({
                success: false,
                message: "User not found.",
            });
            return;
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
        const { userID } = req.params;
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

async function getUsers(req: Request, res: Response) {
    try {
        const { role } = req.query as {
            role: string;
        };

        if (!role) {
            res.status(400).json({
                success: false,
                message: "Role is required.",
            });
            return;
        }

        const users = await UserServices.getUsersFromDB(role);

        res.status(200).json({
            success: true,
            users,
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

async function getClients(req: Request, res: Response) {
    try {
        const {
            search = "",
            page = 1,
            limit = 10,
            sortBy = "createdAt",
            sortOrder = "desc",
            userID,
        } = req.query;

        if (!userID) {
            res.status(400).json({
                success: false,
                message: "User ID is required.",
            });
            return;
        }

        const clients = await UserServices.getClientsFromDB({
            userID: userID as string,
            search: search as string,
            page: parseFloat(page as string),
            limit: parseFloat(limit as string),
            sortBy: sortBy as string,
            sortOrder: sortOrder as "asc" | "desc",
        });

        res.status(200).json({
            success: true,
            data: clients,
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
    createExistingUser,
    getMe,
    getUserInfo,
    updateUserInfo,
    updateUserPassword,
    uploadAvatar,
    getUsers,
    getClients,
};

export default UserControllers;
