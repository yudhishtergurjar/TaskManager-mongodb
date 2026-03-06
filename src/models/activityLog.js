import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true,
            index: true,
        },

        action: {
            type: String,
            required: true,
            enum :
                [
                    "PROJECT_CREATED",
                    "PROJECT_UPDATED",
                    "PROJECT_DELETED",
                    "TASK_CREATED",
                    "TASK_UPDATED",
                    "TASK_DELETED",
                    "TASK_COMPLETED",
                    "MESSAGE_SENT",
                    "MESSAGE_EDITED",
                    "MESSAGE_DELETED",
                    "MEMBER_ADDED",
                    "MEMBER_REMOVED",
                ],
        },

        entityType: {
            type: String,
            enum: ["PROJECT", "TASK", "MESSAGE", "MEMBER"],
            required: true,
        },

        metadata: {
            type: Object,
            default: {},
        },
    },
    { timestamps: { createdAt: true, updatedAt: false }, }
);

export default mongoose.model("ActivityLog", activityLogSchema);