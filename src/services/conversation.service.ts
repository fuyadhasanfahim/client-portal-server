import { Types } from "mongoose";
import ConversationModel from "../models/conversation.model.js";

export async function listUserConversations(
    userID: string,
    limit = 20,
    cursor?: string
) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = { "participants.userID": userID };
    if (cursor) filter._id = { $lt: new Types.ObjectId(cursor) };

    const rows = await ConversationModel.find(filter)
        .sort({ _id: -1 })
        .limit(Math.max(1, Math.min(limit, 100)))
        .lean();

    const last = rows[rows.length - 1];
    return {
        items: rows,
        hasMore: !!last,
        nextCursor: last ? String(last._id) : undefined,
    };
}
