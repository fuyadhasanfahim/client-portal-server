import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import envConfig from "../config/env.config";
import { getToken } from "next-auth/jwt";

const { node_env, auth_secret } = envConfig;

interface TokenPayload extends jwt.JwtPayload {
    id: string;
    role: string;
}

export interface AuthenticatedRequest extends Request {
    user?: TokenPayload;
}

export const verifyAuth = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const token = await getToken({
        req,
        secret: auth_secret!,
        secureCookie: node_env === "production",
    });

    if (!token) {
        res.status(401).json({ message: "No token found in cookies" });
    }

    console.log(token);

    try {
        req.user = token as TokenPayload;
        next();
    } catch (err) {
        res.status(401).json({
            message: "Invalid or expired token",
            error: err instanceof Error ? err.message : "Unknown error",
        });
    }
};
