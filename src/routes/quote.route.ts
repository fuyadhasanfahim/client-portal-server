import { Router } from "express";
import QuoteControllers from "../controllers/quote.controller.js";

const router = Router();

router.post("/new-quote/:quoteStage", QuoteControllers.newQuote);
router.get("/get-quote/:quoteID", QuoteControllers.getQuoteByID);

export const quoteRoute = router;
