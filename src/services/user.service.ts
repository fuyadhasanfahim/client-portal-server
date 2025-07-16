/* eslint-disable @typescript-eslint/no-explicit-any */
import cloudinary from "../lib/cloudinary.js";
import { OrderModel } from "../models/order.model.js";
import UserModel from "../models/user.model.js";
import { ISanitizedUser, IUser } from "../types/user.interface.js";
import getSanitizeUserData from "../utils/getSanitizeUserData.js";
import bcrypt from "bcryptjs";

async function getMeFromDB(userID: string) {
    const user = (await UserModel.findOne({
        userID,
    })) as IUser;

    const sanitizeUser = await getSanitizeUserData(user);

    return sanitizeUser;
}

async function getUserInfoFromDB(userID: string) {
    try {
        const isUserExist = await UserModel.findOne({
            userID,
        });

        if (!isUserExist) return null;

        const userData = await getSanitizeUserData(isUserExist);

        return userData;
    } catch (error) {
        throw new Error(
            error instanceof Error
                ? error.message
                : "Something went wrong! Please try again later."
        );
    }
}

async function updateUserInfoInDB(
    userID: string,
    data: Partial<ISanitizedUser>
) {
    try {
        const updatedUser = await UserModel.findOneAndUpdate(
            { userID },
            { $set: data },
            { new: true }
        );

        return updatedUser;
    } catch (error) {
        throw new Error(
            error instanceof Error
                ? error.message
                : "Something went wrong! Please try again later."
        );
    }
}

export async function updateUserPasswordInDB(userID: string, password: string) {
    try {
        const user = await UserModel.findOne({ userID });

        if (!user) return null;

        const allOldPasswords = [user.password, ...(user.oldPasswords || [])];

        for (const oldHashed of allOldPasswords) {
            const isSame = await bcrypt.compare(password, oldHashed);
            if (isSame) {
                throw new Error(
                    "New password must be different from previous passwords."
                );
            }
        }

        const hashedNewPassword = await bcrypt.hash(password, 10);

        user.oldPasswords = [...(user.oldPasswords || []), user.password];
        user.password = hashedNewPassword;

        await user.save();

        return user;
    } catch (error) {
        throw new Error(
            error instanceof Error
                ? error.message
                : "Something went wrong! Please try again later."
        );
    }
}

export async function uploadAvatarInDB(
    userID: string,
    file: Express.Multer.File
) {
    try {
        const user = await UserModel.findOne({ userID });
        if (!user) return null;

        const uploadResult = await new Promise<{ secure_url: string }>(
            (resolve, reject) => {
                cloudinary.uploader
                    .upload_stream(
                        {
                            folder: `client-portal/${user.name}`,
                            public_id: "image",
                            overwrite: true,
                        },
                        (error, result) => {
                            if (error || !result) return reject(error);
                            resolve(result);
                        }
                    )
                    .end(file.buffer);
            }
        );

        user.image = uploadResult.secure_url;
        await user.save();

        return user;
    } catch (error) {
        throw new Error(
            error instanceof Error
                ? error.message
                : "Something went wrong! Please try again later."
        );
    }
}

async function getOrdersByUserIDFromDB({
    userID,
    search,
    page,
    limit,
    sortBy = "createdAt",
    sortOrder = "desc",
}: {
    userID: string;
    search?: string;
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}) {
    try {
        const query: any = { userID };

        if (search) {
            query.$or = [{ orderID: { $regex: search, $options: "i" } }];
        }

        const sort: any = {
            [sortBy]: sortOrder === "asc" ? 1 : -1,
        };

        const skip = (page - 1) * limit;

        const [orders, total] = await Promise.all([
            OrderModel.find(query).sort(sort).skip(skip).limit(limit),
            OrderModel.countDocuments(query),
        ]);

        return {
            orders,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    } catch (error) {
        throw new Error(
            error instanceof Error
                ? error.message
                : "Something went wrong! Please try again later."
        );
    }
}

async function getUsersFromDB(role: string) {
    let users: IUser[];
    if (role === "admin") {
        users = await UserModel.find().sort({
            createdAt: -1,
        });
    } else {
        users = [];
    }

    const sanitized = await Promise.all(
        users.map((user) => getSanitizeUserData(user))
    );

    return sanitized;
}

const UserServices = {
    getMeFromDB,
    getUserInfoFromDB,
    updateUserInfoInDB,
    updateUserPasswordInDB,
    uploadAvatarInDB,
    getOrdersByUserIDFromDB,
    getUsersFromDB,
};

export default UserServices;
