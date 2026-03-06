import User from "../models/user.js";
import Session from "../models/session.js";
import AuditLog from "../models/AuditLog.js";
import bcrypt from "bcrypt";
import redisClient from "../config/connectRedis.js";
import { v4 as uuidv4 } from "uuid";
import { generateAccessToken, generateRefreshToken, verifyAccessToken, verifyRefreshToken } from "../utils/token.js";


export const registerUser = async(req,res)=>{
    try{
        const { username, email, password } = req.body;

        const existingUser = await User.findOne({ email });

        if(existingUser){
            return res.status(409).json({
                message: "User already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);

        const newUser = await User.create({
            username,
            email,
            password: hashedPassword
        });

        await AuditLog.create({
            userId: newUser._id,
            action: "USER_REGISTERED",
            targetType: "USER",
            ipAdress: req.ip,
            userAgent: req.headers["user-agent"]
        });

        return res.status(201).json({
            message: "User created successfully",
            id: newUser._id,
            username: newUser.username,
            email: newUser.email
        });

    }catch(err){
        console.log(err.message);
        return res.status(500).json({
            message: "Error while registering user",
            error: err.message
        });
    }
};


export const loginUser = async(req,res)=>{
    try{
        const {email, password} = req.body;

        const existingUser = await User.findOne({ email });

        if(!existingUser){
            return res.status(401).json({
                message: "Invalid credentials"
            });
        }

        const isPasswordValid = await bcrypt.compare(password, existingUser.password);

        if(!isPasswordValid){
            return res.status(401).json({
                message: "Invalid credentials"
            });
        }

        const sessionId = uuidv4();

        const accessToken = generateAccessToken({
            sessionId,
            userId: existingUser._id,
            role:existingUser.role
        });

        const refreshToken = generateRefreshToken({
            sessionId,
            userId: existingUser._id,
            role:existingUser.role
        });

        const hashedToken = await bcrypt.hash(refreshToken, 12);

        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        await Session.create({
            _id: sessionId,
            userId: existingUser._id,
            refreshToken: hashedToken,
            expiresAt,
            ipAdress: req.ip,
            userAgent: req.headers["user-agent"]
        });

        await AuditLog.create({
            userId: existingUser._id,
            action: "USER_LOGIN",
            targetType: "USER",
            ipAdress: req.ip,
            userAgent: req.headers["user-agent"],
            metadata: { sessionId }
        });

        return res.status(200).json({
            message: "User logged in successfully",
            accessToken,
            refreshToken
        });
    }catch(err){

        return res.status(500).json({
            message: "Error occurred while logging in",
            error: err.message
        });
    }
};



export const logoutUser = async(req,res)=>{
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({
                message: "Authorization token missing"
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = verifyAccessToken(token);
        const {userId, sessionId} = decoded;

        await Session.updateOne(
            { _id: sessionId, userId },
            { $set: { isActive: false }}
        );

        await AuditLog.create({
            userId,
            action: "USER_LOGOUT",
            targetType: "USER",
            ipAdress: req.ip,
            userAgent: req.headers["user-agent"],
            metadata: { sessionId }
        });

        redisClient.del(`session:${sessionId}`);

        return res.status(200).json({
            message: "User logged out successfully"
        });

    } catch (err) {

        return res.status(500).json({
            message: "Error while logging out",
            error: err.message
        });
    }
};

export const refreshToken = async(req, res)=>{
    try{
        const refreshToken = req.cookies.refreshToken;

        if(!refreshToken){
            return res.status(401).json({
                message: "Refresh token missing"
            });
        }

        const decoded =  verifyRefreshToken(refreshToken);

        const {sessionId, userId} = decoded;

        const user = await User.findById(userId);

        if(!user){
            return res.status(404).json({
                message: "User does not exist"
            });
        }

        const session = await Session.findOne({
            _id: sessionId,
            isActive: true
        });

        if(!session){
            return res.status(401).json({
                message: "Session not found"
            });
        }

        if(session.expiresAt < new Date()) {
            return res.status(401).json({
                message: "Session expired"
            });
        }

        const isTokenValid = await bcrypt.compare(
            refreshToken,
            session.refreshToken
        );

        if (!isTokenValid) {
            return res.status(401).json({
                message: "Invalid refresh token"
            });
        }

        const newAccessToken = generateAccessToken({
            sessionId,
            userId,
            role:user.role
        });

        const newRefreshToken = generateRefreshToken({
            sessionId,
            userId,
            role:user.role
        });

        const newHashToken = await bcrypt.hash(newRefreshToken, 12);

        await Session.updateOne(
            { _id: sessionId },
            { $set: { refreshToken: newHashToken } }
        );



        await AuditLog.create({
            userId,
            action: "REFRESH_TOKEN",
            targetType: "USER",
            ipAdress: req.ip,
            userAgent: req.headers["user-agent"],
            metadata: { sessionId }
        });

        return res.status(200).json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        });

    }catch(err){

        return res.status(500).json({
            message: "Error refreshing token",
            error: err.message
        });
    }
};