import jwt from "jsonwebtoken";
import "dotenv/config";
import redisClient from "../config/connectRedis.js";
import Session from "../models/session.js";
import { verifyAccessToken } from "../utils/token.js";

const jwtAcessSecret = process.env.jwtAcessSecret;

export const authMiddleware = async (req, res, next) => {

    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ message: "Token missing" });
    }

    try {

        const token = authHeader.split(" ")[1];
        const decoded = verifyAccessToken(token);

        const sessionId = decoded.sessionId;
        req.user = decoded;

        let cachedSession = await redisClient.get(`session:${sessionId}`);

        if (!cachedSession) {

            console.log("cacheMiss session");

            const session = await Session.findOne({
                _id: sessionId,
                isActive: true,
                expiresAt: { $gt: new Date() }
            });

            if (!session) {
                return res.status(401).json({ message: "Invalid or expired session" });
            }

            await redisClient.set(
                `session:${sessionId}`,
                JSON.stringify({
                    isActive: true,
                    expiresAt: session.expiresAt
                }),
                "EX",
                7 * 24 * 60 * 60
            );

            cachedSession = JSON.stringify({
                isActive: true,
                expiresAt: session.expiresAt
            });

        } else {
            console.log("cacheHit session");
        }

        const parsedData = JSON.parse(cachedSession);

        if (!parsedData.isActive || new Date(parsedData.expiresAt) < new Date()){
            return res.status(401).json({ message: "Session expired" });
        }
        next();

    }catch(err){
        console.log(err.message);
        return res.status(401).json({ message: "Invalid token" });
    }
};