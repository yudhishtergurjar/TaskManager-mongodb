import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
    {
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true,
            index: true,
        },

        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },

        description: {
            type: String,
            default: "",
        },

        status: {
            type: String,
            enum: ["PENDING", "IN_PROGRESS", "DONE"],
            default: "PENDING",
            index: true,
        },

        assigneeId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
            index: true,
        },

        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },

        deadline: {
            type: Date,
            default: null,
            index: true,
        },
    },
    { timestamps: true }
);

taskSchema.index({ projectId: 1, status: 1 });

export default mongoose.model("Task", taskSchema);