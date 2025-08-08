import { Request, Response } from "express";
import QuoteServices from "../services/quote.service.js";
import envConfig from "../config/env.config.js";
import { deliveryEmail } from "../html-templates/deliveryEmail.js";
import { sendEmail } from "../lib/nodemailer.js";
import {
    getAdminRevisionEmail,
    getCustomerRevisionEmail,
} from "../html-templates/getRevisionRequestEmail.js";
import { getQuoteCompletionEmail } from "../html-templates/getQuoteCompletionEmail.js";
import { sendNotification } from "../utils/sendNotification.js";
import { io } from "../server.js";

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

        const quote = await QuoteServices.newQuoteInDB({
            quoteStage,
            userID,
            services,
            quoteID,
            details,
        });

        if (quote?.quoteStage === "details-provided") {
            await sendNotification({
                isAdmin: true,
                title: `📝 New quote #${quote.quoteID} Created`,
                message: `Your new quote has been placed and is being processed.`,
                link: `${envConfig.frontend_url}/quotes/details/${quote.quoteID}`,
            });

            io.to("admin-room").emit("new-quote");
        }

        res.status(201).json({
            success: true,
            quoteID: quote?.quoteID as string,
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

async function getQuotes(req: Request, res: Response) {
    try {
        const {
            userID,
            role,
            search = "",
            page = 1,
            limit = 10,
            sortBy = "createdAt",
            sortQuote = "desc",
            filter,
        } = req.query;

        if (!userID || !role) {
            res.status(400).json({
                success: false,
                message: "User id, and role not found.",
            });
            return;
        }

        const response = await QuoteServices.getQuotesFromDB({
            userID: userID as string,
            role: role as string,
            search: search as string,
            page: parseFloat(page as string),
            limit: parseFloat(limit as string),
            sortBy: sortBy as string,
            filter: filter as string,
            sortQuote: sortQuote as "asc" | "desc",
        });

        res.status(200).json({
            success: true,
            data: response,
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

async function updateQuote(req: Request, res: Response) {
    try {
        const { quoteID } = req.params;
        const data = req.body;

        if (!quoteID || !data) {
            res.status(400).json({
                success: false,
                message: "Quote id and data is required.",
            });
            return;
        }

        const updatedQuote = await QuoteServices.updateQuoteInDB({
            quoteID,
            data,
        });

        if (!updatedQuote) {
            res.status(404).json({
                success: false,
                message: "Can't find the quote to update.",
            });
            return;
        }

        if (data === "in-progress") {
            await sendNotification({
                userID: updatedQuote.user.userID,
                title: `🎁 Quote #${quoteID} Accepted`,
                message: `Hi ${updatedQuote.user.name}, your quote has been Accepted. Click to view the details.`,
                link: `${envConfig.frontend_url}/quotes/details/${quoteID}`,
            });
        }

        await sendNotification({
            userID: updatedQuote.user.userID,
            title: `Quote #${quoteID} Canceled`,
            message: `Hi ${updatedQuote.user.name}, your quote has been Canceled. Click to view the details.`,
            link: `${envConfig.frontend_url}/quotes/details/${quoteID}`,
        });

        io.to(quoteID).emit("quote-updated");

        res.status(200).json({
            success: true,
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

async function deliverQuote(req: Request, res: Response) {
    try {
        const { quoteID, downloadLink } = req.body;

        if (!quoteID || !downloadLink) {
            res.status(400).json({
                success: false,
                message:
                    "Quote ID, and download link information are all required.",
            });
            return;
        }

        const quote = await QuoteServices.deliverQuoteToClient({ quoteID });

        if (!quote) {
            res.status(404).json({
                success: false,
                message: "Quote not found",
            });
            return;
        }

        await sendEmail({
            to: quote.user.email,
            from: envConfig.email_user!,
            subject: `Your Quote #${quoteID} Has Been Delivered!`,
            html: deliveryEmail(quoteID, downloadLink),
        });

        await sendNotification({
            userID: quote.user.userID,
            title: `🎁 Quote #${quoteID} Delivered`,
            message: `Hi ${quote.user.name}, your quote has been successfully delivered. Click to view the details.`,
            link: `${envConfig.frontend_url}/quotes/details/${quoteID}`,
        });

        io.to(quoteID).emit("quote-updated");

        res.status(200).json({
            success: true,
            message: "Quote delivered successfully and customer notified.",
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

async function reviewQuote(req: Request, res: Response) {
    try {
        const { quoteID, instructions } = req.body;

        if (!quoteID || !instructions) {
            res.status(400).json({
                success: false,
                message: "Quote ID and instructions are required.",
            });
            return;
        }

        const quote = await QuoteServices.reviewQuoteToAdmin({
            quoteID,
        });

        if (!quote) {
            res.status(404).json({
                success: false,
                message: "Quote not found",
            });
            return;
        }

        await sendEmail({
            to: quote.user.email,
            from: envConfig.email_user!,
            subject: `Revision Request Submitted for Quote #${quoteID}`,
            html: getCustomerRevisionEmail(quoteID, quote.user.name),
        });

        await sendEmail({
            to: envConfig.email_user!,
            from: quote.user.email,
            subject: `[ACTION REQUIRED] Revision Request for Quote #${quoteID}`,
            html: getAdminRevisionEmail(
                quoteID,
                quote.user.name,
                quote.user.email,
                instructions
            ),
        });

        await sendNotification({
            isAdmin: true,
            title: `🔁 Revision Requested on Quote #${quoteID}`,
            message: `A customer has submitted a revision request for quote #${quoteID}.`,
            link: `${envConfig.frontend_url}/quotes/details/${quoteID}`,
        });

        io.to(quoteID).emit("quote-updated");

        res.status(200).json({
            success: true,
            message: "Revision request submitted successfully.",
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "An error occurred while processing your request",
            error:
                error instanceof Error
                    ? error.message
                    : "Internal server error",
        });
    }
}

async function completeQuote(req: Request, res: Response) {
    try {
        const { quoteID } = req.body;

        if (!quoteID) {
            res.status(400).json({
                success: false,
                message: "Quote ID is required.",
            });
            return;
        }

        const quote = await QuoteServices.completeQuoteInDB({ quoteID });

        if (!quote) {
            res.status(404).json({
                success: false,
                message: "Quote not found",
            });
            return;
        }

        await sendEmail({
            to: quote.user.email,
            from: envConfig.email_user!,
            subject: `Quote #${quoteID} Completed!`,
            html: getQuoteCompletionEmail(quoteID, quote.user.name),
        });

        await sendNotification({
            isAdmin: true,
            title: `✅ Quote #${quoteID} Marked Completed`,
            message: `The quote has been marked as completed. Review or archive if needed.`,
            link: `${envConfig.frontend_url}/quotes/details/${quoteID}`,
        });

        io.to(quoteID).emit("quote-updated");

        res.status(200).json({
            success: true,
            message: "Quote marked as completed successfully.",
            data: quote,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "An error occurred while processing your request",
            error:
                error instanceof Error
                    ? error.message
                    : "Internal server error",
        });
    }
}

async function getQuotesByStatus(req: Request, res: Response) {
    try {
        const { status } = req.params;
        const { userID, role } = req.query as {
            userID: string;
            role: string;
        };

        if (!status || !userID || !role) {
            res.status(400).json({
                success: false,
                message: "User id, status, and role is required.",
            });
            return;
        }

        const quotes = await QuoteServices.getQuotesByStatusFromDB({
            userID,
            role,
            status,
        });

        if (!quotes) {
            res.status(404).json({
                success: false,
                message: "No quote found.",
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: quotes,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "An error occurred while processing your request",
            error:
                error instanceof Error
                    ? error.message
                    : "Internal server error",
        });
    }
}

async function getQuotesByUserID(req: Request, res: Response) {
    try {
        const {
            userID,
            search = "",
            page = 1,
            limit = 10,
            filter,
            sort,
        } = req.query;

        if (!userID) {
            res.status(400).json({
                success: false,
                message: "User ID is required.",
            });
            return;
        }

        const { quotes, pagination } =
            await QuoteServices.getQuotesByUserIDFromDB({
                userID: userID as string,
                search: search as string,
                page: parseFloat(page as string),
                limit: parseFloat(limit as string),
                filter: filter as string,
                sort: sort as string,
            });

        if (!quotes || quotes.length === 0) {
            res.status(404).json({
                success: false,
                message: "No quotes found for this user.",
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: { quotes, pagination },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "An error occurred while processing your request",
            error:
                error instanceof Error
                    ? error.message
                    : "Internal server error",
        });
    }
}

const QuoteControllers = {
    newQuote,
    getQuotes,
    getQuoteByID,
    updateQuote,
    deliverQuote,
    reviewQuote,
    completeQuote,
    getQuotesByStatus,
    getQuotesByUserID,
};
export default QuoteControllers;
