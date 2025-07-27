/* eslint-disable @typescript-eslint/no-explicit-any */
import { nanoid } from "nanoid";
import cloudinary from "../lib/cloudinary.js";
import UserModel from "../models/user.model.js";
import { ISanitizedUser, IUser } from "../types/user.interface.js";
import getSanitizeUserData from "../utils/getSanitizeUserData.js";
import bcrypt from "bcryptjs";

async function createExistingUserInDB({
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
}: Partial<IUser>) {
    const existingUser = await UserModel.findOne({ email });

    if (existingUser) {
        throw new Error("A user with this email already exists.");
    }

    const hashedPassword = await bcrypt.hash(password!, 12);

    const user = new UserModel({
        userID: `WBU${nanoid(10).toUpperCase()}`,
        name,
        username,
        email,
        phone,
        company,
        address,
        provider,
        password: hashedPassword,
        isExistingUser: !!isExistingUser,
        services,
        isEmailVerified: false,
    });

    await user.save();

    return user;
}

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

export async function updateUserPasswordInDB({
    userID,
    currentPassword,
    newPassword,
}: {
    userID: string;
    currentPassword: string;
    newPassword: string;
}) {
    try {
        const user = await UserModel.findOne({ userID });

        if (!user) {
            throw new Error("User not found.");
        }

        const isPasswordValid = await bcrypt.compare(
            currentPassword,
            user.password
        );

        if (!isPasswordValid) {
            throw new Error("The current password you entered is incorrect.");
        }

        const allOldPasswords = [user.password, ...(user.oldPasswords || [])];

        for (const oldHashed of allOldPasswords) {
            const isSame = await bcrypt.compare(newPassword, oldHashed);
            if (isSame) {
                throw new Error(
                    "New password must be different from previous passwords."
                );
            }
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 12);

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
                            folder: `client-portal/avatar/${user.userID}`,
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

async function getClientsFromDB({
    userID,
    search = "",
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "desc",
}: {
    userID: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}) {
    const user = await UserModel.findOne({ userID });

    if (!user) {
        throw new Error("User not found.");
    }

    const query: any = {};

    if (search) {
        query.$or = [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { userID: { $regex: search, $options: "i" } },
        ];
    }

    const sort: any = {
        [sortBy]: sortOrder === "asc" ? 1 : -1,
    };

    const skip = (page - 1) * limit;

    const [clients, total] = await Promise.all([
        UserModel.find(query).sort(sort).skip(skip).limit(limit),
        UserModel.countDocuments(query),
    ]);

    const sanitizedClients = await Promise.all(
        clients.map((client) => getSanitizeUserData(client))
    );

    return {
        clients: sanitizedClients,
        total,
        page,
        totalPages: Math.ceil(total / limit),
    };
}

const UserServices = {
    createExistingUserInDB,
    getMeFromDB,
    getUserInfoFromDB,
    updateUserInfoInDB,
    updateUserPasswordInDB,
    uploadAvatarInDB,
    getUsersFromDB,
    getClientsFromDB,
};

export default UserServices;
