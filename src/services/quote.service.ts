import { nanoid } from "nanoid";
import QuoteModel from "../models/quote.model";
import UserModel from "../models/user.model";
import { IQuote } from "../types/quote.interface";
import { io } from "../server";

async function newQuoteInDB({
    quoteStage,
    userID,
    services,
    quoteID,
    details,
}: {
    quoteStage: string;
    userID: string;
    services?: IQuote["services"];
    quoteID?: string;
    details?: IQuote["details"];
}) {
    const user = await UserModel.findOne({ userID });

    if (!user) throw new Error("User not found!");

    let quote;

    if (quoteStage === "services-selected" && services) {
        quote = await QuoteModel.create({
            quoteID: `WBQ${nanoid(10).toUpperCase()}`,
            user: {
                userID,
                name: user.name,
                email: user.email,
                image: user.image,
                company: user.company,
                address: user.address,
            },
            services,
            status: "pending",
            quoteStage,
        });
    }

    if (quoteStage === "details-provided" && quoteID && details) {
        quote = await QuoteModel.findOneAndUpdate(
            { quoteID },
            {
                details,
                quoteStage,
            },
            { new: true }
        );
    }

    if (quote) {
        io.to(quote.user.userID.toString()).emit("new-quote", {
            quoteID: quote.quoteID,
            status: quote.status,
            quoteStage: quote.quoteStage,
            createdAt: quote.createdAt,
        });

        io.to(quote.quoteID).emit("new-quote", {
            quoteID: quote.quoteID,
            status: quote.status,
            quoteStage: quote.quoteStage,
            createdAt: quote.createdAt,
        });
    }

    return quote;
}

async function getQuoteByIDFromDB(quoteID: string) {
    const quote = await QuoteModel.findOne({ quoteID });

    if (!quote) {
        throw new Error("Quote not found!");
    }

    return quote;
}

const QuoteServices = { newQuoteInDB, getQuoteByIDFromDB };
export default QuoteServices;
