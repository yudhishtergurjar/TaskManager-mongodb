import { Server } from "socket.io";
import { getSocketAdapter } from "../config/connectSocketRedis.js";
import { socketHandler } from "./socketHandler.js";

let io;

export const initIO = async (server) => {
    if (io) return io;

    try {
        io = new Server(server, {
            cors: { origin: "*" }
        });

        io.adapter(getSocketAdapter());//for multi-server persistance

        socketHandler(io);

        console.log("Socket.IO Initialized");

        return io;

    } catch (err) {
        console.error("Socket Init Failed:", err.message);
        process.exit(1);
    }
};

export const getIO = () => io;