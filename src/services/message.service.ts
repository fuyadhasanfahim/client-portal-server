/* eslint-disable @typescript-eslint/no-explicit-any */
import { Types } from "mongoose";
import type { IMessage } from "../types/message.interface.js";
import ConversationModel from "../models/conversation.model.js";
import MessageModel from "../models/message.model.js";

export type SendMessageInput = {
    conversationID: string;
    authorId: string;
    text?: string;
    attachments?: IMessage["attachments"];
    replyToId?: string;
};

export type PaginatedMessages = {
    items: IMessage[];
    nextCursor?: string;
    hasMore: boolean;
};

function oid(id: string) {
    if (!Types.ObjectId.isValid(id))
        throw Object.assign(new Error("Invalid ObjectId"), { status: 400 });
    return new Types.ObjectId(id);
}

async function assertParticipant(conversationID: string, userID: string) {
    const exists = await ConversationModel.exists({
        _id: oid(conversationID),
        "participants.userID": userID,
    });
    if (!exists)
        throw Object.assign(
            new Error("Not a participant of the conversation"),
            { status: 403 }
        );
}

export async function sendMessage(input: SendMessageInput) {
    const { conversationID, authorId, text, attachments, replyToId } = input;

    await assertParticipant(conversationID, authorId);

    const msg = await MessageModel.create({
        conversationID,
        authorId,
        text,
        attachments,
        replyToId,
        status: "sent",
        sentAt: new Date(),
    });

    await ConversationModel.updateOne(
        { _id: oid(conversationID) },
        {
            $set: {
                lastMessageAt: msg.sentAt,
                lastMessageText:
                    text ?? (attachments?.length ? "[attachment]" : ""),
                lastMessageAuthorId: authorId,
            },
            $inc: { unread: 1 },
        }
    );

    return msg.toObject();
}

export async function getMessages(
    conversationID: string,
    limit = 20,
    cursor?: string
): Promise<PaginatedMessages> {
    const exists = await ConversationModel.exists({ _id: oid(conversationID) });
    if (!exists)
        throw Object.assign(new Error("Conversation not found"), {
            status: 404,
        });

    const filter: any = { conversationID };
    if (cursor) filter._id = { $lt: oid(cursor) };

    const docs = await MessageModel.find(filter)
        .sort({ _id: -1 })
        .limit(Math.max(1, Math.min(limit, 100)))
        .lean();

    const items = [...docs].reverse();
    const last = docs[docs.length - 1];
    return {
        items,
        hasMore: !!last,
        nextCursor: last ? String(last._id) : undefined,
    };
}

export async function markReadUpTo(
    conversationID: string,
    userID: string,
    upToMessageId: string
) {
    await assertParticipant(conversationID, userID);

    const res = await MessageModel.updateMany(
        {
            conversationID,
            _id: { $lte: oid(upToMessageId) },
            [`readBy.${userID}`]: { $exists: false },
        },
        { $set: { [`readBy.${userID}`]: new Date() } }
    );

    return { modifiedCount: res.modifiedCount };
}
