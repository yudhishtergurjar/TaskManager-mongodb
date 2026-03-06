import mongoose from "mongoose";
import User from "../models/user.js";
import Project from "../models/project.js";
import ProjectMember from "../models/projectMember.js";
import Notification from "../models/notification.js";
import ActivityLog from "../models/activityLog.js";
import redisClient from "../config/connectRedis.js";
import { getIO } from "../socket/initSocket.js";

const addProject = async (req, res) => {
    try {
        const { title, description } = req.body;
        const userId = req.user.userId;

        const project = await Project.create({
            title,
            description,
            createdBy: userId
        });

        await ProjectMember.create({
            projectId: project._id,
            userId,
            role: "OWNER",
            joinedAt: new Date()
        });

        await Notification.create({
            userId,
            message: {
                action: "PROJECT_ADDED",
                title,
                description
            }
        });

        await ActivityLog.create({
            userId,
            projectId: project._id,
            action: "PROJECT_CREATED",
            entityType: "PROJECT"
        });

        return res.status(201).json({
            message: "Project created successfully",
            project
        });

    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};



const readProject = async (req, res) => {
    try {

        const projectId = req.params.id;

        const project = await Project.findOne({
            _id: projectId,
            deletedAt: null
        });

        return res.status(200).json(project);

    }catch(err){
        return res.status(500).json({ message: err.message });
    }
};


const updateProject = async (req, res) => {

    try{
        const { title, description} = req.body;
        const projectId = req.params.id;
        const userId = req.user.userId;


        const project = await Project.findOne({
            _id: projectId,
            deletedAt: null
        });

        project.title = title || project.title;
        project.description = description || project.description;

        await project.save();

        await Notification.create({
            userId,
            message: {
                action: "PROJECT_UPDATED",
                title: project.title,
                description: project.description
            }
        });

        await ActivityLog.create({
            userId,
            projectId,
            action: "PROJECT_UPDATED",
            entityType: "PROJECT"
        });
        
        //redis cacheMiddleware delete
        const key1 = `project:${projectId}:readProject`;
        const key2 = `user:${userId}:listProject`;
        redisClient.del(key1);
        redisClient.del(key2);

        return res.status(200).json({
            message: "Project updated successfully",
            project
        });

    }catch(err){
        return res.status(500).json({ message: err.message });
    }
};



const deleteProject = async (req, res) => {

    try{
        const io = getIO();
        const projectId = req.params.id;
        const userId = req.user.userId;

        const project = await Project.findOne({
            _id: projectId,
            deletedAt: null
        });

        if(!project){
            return res.status(404).json({ message: "Project not found" });
        }

        await ProjectMember.updateMany(
            { projectId, removedAt: null },
            { $set: { removedAt: new Date() } }
        );

        await Project.updateOne(
            { _id: projectId },
            { $set: { deletedAt: new Date() } }
        );


        await Notification.create({
            userId,
            message: {
                action: "PROJECT_DELETED",
                title: project.title
            }
        });

        await ActivityLog.create({
            userId,
            projectId,
            action: "PROJECT_DELETED",
            entityType: "PROJECT"
        });

        //when room is deleted notify user and remove their sockets from room
        const roomName = `project:${projectId}`;
        io.to(roomName).emit("project:deleted", {
            projectId,
            message: "Project has been deleted"
        });

        const sockets = await io.in(roomName).fetchSockets();
        for (const socket of sockets) {
            socket.leave(roomName);
        }

        //redis cacheMiddleware delete
        const key1 = `project:${projectId}:readProject`;
        const key2 = `user:${userId}:listProject`;
        redisClient.del(key1);
        redisClient.del(key2);


        //ismember, is owner cache
        const key3 = `role:project:${projectId}:member:${userId}`;
        await redisClient.del(key3);
        const key4 = `role:project:${projectId}:owner:${userId}`;
        await redisClient.del(key4);



        return res.status(200).json({
            message: "Project deleted successfully"
        });

    }catch(err) {
        return res.status(500).json({ message: err.message });
    }
};

const listProject = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const userId = req.user.userId;
        console.log(userId);
        console.log("HII");

        const pageNumber = parseInt(page);
        const pageSize = parseInt(limit);

        const total = await Project.countDocuments({
            createdBy: userId,
            deletedAt:null
        });

        const projects = await Project.find({
            createdBy: userId,
            deletedAt:null
        })
        .limit(pageSize)
        .skip((pageNumber - 1) * pageSize);
        console.log(projects);

        return res.status(200).json({
            total,
            page: pageNumber,
            data: projects
        });

    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message: "error occured while listing"
        });
    }
};


