import { Request, Response } from "express";
import ConversationServices from "../services/conversation.service.js";

async function getConversations(req: Request, res: Response) {
    try {
        const { userID, search } = req.query;

        if (!userID) {
            res.status(400).json({
                success: false,
                message: "User id is required for this request.",
            });
            return;
        }

        const conversations = await ConversationServices.getConversationsFromDB(
            { userID: userID as string, search: search as string }
        );

        res.status(200).json({
            success: true,
            conversations,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Something went wrong. Please try again later.",
        });
    }
}

async function getConversation(req: Request, res: Response) {
    try {
        const { conversationID } = req.params;

        if (!conversationID) {
            res.status(400).json({
                success: false,
                message: "Conversation id is required for this request.",
            });
            return;
        }

        const conversation =
            await ConversationServices.getConversationFromDB(conversationID);

        res.status(200).json({
            success: true,
            conversation,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message:
                error instanceof Error
                    ? error.message
                    : "Something went wrong. Please try again later.",
        });
    }
}

const ConversationControllers = {
    getConversations,
    getConversation,
};
export default ConversationControllers;
