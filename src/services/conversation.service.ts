import { FilterQuery } from "mongoose";
import UserModel from "../models/user.model.js";
import { IConversation } from "../types/conversation.interface.js";
import ConversationModel from "../models/conversation.model.js";

async function getConversationsFromDB({
    userID,
    search,
}: {
    userID: string;
    search?: string;
}) {
    const user = await UserModel.findOne({
        userID,
    });

    if (!user) {
        throw new Error("User not found with this user id.");
    }

    if (user.role !== "admin") {
        throw new Error("Access forbidden.");
    }

    const query: FilterQuery<IConversation> = {};

    if (search) {
        query.$or = [
            { "user.name": { $regex: search, $options: "i" } },
            { "user.email": { $regex: search, $options: "i" } },
            { lastMessageText: { $regex: search, $options: "i" } },
        ];
    }

    const conversations = await ConversationModel.find(query)
        .sort({ lastMessageAt: -1 })
        .lean();

    return conversations;
}

async function getConversationFromDB(conversationID: string) {
    const conversation = await ConversationModel.findById(conversationID);

    if (!conversation) {
        throw new Error("No conversation found with this conversation id.");
    }

    return conversation;
}

const ConversationServices = { getConversationsFromDB, getConversationFromDB };
export default ConversationServices;
