// routes/messages.ts
import { Router, Request, Response } from "express";
import ConversationModel from "../models/conversation.model";
import MessageModel from "../models/message.model";
import { Types } from "mongoose";
const router = Router();

// GET /messages/get-messages?conversationID=&limit=&cursor=
router.get("/get-messages", async (req: Request, res: Response) => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { id: userID, role } = (req as any).user ?? {};

        const conversationID = String(req.query.conversationID || "");
        const rawLimit = Number(req.query.limit ?? 50);
        const cursor = (req.query.cursor as string) || null;

        if (!userID) {
            res.status(401).json({ message: "Unauthenticated" });
            return;
        }
        if (!conversationID) {
            res.status(400).json({ message: "conversationID is required" });
            return;
        }

        const limit = Number.isFinite(rawLimit)
            ? Math.min(Math.max(rawLimit, 1), 100)
            : 50;

        const convo = await ConversationModel.findById(conversationID).lean();
        if (!convo) {
            res.status(404).json({ message: "Conversation not found" });
            return;
        }

        // RBAC: admins can read all; users must be participants
        const isParticipant = convo.participants?.some(
            (p) => p.userID === userID
        );
        if (role !== "admin" && !isParticipant) {
            res.status(403).json({ message: "Forbidden" });
            return;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const find: any = { conversationID: String(conversationID) };

        // cursor pagination (ASC): return messages AFTER this _id
        if (cursor) {
            if (!Types.ObjectId.isValid(cursor)) {
                res.status(400).json({ message: "Invalid cursor" });
                return;
            }
            find._id = { $gt: new Types.ObjectId(cursor) };
        }

        const docs = await MessageModel.find(find)
            .sort({ sentAt: 1, _id: 1 })
            .limit(limit + 1)
            .lean();

        const hasMore = docs.length > limit;
        const messages = hasMore ? docs.slice(0, -1) : docs;
        const nextCursor = hasMore
            ? String(messages[messages.length - 1]._id)
            : null;

        res.json({ messages, nextCursor });
    } catch (err) {
        console.error("GET /messages/get-messages error:", err);
        res.status(500).json({ message: "Failed to fetch messages" });
    }
});

router.post("/new-messages", async (req: Request, res: Response) => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { id: senderID, role: senderRole } = (req as any).user ?? {};
        if (!senderID) {
            res.status(401).json({ message: "Unauthenticated" });
            return;
        }

        const { conversationId, text } = req.body as {
            conversationId?: string;
            text?: string;
        };
        if (!conversationId) {
            res.status(400).json({ message: "conversationId required" });
            return;
        }
        if (!text?.trim()) {
            res.status(400).json({ message: "text required" });
            return;
        }

        const convo = await ConversationModel.findById(conversationId);
        if (!convo) {
            res.status(404).json({ message: "Conversation not found" });
            return;
        }

        // MVP permission: users can send only if they are participants; admins can send anywhere
        const isParticipant = convo.participants.some(
            (p) => p.userID === senderID
        );
        if (senderRole !== "admin" && !isParticipant) {
            res.status(403).json({ message: "Forbidden" });
            return;
        }

        const now = new Date();

        const message = await MessageModel.create({
            conversationID: String(conversationId),
            authorID: senderID,
            authorRole: senderRole, // "user" | "admin"
            text: text.trim(),
            sentAt: now,
        });

        // Update conversation preview
        convo.lastMessageAt = now;
        convo.lastMessageText = message.text;
        convo.lastMessageAuthorID = senderID;
        await convo.save();

        // Socket emits
        const io = req.app.get("io");
        io?.to(`conversation:${conversationId}`).emit("message:new", message);

        // Push to admin list (so it moves to top and shows latest preview)
        const user =
            convo.participants.find((p) => p.role === "user") ??
            convo.participants[0];
        io?.to("admin-room").emit("conversation:upsert", {
            _id: String(convo._id),
            userId: user?.userID,
            userName: user?.name,
            userEmail: user?.email,
            userImage: user?.image,
            lastMessageAt: convo.lastMessageAt,
            lastMessageText: convo.lastMessageText ?? "",
            lastMessageAuthorID: convo.lastMessageAuthorID ?? "",
            createdAt: convo.createdAt,
            updatedAt: convo.updatedAt,
        });

        res.status(201).json({ message });
    } catch (e) {
        console.error("POST /messages error:", e);
        res.status(500).json({ message: "Failed to send message" });
    }
});

export const MessageRoute = router;
