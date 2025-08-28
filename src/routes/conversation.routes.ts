import { Router } from "express";
import { getMyConversations } from "../controllers/conversation.controller.js";

const router = Router();

router.get("/get-conversations", getMyConversations);

export const ConversationRoutes = router;
