import mongoose from "mongoose";
import User from "../models/user.js";
import Task from "../models/task.js";
import Project from "../models/project.js";
import ProjectMember from "../models/projectMember.js";
import Notification from "../models/notification.js";
import ActivityLog from "../models/activityLog.js";
import redisClient from "../config/connectRedis.js";

//here to start
// import { getIO } from "../socket/initSocket.js";

const addTask = async (req,res)=>{//is owner lgega
    try{
        const {title, description, assigneeId, deadline}=req.body;
        const userId = req.user.userId;
        const projectId = req.params.id;

        const isAssigneePresent = ProjectMember.findOne({projectId,userId:assigneeId,removedAt:null});
        if(!isAssigneePresent) return res.status(400).json("assignee not present in project");
        
        const newTask = await Task.create({
            title,
            description,
            projectId,
            assigneeId,
            createdBy:userId,
            deadline
        })

        if(assigneeId){
            await Notification.create({
                userId: assigneeId,
                message: {
                    type: "TASK_ASSIGNED",
                    text: "A new task has been assigned to you",
                    taskId: newTask._id,
                    projectId: projectId,
                    title: newTask.title
                }
            });
        }

        await ActivityLog.create({
            userId,
            projectId,
            action: "TASK_CREATED",
            entityType: "TASK",
            metadata: {
                taskId: newTask._id,
                title: newTask.title,
                assigneeId: assigneeId || null
            }
        });

        //redis delete
        const key1 = `user:${assigneeId}:project:${projectId}:assignedTasks`;
        redisClient.del(key1);
        const key2 = `project:${projectId}:totalTasks`;
        redisClient.del(key2);


        // const roomName = `project:${projectId}`;
        // io.to(roomName).emit('task:added',{
        //     message:"new task is added",
        //     newTask
        // });
        return res.status(200).json({message:"task added successfully",newTask});
    }
    catch(err){
        console.log(err.message);
        return res.status(400).json({message:"error occured while adding",err});
    }
};

const assignedTasks = async (req,res)=>{//isMember
     try{
        const projectId = req.params.id;
        const userId = req.user.userId;  
        const task = await Task.findMany({
            projectId,
            assigneeId:userId
        });

        if(!task) return res.status(400).json({message:"task doesn't assigned to this user"});
        return res.status(200).json(task);

    }catch(err){
        console.log(err);
        return res.status(400).json({message:"error occured while reading",err});
    }
}

const totalTasks = async (req,res)=>{//isMember or isowner your choice.
     try{
        const projectId = req.params.id;
        const userId = req.user.userId;  
        const task = await Task.find({
            projectId,
        });

        if(!task) return res.status(400).json({message:"no task is present in project"});
        return res.status(200).json(task);

    }catch(err){
        console.log(err);
        return res.status(400).json({message:"error occured while reading",err});
    }
}


const updateTask = async (req,res)=>{//isowner nahi lgega because we only got task id not project id so we write the check here only
    try{
        // const io=getIO();
        const {title,description} = req.body;
        const taskId = req.params.id;
        const userId = req.user.userId;  
        const task = await Task.findOne({
            _id:taskId, 
            createdBy:userId,//only owner can update task..  
        });
        
        if(!task) return res.status(400).json({message:"task dont exists"});

        task.title = title || task.title;
        task.description =  description || task.description;
        const updatedTask = await task.save();

        const key1 = `user:${task.assigneeId}:project:${task.projectId}:assignedTasks`;
        redisClient.del(key1);
        const key2 = `project:${task.projectId}:totalTasks`;
        redisClient.del(key2);

        
        await Notification.create({
            userId: task.assigneeId,
            message: {
                type: "TASK_UPDATED",
                text: "A task assigned to you has been updated",
                taskId: task._id,
                projectId: task.projectId,
                title: task.title
            }
        });
        
        await ActivityLog.create({
            userId,
            projectId: task.projectId,
            action: "TASK_UPDATED",
            entityType: "TASK",
            metadata: {
                taskId: task._id,
                title: task.title,
                status:task.status,
                assigneeId: task.assigneeId
            }
        });

        // const roomName = `project:${updatedTask.projectId}`;
        // io.to(roomName).emit('task:updated',{
        //     message:"new task is updated",
        //     updatedTask
        // });

        //redis client del
        // const key=`user:${userId}:role:task:id:${taskId}`;
        // await client.del(key);       
        return res.status(200).json(updatedTask);
    }catch(err){
        console.log(err);
        return res.status(400).json({message:"error occured while updating",err});
    }    
    
}

