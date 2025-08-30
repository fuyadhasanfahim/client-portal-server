export type ConversationType = "support" | "internal";
export type ConversationStatus =
    | "pending"
    | "active"
    | "waiting"
    | "resolved"
    | "closed";

export interface IParticipant {
    userID: string;
    name: string;
    email: string;
    image?: string;
    role: "user" | "admin";
    isOnline: boolean;
    lastSeenAt?: Date;
    lastReadAt?: Date;
}

export interface IConversation {
    _id: string;

    participants: IParticipant[];

    type: ConversationType;
    status: ConversationStatus;

    lastMessageAt: Date;
    lastMessageText?: string;
    lastMessageAuthorId?: string;
    unread?: number;

    createdByUserId: string;
    assignedAgentId?: string | null;

    tags?: string[];
    slaDueAt?: Date;
}
