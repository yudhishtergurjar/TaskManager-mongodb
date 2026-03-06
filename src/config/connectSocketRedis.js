import IORedis from "ioredis";
import { createAdapter } from "@socket.io/redis-adapter";

export const pubClient = new IORedis(process.env.REDIS_URI);
export const subClient = pubClient.duplicate();

export const getSocketAdapter = () => {
    return createAdapter(pubClient, subClient);
};