import { Request, Response } from "express";
import { io } from "../server.js";
import {
    getMessages,
    markReadUpTo,
    sendMessage,
} from "../services/message.service.js";

export async function postSendMessage(req: Request, res: Response) {
    const { conversationID, authorId, text, attachments, replyToId } =
        req.body ?? {};
    if (!conversationID || !authorId || (!text && !attachments?.length)) {
        res.status(400).json({
            message:
                "conversationID & authorId & (text or attachments) are required",
        });
        return;
    }

    const msg = await sendMessage({
        conversationID,
        authorId,
        text,
        attachments,
        replyToId,
    });

    io?.to(`conversation:${conversationID}`).emit("message:new", msg);

    res.status(201).json({ ok: true, message: msg });
}

export async function getMessagesPage(req: Request, res: Response) {
    const { conversationID } = req.query as { conversationID?: string };
    if (!conversationID) {
        res.status(400).json({ message: "conversationID is required" });
        return;
    }

    const limit = Number(req.query.limit) || 20;
    const cursor =
        typeof req.query.cursor === "string" ? req.query.cursor : undefined;

    const page = await getMessages(conversationID, limit, cursor);
    res.json({ ok: true, ...page });
}

export async function postMarkRead(req: Request, res: Response) {
    const { conversationID } = req.params;
    const { userID, upToMessageId } = req.body ?? {};
    if (!userID || !upToMessageId) {
        res.status(400).json({
            message: "userID and upToMessageId are required",
        });
        return;
    }

    const result = await markReadUpTo(conversationID, userID, upToMessageId);

    io?.to(`conversation:${conversationID}`).emit("message:read", {
        userID,
        upToMessageId,
    });

    res.json({ ok: true, ...result });
}
