import cloudinary from "../lib/cloudinary";
import UserModel from "../models/user.model";
import { ISanitizedUser } from "../types/user.interface";
import getSanitizeUserData from "../utils/getSanitizeUserData";
import bcrypt from "bcryptjs";

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

const UserServices = {
    getUserInfoFromDB,
    updateUserInfoInDB,
    updateUserPasswordInDB,
    uploadAvatarInDB,
};

export default UserServices;
