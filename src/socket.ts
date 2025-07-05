import { Server } from "socket.io";

const connectedUsers = new Map<string, string>();

export default function registerSocketHandlers(io: Server) {
    io.on("connection", (socket) => {
        console.log("🟢 New socket connected:", socket.id);

        socket.on("register", (userID: string) => {
            connectedUsers.set(userID, socket.id);
            console.log(
                `✅ User ${userID} registered with socket ${socket.id}`
            );
        });

        // 📦 Order section
        socket.on("new-order", (orderData) => {
            io.emit("new-order", orderData);
        });

        // 🔄 Order Status Update
        socket.on("order-status-updated", ({ userID, status }) => {
            const userSocketID = connectedUsers.get(userID);
            if (userSocketID) {
                io.to(userSocketID).emit("order-status-updated", status);
            }
        });

        // 💬 Messaging
        socket.on("send-message", (data) => {
            const { toUserID, message } = data;
            const receiverSocketID = connectedUsers.get(toUserID);
            if (receiverSocketID) {
                io.to(receiverSocketID).emit("receive-message", message);
            }
        });

        socket.on("typing", ({ toUserID }) => {
            const receiverSocketID = connectedUsers.get(toUserID);
            if (receiverSocketID) {
                io.to(receiverSocketID).emit("user-typing");
            }
        });

        // 💳 Payment Status
        socket.on("payment-update", ({ userID, status }) => {
            const userSocketID = connectedUsers.get(userID);
            if (userSocketID) {
                io.to(userSocketID).emit("payment-update", status);
            }
        });

        socket.on("disconnect", () => {
            console.log("🔴 Socket disconnected:", socket.id);
            // Clean up
            for (const [userID, id] of connectedUsers.entries()) {
                if (id === socket.id) connectedUsers.delete(userID);
            }
        });
    });
}
