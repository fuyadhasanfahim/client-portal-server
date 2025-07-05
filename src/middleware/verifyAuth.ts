import { Request, Response, NextFunction } from "express";
import { getToken } from "next-auth/jwt";
import envConfig from "../config/env.config";

const { auth_secret } = envConfig;

export const verifyAuth = async (
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const token = await getToken({ req, secret: auth_secret, raw: true });

    if (!token) {
        res.status(401).json({
            success: false,
            message: "Unauthorized! No valid token found",
        });
    }

    try {
        const decoded = await getToken({ req, secret: auth_secret });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (req as any).user = decoded;

        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: "Invalid token",
            errorMessage: (error as Error).message,
        });
    }
};
