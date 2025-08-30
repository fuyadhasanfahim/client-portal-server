// routes/conversations.ts
import { Router, Request, Response } from "express";
import ConversationModel from "../models/conversation.model";
const router = Router();

router.get("/get-conversations", async (req: Request, res: Response) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { role } = (req as any).user ?? {};

    if (role !== "admin") {
        res.status(403).json({ message: "Forbidden" });
        return;
    }

    const limit = Math.min(Number(req.query.limit ?? 50), 200);

    const convos = await ConversationModel.find({})
        .sort({ lastMessageAt: -1 })
        .limit(limit)
        .lean();

    // Normalize to a compact shape for the sidebar
    const items = convos.map((c) => {
        const u =
            c.participants.find((p) => p.role === "user") ?? c.participants[0];
        return {
            _id: String(c._id),
            userId: u?.userID,
            userName: u?.name,
            userEmail: u?.email,
            userImage: u?.image,
            lastMessageAt: c.lastMessageAt,
            lastMessageText: c.lastMessageText ?? "",
            lastMessageAuthorID: c.lastMessageAuthorID ?? "",
            createdAt: c.createdAt,
            updatedAt: c.updatedAt,
        };
    });

    res.json({ items });
});

export const ConversationRoutes = router;
