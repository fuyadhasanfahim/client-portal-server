import { Schema, model } from "mongoose";
import {
    IAttachment,
    IMessage,
    IReaction,
} from "../types/message.interface.js";

const attachmentSchema = new Schema<IAttachment>(
    {
        url: { type: String, required: true },
        mimeType: { type: String, required: true },
        name: String,
        sizeBytes: {
            type: Number,
            max: 52_428_800,
        },
        width: Number,
        height: Number,
        durationSec: Number,
        thumbnailUrl: String,
        uploadedAt: { type: Date, required: true },
    },
    { _id: false }
);

const reactionSchema = new Schema<IReaction>(
    {
        emoji: { type: String, required: true },
        userId: { type: String, required: true, index: true },
    },
    { _id: false }
);

const messageSchema = new Schema<IMessage>(
    {
        conversationID: { type: String, required: true, index: true },
        authorId: { type: String, required: true, index: true },

        kind: {
            type: String,
            enum: ["user", "system"],
            default: "user",
            index: true,
        },
        eventType: {
            type: String,
            enum: [
                "agent_joined",
                "agent_assigned",
                "agent_left",
                "conversation_closed",
                "note",
            ],
        },
        eventMeta: { type: Map, of: String },

        text: String,
        sentAt: { type: Date, default: Date.now, index: true },
        status: {
            type: String,
            enum: ["sending", "sent", "delivered", "read", "failed"],
            default: "sending",
            index: true,
        },

        attachments: { type: [attachmentSchema], default: undefined },
        replyToId: String,

        editedAt: Date,
        deletedAt: Date,

        reactions: { type: [reactionSchema], default: undefined },

        readBy: {
            type: Map,
            of: Date,
            default: undefined,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

messageSchema.index({ conversationID: 1, _id: -1 });
messageSchema.index({ conversationID: 1, sentAt: -1 });
messageSchema.index({ authorId: 1, sentAt: -1 });
messageSchema.index({ kind: 1, eventType: 1, sentAt: -1 });

const MessageModel = model<IMessage>("Message", messageSchema);
export default MessageModel;
