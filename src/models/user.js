import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            trim: true,
            minlength: 3,
            maxlength: 30,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            index: true,
        },

        password: {
            type: String,
            required: true,
        },

        provider: {
            type: String,
            enum: ["local", "google", "github"],
            default: "local",
        },

        lastActiveAt: {
            type: Date,
            default: Date.now,
        },

        role: {
            type: String,
            enum: ["USER", "ADMIN"],
            default: "USER"
        },

        deletedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true, }
);

export default mongoose.model("User", userSchema);