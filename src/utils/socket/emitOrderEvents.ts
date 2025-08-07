import { Server } from "socket.io";

export function emitOrderToRooms(
    io: Server,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    entity: any,
    event: string
) {
    if (entity.user?.userID) {
        io.to(entity.user.userID).emit(event, {
            ...entity,
            updatedAt: entity.updatedAt ?? new Date(),
        });
    }

    const roomID = entity.orderID || entity.quoteID;
    if (roomID) {
        io.to(roomID.toString()).emit(event, {
            ...entity,
            updatedAt: entity.updatedAt ?? new Date(),
        });
    }
}
