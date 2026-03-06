import redisClient from "../config/connectRedis.js";
import ProjectMember from "../models/projectMember.js";

export const isMember = async (req, res, next) => {
    try {

        const projectId = req.params.id;
        const userId = req.user.userId;

        const key = `role:project:${projectId}:member:${userId}`;// this code works if user is owner or member 
//addmember, deleteproject, remove member, 
        const cached = await redisClient.get(key);

        if(cached === "true") return next();

        const membership = await ProjectMember.findOne({
            projectId,
            userId,
            removedAt: null
        });

        if(membership){
            await redisClient.set(key, "true", "EX", 300); // 5 min TTL
            return next();
        }
        return res.status(403).json({ message: "Access denied" });

    }catch(err){
        return res.status(500).json({ message: err.message });
    }

};
export const isOwner = async (req, res, next) => {

    try{
        const projectId = req.params.id;
        const userId = req.user.userId;

        const key = `role:project:${projectId}:owner:${userId}`;

        const cached = await redisClient.get(key);

        if(cached === "true") return next();

        const owner = await ProjectMember.findOne({
            projectId,
            userId,
            removedAt: null,
            role: "OWNER"
        });

        if(owner){
            await redisClient.set(key, "true", "EX", 300);
            return next();
        }

        return res.status(403).json({ message: "Only owner can update project" });

    }catch(err){
        return res.status(500).json({ message: err.message });
    }

};