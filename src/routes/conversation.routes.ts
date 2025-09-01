import { Router } from "express";
import ConversationControllers from "../controllers/conversation.controller.js";

const router = Router();

router.get("/get-conversations", ConversationControllers.getConversations);
router.get(
    "/get-conversation/:conversationID",
    ConversationControllers.getConversation
);

export const ConversationRoutes = router;
