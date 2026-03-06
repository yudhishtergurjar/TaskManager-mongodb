import { verifyAccessToken } from "../utils/token.js";

export const socketMiddleware = async (socket, next)=>{
    try{
        // const token = socket.handshake.auth?.token;
        const token = socket.handshake.headers.authorization;
        if(!token) return next(new Error("Authentication error: Token missing"));
        const decoded = verifyAccessToken(token);
        socket.user = decoded;
        next();
    }catch (err) {
        next(new Error("Authentication error: Invalid token"));
    }
};