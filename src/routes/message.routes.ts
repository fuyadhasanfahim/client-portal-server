import { Router } from "express";
import {
    getMessagesPage,
    postMarkRead,
    postSendMessage,
} from "../controllers/message.controller.js";

const router = Router();

router.post("/new-message", postSendMessage);

router.get("/get-messages", getMessagesPage);

router.post("/read-up-messages/:conversationID/mark-read", postMarkRead);

export const MessageRoute = router;
