/* eslint-disable @typescript-eslint/no-explicit-any */
import { nanoid } from "nanoid";
import QuoteModel from "../models/quote.model.js";
import UserModel from "../models/user.model.js";
import { IQuote } from "../types/quote.interface.js";

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

    return quote;
}

async function getQuotesFromDB({
    userID,
    role,
    search,
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortQuote = "desc",
    filter,
}: {
    userID: string;
    role: string;
    search?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    filter?: string;
    sortQuote?: "asc" | "desc";
}) {
    const query: any = {};

    if (role === "user") {
        query["user.userID"] = userID;
    }

    if (search) {
        query.$or = [
            { queryID: { $regex: search, $options: "i" } },
            { "user.name": { $regex: search, $options: "i" } },
            { "user.email": { $regex: search, $options: "i" } },
        ];
    }

    if (filter && filter !== "all") {
        query.status = filter;
    }

    const sort: any = {
        [sortBy]: sortQuote === "asc" ? 1 : -1,
    };

    const skip = (page - 1) * limit;

    const [quotes, total] = await Promise.all([
        QuoteModel.find(query).sort(sort).skip(skip).limit(limit).lean(),
        QuoteModel.countDocuments(query),
    ]);

    return {
        quotes,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
}

async function getQuoteByIDFromDB(quoteID: string) {
    const quote = await QuoteModel.findOne({ quoteID });

    if (!quote) {
        throw new Error("Quote not found!");
    }

    return quote;
}

async function updateQuoteInDB({
    quoteID,
    data,
}: {
    quoteID: string;
    data: Partial<IQuote>;
}) {
    const updatedQuote = await QuoteModel.findOneAndUpdate({ quoteID }, data, {
        new: true,
    });

    if (!updatedQuote) throw new Error("Quote not found");

    return updatedQuote;
}

async function deliverQuoteToClient({ quoteID }: { quoteID: string }) {
    const quote = await QuoteModel.findOneAndUpdate(
        { quoteID },
        { status: "delivered" },
        { new: true }
    );

    return quote;
}

async function reviewQuoteToAdmin({ quoteID }: { quoteID: string }) {
    const quote = await QuoteModel.findOneAndUpdate(
        { quoteID },
        { status: "in-revision" },
        { new: true }
    );

    return quote;
}

async function completeQuoteInDB({ quoteID }: { quoteID: string }) {
    const quote = await QuoteModel.findOneAndUpdate(
        { quoteID },
        { status: "completed" },
        { new: true }
    );

    return quote;
}

async function getQuotesByStatusFromDB({
    userID,
    role,
    status,
}: {
    userID: string;
    role: string;
    status: string;
}) {
    let quotes;

    if (role === "user") {
        quotes = await QuoteModel.find({
            "user.userID": userID,
            status,
        });
    } else {
        quotes = await QuoteModel.find({
            status,
        });
    }

    return quotes;
}

async function getQuotesByUserIDFromDB({
    userID,
    search,
    page = 1,
    limit = 10,
    filter,
    sort,
}: {
    userID: string;
    search?: string;
    page?: number;
    limit?: number;
    filter?: string;
    sort?: string;
}) {
    const user = await UserModel.findOne({ userID });

    if (!user) throw new Error("User not found");

    const query: any = {
        "user.userID": userID,
        quoteStage: "payment-completed",
    };

    if (search) {
        query.$or = [
            { quoteID: { $regex: search, $options: "i" } },
            { "user.name": { $regex: search, $options: "i" } },
            { "user.email": { $regex: search, $options: "i" } },
        ];
    }

    if (filter && filter !== "all") {
        query.status = filter;
    }

    const sortOptions: any = {
        createdAt: -1,
    };

    if (sort) {
        const [field, quote] = sort.split(":");
        sortOptions[field] = quote === "asc" ? 1 : -1;
    }

    const skip = (page - 1) * limit;

    const [quotes, total] = await Promise.all([
        QuoteModel.find(query).sort(sortOptions).skip(skip).limit(limit).lean(),
        QuoteModel.countDocuments(query),
    ]);

    return {
        quotes,
        pagination: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
}

const QuoteServices = {
    newQuoteInDB,
    getQuotesFromDB,
    getQuoteByIDFromDB,
    updateQuoteInDB,
    deliverQuoteToClient,
    reviewQuoteToAdmin,
    completeQuoteInDB,
    getQuotesByStatusFromDB,
    getQuotesByUserIDFromDB,
};
export default QuoteServices;