const markCompletedTask = async (req,res)=>{
    try{    
        const taskId = req.params.id;
        const userId = req.user.userId;  
        
        const task = await Task.findOne({
            _id: taskId,
            assigneeId:userId
        });
        if(!task) return res.status(400).json({message:"task dont exists to this user"});

        const updatedTask = await task.update({
            status:"DONE"
        })

        const key1 = `user:${task.assigneeId}:project:${task.projectId}:assignedTasks`;
        redisClient.del(key1);
        const key2 = `project:${task.projectId}:totalTasks`;
        redisClient.del(key2);

        await Notification.create({
            userId,
            message: {
                type: "TASK_COMPLETED",
                text: "A task has been completed",
                taskId: updatedTask._id,
                projectId: updatedTask.projectId,
                title: updatedTask.title
            }
        });

        await ActivityLog.create({
            userId: req.user.userId,
            projectId: updatedTask.projectId,
            action: "TASK_COMPLETED",
            entityType: "TASK",
            metadata: {
                taskId: updatedTask._id,
                title: updatedTask.title,
                status: updatedTask.status,
                assigneeId: updatedTask.assigneeId
            }
        });

        // const roomName = `project:${updatedTask.projectId}`;
        // io.to(roomName).emit('task:updated',{
        //     message:"new task is updated",
        //     updatedTask
        // });

        // const key=`user:${userId}:role:task:id:${taskId}`;
        // await client.del(key);       
        return res.status(200).json(updatedTask);

    }catch(err){
        console.log(err);
        return res.status(400).json({message:"error occured",err})
    }
}

const deleteTask = async(req,res)=>{
    try{
        const taskId = req.params.id;
        const userId = req.user.userId;  
        const task = await Task.findOne({
            _id:taskId,   
            createdBy:userId
        });
        
        if(!task) return res.status(400).json({message:"task dont exists"});

        const deletedTask = task;
        await Task.deleteOne({ _id: taskId });

        const key1 = `user:${task.assigneeId}:project:${task.projectId}:assignedTasks`;
        redisClient.del(key1);
        const key2 = `project:${task.projectId}:totalTasks`;
        redisClient.del(key2);

        await Notification.create({
            userId,
            message: {
                type: "TASK_DELETED",
                text: "A task has been deleted",
                taskId: deletedTask._id,
                projectId: deletedTask.projectId,
                title: deletedTask.title
            }
        });

        await ActivityLog.create({
            userId: req.user.userId,
            projectId: deletedTask.projectId,
            action: "TASK_DELETED",
            entityType: "TASK",
            metadata: {
                taskId: deletedTask._id,
                title: deletedTask.title,
                status: deletedTask.status,
                assigneeId: deletedTask.assigneeId
            }
        });

        // const roomName = `project:${task.projectId}`;
        // io.to(roomName).emit('task:deleted',{
        //     message:"task is deleted",
        //     deletedTask
        // });

        // const key=`user:${userId}:role:task:id:${taskId}`;
        // await client.del(key);       
        return res.status(200).json({
            message:"task deleted successfully",
            deletedTask
        });
    }catch(err){
        console.log(err);
        return res.status(400).json({message:"error occured",err})
    }
}

export {addTask,assignedTasks,totalTasks,updateTask,markCompletedTask,deleteTask}