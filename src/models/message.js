import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Project",
            required: true,
            index: true,
        },
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        content: {
            type: String,
            required: true,
            trim: true,
        },
        attachments: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "File",//file create krni ha
            },
        ],
        deletedAt: {
            type: Date,
            default: null,
            index: true,
        },
    },
    { timestamps: { createdAt: true, updatedAt: true }, }
);

messageSchema.index({projectId:1,createdAt:-1});

export default mongoose.model("Message", messageSchema);