// /* eslint-disable @typescript-eslint/no-explicit-any */
// import { FilterQuery, Types } from "mongoose";
// import type { IMessage } from "../types/message.interface.js";
// import ConversationModel from "../models/conversation.model.js";
// import MessageModel from "../models/message.model.js";

// export type SendMessageInput = {
//     conversationID: string;
//     authorId: string;
//     text?: string;
//     attachments?: IMessage[];
//     replyToId?: string;
// };

// export type PaginatedMessages = {
//     items: IMessage[];
//     nextCursor?: string;
//     hasMore: boolean;
// };

// function oid(id: string) {
//     if (!Types.ObjectId.isValid(id))
//         throw Object.assign(new Error("Invalid ObjectId"), { status: 400 });
//     return new Types.ObjectId(id);
// }

// async function assertParticipant(conversationID: string, userID: string) {
//     const exists = await ConversationModel.exists({
//         _id: oid(conversationID),
//         "participants.userID": userID,
//     });
//     if (!exists)
//         throw Object.assign(
//             new Error("Not a participant of the conversation"),
//             { status: 403 }
//         );
// }

// export async function sendMessage(input: SendMessageInput) {
//     const { conversationID, authorId, text, attachments, replyToId } = input;

//     await assertParticipant(conversationID, authorId);

//     const msg = await MessageModel.create({
//         conversationID,
//         authorId,
//         text,
//         attachments,
//         replyToId,
//         status: "sent",
//         sentAt: new Date(),
//     });

//     await ConversationModel.updateOne(
//         { _id: oid(conversationID) },
//         {
//             $set: {
//                 lastMessageAt: msg.sentAt,
//                 lastMessageText:
//                     text ?? (attachments?.length ? "[attachment]" : ""),
//                 lastMessageAuthorId: authorId,
//             },
//             $inc: { unread: 1 },
//         }
//     );

//     return msg.toObject();
// }

// export async function markReadUpTo(
//     conversationID: string,
//     userID: string,
//     upToMessageId: string
// ) {
//     await assertParticipant(conversationID, userID);

//     const res = await MessageModel.updateMany(
//         {
//             conversationID,
//             _id: { $lte: oid(upToMessageId) },
//             [`readBy.${userID}`]: { $exists: false },
//         },
//         { $set: { [`readBy.${userID}`]: new Date() } }
//     );

//     return { modifiedCount: res.modifiedCount };
// }

// async function getMessagesFromDB({
//     conversationID,
//     limit = 25,
//     cursor,
// }: {
//     conversationID: string;
//     limit: number;
//     cursor?: string;
// }) {
//     const isConversationExist =
//         await ConversationModel.findById(conversationID);

//     if (!isConversationExist) {
//         throw new Error("No conversation found with this conversation id.");
//     }

//     const filter: FilterQuery<IMessage> = {
//         conversationID,
//     };

//     if (cursor) {
//         filter._id = {
//             $lt: cursor,
//         };
//     }

//     const messages = await MessageModel.find(filter)
//         .sort({ createdAt: -1 })
//         .limit(limit)
//         .lean();

//     return messages;
// }

// async function sendMessageInToDB({
//     conversationID,
//     authorID,
//     authorRole,
//     text,
//     sentAt,
// }: Partial<IMessage>) {
//     const assertParticipant = await ConversationModel.exists({
//         _id: conversationID,
//         "participants.userID": authorID,
//     });

//     if (!assertParticipant) {
//         throw new Error("Not a participant of the conversation");
//     }
// }   

// const MessageServices = { getMessagesFromDB, sendMessageInToDB };
// export default MessageServices;
