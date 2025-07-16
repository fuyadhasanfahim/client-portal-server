import { model, Schema } from "mongoose";
import { IUser } from "../types/user.interface.js";

const userSchema = new Schema<IUser & Document>(
    {
        userID: { type: String, required: true, unique: true },
        name: { type: String, required: true },
        username: { type: String, required: true, unique: true },
        email: { type: String, required: true, unique: true },
        phone: { type: String, required: true },
        address: String,
        company: String,
        stripeCustomerId: String,

        role: { type: String, enum: ["user", "admin"], default: "user" },
        provider: {
            type: String,
            enum: ["credentials", "google"],
            required: true,
        },
        googleId: String,

        password: {
            type: String,
            required: function () {
                return !this.googleId;
            },
        },
        oldPasswords: [String],

        isEmailVerified: { type: Boolean, default: false },
        emailVerificationToken: String,
        emailVerificationTokenExpiry: Date,
        forgetPasswordToken: String,
        forgetPasswordTokenExpiry: Date,
        isPasswordChanged: { type: Boolean, default: false },
        lastPasswordChange: Date,

        lastLogin: Date,
        image: String,

        isActive: { type: Boolean, default: true },
        isDeleted: { type: Boolean, default: false },
        isBlocked: { type: Boolean, default: false },
    },
    {
        timestamps: true,
    }
);

const UserModel = model<IUser & Document>("User", userSchema);
export default UserModel;
