import { ISanitizedUser, IUser } from "../types/user.interface";

export default async function getSanitizeUserData(
    user: IUser
): Promise<ISanitizedUser> {
    const {
        userID,
        name,
        username,
        email,
        phone,
        address,
        company,
        role,
        isEmailVerified,
        lastLogin,
        image,
        updatedAt,
        createdAt,
        provider,
    } = user;

    return {
        userID,
        name,
        username,
        email,
        phone,
        address,
        company,
        role,
        isEmailVerified,
        lastLogin,
        image,
        updatedAt,
        createdAt,
        provider,
    };
}
