export type MessageKind = "user" | "system";
export type MessageEventType =
    | "agent_joined"
    | "agent_assigned"
    | "agent_left"
    | "conversation_closed"
    | "note";

export interface IAttachment {
    url: string;
    mimeType: string;
    name?: string;
    sizeBytes?: number;
    width?: number;
    height?: number;
    durationSec?: number;
    thumbnailUrl?: string;
    uploadedAt: Date;
}

export interface IReaction {
    emoji: string;
    userId: string;
}

export interface IMessage {
    _id: string;
    conversationID: string;
    authorId: string;
    kind: MessageKind;
    eventType?: MessageEventType;
    eventMeta?: Map<string, string>;

    text?: string;
    sentAt: Date;
    status: "sending" | "sent" | "delivered" | "read" | "failed";

    attachments?: IAttachment[];
    replyToId?: string;

    editedAt?: Date;
    deletedAt?: Date;

    reactions?: IReaction[];

    readBy?: Map<string, Date>;
}
