import mongoose from "mongoose";
import ProjectMember from "../models/projectMember.js";
import Notification from "../models/notification.js";
import ActivityLog from "../models/activityLog.js";
import Message from "../models/message.js";
import redisClient from "../config/connectRedis.js";
import { getIO } from "../socket/initSocket.js";

export const getMessages = async (req,res)=>{
    try{

        const projectId = req.params.id;
        const {page=1,limit=20} = req.query;

        const messages = await Message.find({
            projectId,
            deletedAt:null
        })
        .sort({createdAt:-1})
        .limit(parseInt(limit))
        .skip((page-1)*limit);

        res.json({
            chats:messages.reverse()
        });

    }catch(err){
        res.status(500).json({message:err.message});
    }
};


export const editMessage = async(req,res)=>{
    try{

        const io = getIO();
        const userId = req.user.userId;
        const {content} = req.body;

        const message = await Message.findById(req.params.id);

        if(!message || message.deletedAt){
            return res.status(404).json({
                message:"Message not found"
            });
        }

        if(message.senderId.toString() !== userId){
            return res.status(403).json({
                message:"Not allowed"
            });
        }

        message.content = content;
        message.updatedAt = new Date();

        await message.save();

        await ActivityLog.create({
            userId,
            projectId:message.projectId,
            action:"MESSAGE_EDITED",
            entityType:"MESSAGE",
            metadata:{entityId:message._id}
        });

        io.to(`project:${message.projectId}`).emit("message:edited",{
            messageId:message._id,
            content
        });

        res.json({
            message:"Message updated"
        });

    }catch(err){
        res.status(500).json({
            message:err.message
        });
    }
};

export const deleteMessage = async(req,res)=>{
    try{

        const io = getIO();
        const userId = req.user.userId;

        const message = await Message.findById(req.params.id);

        if(!message || message.deletedAt){
            return res.status(404).json({
                message:"Message not found"
            });
        }

        if(message.senderId.toString() !== userId){
            return res.status(403).json({
                message:"Not allowed"
            });
        }

        message.deletedAt = new Date();
        await message.save();

        await ActivityLog.create({
            userId,
            projectId:message.projectId,
            action:"MESSAGE_DELETED",
            entityType:"MESSAGE",
            metadata:{entityId:message._id}
        });

        io.to(`project:${message.projectId}`).emit("message:deleted",{
            messageId:message._id
        });

        res.json({
            message:"Message deleted"
        });

    }catch(err){
        res.status(500).json({
            message:err.message
        });
    }
};