import { Request, Response } from "express";
import { listUserConversations } from "../services/conversation.service.js";

export async function getMyConversations(req: Request, res: Response) {
    try {
        const userID = String(req.query.userID || "");
        if (!userID) {
            res.status(400).json({ message: "userID required" });
            return;
        }

        const limit = Number(req.query.limit) || 20;
        const cursor =
            typeof req.query.cursor === "string" ? req.query.cursor : undefined;

        const page = await listUserConversations(userID, limit, cursor);
        res.json({ ok: true, ...page });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to send invoice",
            error: error instanceof Error ? error.message : "Unknown error",
        });
    }
}
