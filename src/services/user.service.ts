import UserModel from "../models/user.model";
import IUser from "../types/user.interface";

const getUserByID = async (userID: string) => {
    try {
        const user = await UserModel.findOne({
            userID,
        });

        return user;
    } catch (error) {
        throw new Error(
            error instanceof Error
                ? error.message
                : "Something went wrong! Please try again later."
        );
    }
};

const updateUserInfoIntoDB = async (userID: string, data: IUser) => {
    try {
        const updatedUser = await UserModel.findOneAndUpdate(
            { userID },
            { $set: { ...data } },
            {
                new: true,
            }
        );

        return updatedUser;
    } catch (error) {
        throw new Error(
            error instanceof Error
                ? error.message
                : "Something went wrong! Please try again later."
        );
    }
};

const UserServices = {
    getUserByID,
    updateUserInfoIntoDB,
};

export default UserServices;