const addMember = async (req, res) => {
    try {
        const io = getIO();
        const ownerId = req.user.userId;
        const projectId = req.params.id;
        const members = req.body.members || [];

        const addedMembers = [];

        for (const memberId of members) {

            const membership = await ProjectMember.findOne({
                projectId,
                userId: memberId
            });

            if (membership && membership.removedAt === null) {
                continue;//already present
            }

            if(membership && membership.removedAt !== null) {

                membership.removedAt = null;
                membership.joinedAt = new Date();
                await membership.save();

                addedMembers.push(memberId);

            }else if(!membership){

                await ProjectMember.create({
                    projectId,
                    userId: memberId,
                    role: "MEMBER",
                    joinedAt: new Date()
                });

                addedMembers.push(memberId);
            }

            await Notification.create({
                userId: memberId,
                message: {
                    action: "ADDED_TO_PROJECT",
                    projectId
                }
            });

            await ActivityLog.create({
                userId: ownerId,
                projectId,
                action: "MEMBER_ADDED",
                entityType: "MEMBER",
                metadata: {memberId}
            });

        }
        for (const memberId of addedMembers) {

            io.to(roomName).emit("member:added", {
                userId: memberId,
                projectId
            });
            const connections = redisClient.get(`user:${memberId}`);
            io.to(roomName).emit('user:presence',{ 
                message : connections==0?"offlline":"online" 
            })

            io.to(`user:${memberId}`).emit("project:added:self", {
                projectId
            });
        }

        return res.status(200).json({
            message: "Members added",
            addedMembers
        });

    } catch (err) {
        console.log(err);
        return res.status(500).json({ message: err.message });
    }
};



const removeMember = async (req, res) => {

    try{
        const io = getIO();
        const ownerId = req.user.userId;
        const projectId = req.params.id;
        const members = req.body.members || [];

        const removedMembers = [];

        for (const memberId of members) {

            const membership = await ProjectMember.findOne({
                projectId,
                userId: memberId,
                removedAt: null
            });
    
            if(!membership) continue;

            await ProjectMember.updateOne(
                { projectId, userId: memberId },
                { $set: { removedAt: new Date() } }
            );

            removedMembers.push(memberId);

            await Notification.create({
                userId: memberId,
                message: {
                    action: "REMOVED_FROM_PROJECT",
                    projectId
                }
            });

            await ActivityLog.create({
                userId: ownerId,
                projectId,
                action: "MEMBER_REMOVED",
                entityType: "MEMBER",
                metadata: {memberId}
            });
            //ismember isowner redis remove
            const key3 = `role:project:${projectId}:member:${memberId}`;
            await redisClient.del(key3);
            const key4 = `role:project:${projectId}:owner:${memberId}`;
            await redisClient.del(key4);
        }
        for (const memberId of removedMembers) {

            // Remove sockets from room (all servers via redis adapter)
            await io.in(`user:${memberId}`).socketsLeave(roomName);

            // Notify remaining room members
            io.to(roomName).emit("member:removed", {
                userId: memberId,
                projectId
            });
        }

        return res.status(200).json({
            message: "Members removed",
            removedMembers
        });

    } catch (err) {
        return res.status(500).json({ message: err.message });
    }
};


export {
  addProject,
  readProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  listProject
};