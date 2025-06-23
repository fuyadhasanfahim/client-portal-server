import UserModel from "../models/user.model";

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

const UserServices = {
    getUserByID,
};

export default UserServices;
