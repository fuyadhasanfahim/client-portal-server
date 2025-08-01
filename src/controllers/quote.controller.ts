import { Request, Response } from "express";
import QuoteServices from "../services/quote.service";

async function newQuote(req: Request, res: Response) {
    try {
        const { quoteStage } = req.params;
        const { userID, services, quoteID, details } = req.body;

        if (!quoteStage || !userID) {
            res.status(400).json({
                success: false,
                message: "User id and quote stage is required.",
            });
            return;
        }

        const order = await QuoteServices.newQuoteInDB({
            quoteStage,
            userID,
            services,
            quoteID,
            details,
        });

        res.status(201).json({
            success: true,
            orderID: order?.quoteID as string,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "An error occurred while processing your request",
            error:
                error instanceof Error
                    ? error.message
                    : "Something went wrong! Please try again later.",
        });
    }
}

async function getQuoteByID(req: Request, res: Response) {
    try {
        const { quoteID } = req.params;

        if (!quoteID) {
            res.status(400).json({
                success: false,
                message: "Quote ID is required.",
            });
            return;
        }

        const quote = await QuoteServices.getQuoteByIDFromDB(quoteID);

        if (!quote) {
            res.status(404).json({
                success: false,
                message: "Quote not found.",
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: quote,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "An error occurred while fetching the quote",
            error:
                error instanceof Error
                    ? error.message
                    : "Something went wrong! Please try again later.",
        });
    }
}

const QuoteControllers = { newQuote, getQuoteByID };
export default QuoteControllers;
