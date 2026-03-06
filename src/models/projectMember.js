import mongoose from "mongoose";

const projectMemberSchema = new mongoose.Schema(
    {
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true,
            index: true,
        },

        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        role: {
            type: String,
            enum: ["OWNER", "MEMBER"],
            default: "MEMBER",
        },

        joinedAt: {
            type: Date,
            default: Date.now,
        },
        removedAt: {
            type: Date,
            default : null
        }
    }, 
    { timestamps: false, }
);

projectMemberSchema.index({ projectId: 1, userId: 1 }, { unique: true });
export default mongoose.model("ProjectMember", projectMemberSchema);