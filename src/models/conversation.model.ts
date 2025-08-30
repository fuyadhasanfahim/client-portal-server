import { model, Schema } from "mongoose";
import {
    IConversation,
    IParticipant,
} from "../types/conversation.interface.js";

const participantSchema = new Schema<IParticipant>(
    {
        userID: { type: String, required: true },
        name: { type: String, required: true },
        email: { type: String, required: true },
        image: String,
        role: { type: String, enum: ["user", "admin"], required: true },
        isOnline: { type: Boolean, required: true },
        lastSeenAt: Date,
        lastReadAt: Date,
    },
    { _id: false }
);

const conversationSchema = new Schema<IConversation>(
    {
        participants: { type: [participantSchema], required: true },

        type: {
            type: String,
            enum: ["support", "internal"],
            default: "support",
            index: true,
        },
        status: {
            type: String,
            enum: ["pending", "active", "waiting", "resolved", "closed"],
            default: "pending",
            index: true,
        },

        lastMessageAt: {
            type: Date,
            required: true,
            default: () => new Date(),
        },
        lastMessageText: String,
        lastMessageAuthorId: String,
        unread: Number,

        createdByUserId: { type: String, required: true },
        assignedAgentId: { type: String, default: null, index: true },

        tags: { type: [String], default: undefined },
        slaDueAt: Date,
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

conversationSchema.index({ type: 1, status: 1, lastMessageAt: -1 });
conversationSchema.index({ "participants.userID": 1, lastMessageAt: -1 });

conversationSchema.index(
    { createdByUserId: 1, type: 1, status: 1 },
    {
        unique: true,
        partialFilterExpression: {
            type: "support",
            status: { $in: ["pending", "active", "waiting"] },
        },
    }
);

const ConversationModel = model<IConversation>(
    "Conversation",
    conversationSchema
);
export default ConversationModel;
