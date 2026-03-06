import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const sessionSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: uuidv4,
    },

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    isActive: {
        type: Boolean,
        default: true,
        required: true,
        index:true
    },

    refreshToken: {
        type: String,
        required: true,
    },

    expiresAt: {
        type: Date,
        required: true,
    },

    ipAddress: String,
    userAgent: String,
},
{ timestamps: true, });

//it deletes document when session expire
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("Session", sessionSchema);