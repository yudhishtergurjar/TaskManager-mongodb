import { socketMiddleware } from "../middlewares/socketMiddleware.js";
import User from "../models/user.js";
import Project from "../models/project.js";
import ProjectMember from "../models/projectMember.js";
import Message from "../models/message.js";
import redisClient from "../config/connectRedis.js";
import { verifyAccessToken } from "../utils/token.js";
import "dotenv/config";

async function isMember(userId,roomId){
    const presenceKey = `user:${userId}:room:${roomId}:presence`;//no need to delete at remove member it slows the operation let them automatically expire
    const redisGet = await redisClient.get(presenceKey);
    if(!redisGet){//redis me nahi mila
        const isMember = await ProjectMember.findOne({
            projectId:roomId,
            userId,
            removedAt:null
        });

        if(!isMember) return false;
        await redisClient.set(presenceKey,"1","EX",60);
    }
    return true;
}


async function incrConnections(userId) {
    const key = `user:${userId}:connections`;
    return await redisClient.incr(key);
}
//redis
async function decrConnections(userId) {
    const key = `user:${userId}:connections`;
    const val = await redisClient.decr(key);
    return val;
}

export const socketHandler = (io)=>{
    io.use(socketMiddleware);

    io.on("connection",async (socket)=>{
        console.log(socket.id);

        const userId = socket.user.userId;
        const userData = await User.findById(userId);

        if(!userData) return socket.disconnect();
        socket.join(`user:${userId}`);//all sockets of user present in room(all sockets from multiple devices).

        const count = await incrConnections(userId);
        //chagne krna ha
        if(count == 1){
            const userRooms = await ProjectMember.find({
                userId,
                removedAt:null
            })
            for(const it of userRooms){
                const roomName = `project:${it.projectId}`;
                io.to(roomName).emit('presence:online',{
                    userId
                })
            }
        }

        socket.on("auth:update", async({token})=>{
            try{
                const decoded = verifyAccessToken(token);
                socket.user = decoded;
                socket.emit("auth:success");

            }catch(err){
                socket.emit("auth:error", {
                    message: "Invalid token"
                });
                socket.disconnect();
            }
        });
        
        socket.on("room:join", async (payload) => {
            try{
                const roomId = payload.roomId;
                const page = 1;

                const isPresent = await isMember(userId, roomId);

                if(!isPresent){
                    console.log("not present");
                    return socket.emit("error", { message: "not allowed/not found" });
                }

                const roomName = `project:${roomId}`;

                socket.join(roomName);

                socket.to(roomName).emit("room:joined", {
                    username: userData.username,
                    userId,
                    message: `${userData.username} joined the room`,
                });

                socket.emit("room:joined:self", {
                    message: "You joined the room"
                });

                const limit = 20;
                const offset = (page - 1) * limit;

                const messages = await Message.find({
                    projectId: roomId,
                    deletedAt: null
                })
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip(offset);

                socket.emit("chat:send", {
                    chats: messages.reverse()
                });

            }catch(err){
                console.log(err);
            }
        });


        socket.on("room:leave",async (payload)=>{
            try{
                const roomId=payload.roomId;
                const roomName = `project:${roomId}`;
                const isPresent = await isMember(userId,roomId);

                if(!isPresent){    
                    return socket.emit("error",{message:" not allowed/not found"});
                }

                if(!socket.rooms.has(roomName)){
                    console.log("room not present");
                    return socket.emit("error",{message:" socket not present in room"});
                }

                socket.leave(roomName);
                socket.to(roomName).emit("member:left", { userId });
                
            }catch(err){
                console.log("err occured",err);
            }
        });


        socket.on("message:send",async (payload)=>{
            try{
                const roomId = payload.roomId;
                const message = payload.message;
                const roomName = `project:${roomId}`;
                const isPresent = await isMember(userId,roomId);

                if(!isPresent){    
                    return socket.emit("error",{message:" not allowed/not found"});
                }

                if(!socket.rooms.has(roomName)){
                    console.log("socket not present");
                    return socket.emit("error",{message:" socket not present in room"});
                }

                const newMessage = await Message.create({
                    projectId:roomId,
                    senderId:userId,
                    content:message,
                });

                io.to(roomName).emit("message:received",{
                    newMessage
                });
            }catch(err){
                console.log("err occured",err.message);
                return socket.emit("error",{message:err.message});
            }

        });

        socket.on("typing:start",async(payload)=>{
            try{
                const roomId = payload.roomId;
                const isPresent = await isMember(userId,roomId);
                const roomName = `project:${roomId}`;

                if(!isPresent){        
                    return socket.emit("error",{message:" not allowed/not found"});
                }

                if(!socket.rooms.has(roomName)){
                    console.log("socket not present");
                    return socket.emit("error",{message:" socket not present in room"});
                }
                
                socket.to(roomName).emit('typing:started',{
                    userId,
                    username:userData.username
                });
            }catch(err){
                console.log("err occured",err.message);
                return socket.emit("error",{message:err.message});
            }
        });

        socket.on("typing:stop",async(payload)=>{
            try{
                const roomId = payload.roomId;
                const roomName = `project:${roomId}`;
                const isPresent = await isMember(userId,roomId);
                if(!isPresent){    
                    return socket.emit("error",{message:" not allowed/not found"});
                }

                if(!socket.rooms.has(roomName)){
                    console.log("socket not present");
                    return socket.emit("error",{message:" socket not present in room"});
                }

                socket.to(roomName).emit('typing:stopped',{
                    userId
                });
            }catch(err){
                console.log("err occured",err.message);
                return socket.emit("error",{message:err.message});
            }
        });
        //  only for multiserver. only if disconnect never runs..
        // socket.on("heartbeat",async ()=>{
        //     const onlineKey = `user:${userId}:online`;
        //     await client.set(onlineKey, "1", { EX: 60 });
        // });

//remaing for testing
        socket.on("disconnect",async ()=>{

            const connections = await decrConnections(userId);

            if(connections<=0){
                const userRooms = await ProjectMember.find({ userId,removedAt:null });
                for (const room of userRooms) {
                    io.to(`project:${room.projectId}`).emit("presence:offline", {
                        userId
                    });
                }
            }
        });

    });
};