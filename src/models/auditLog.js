import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
            index: true,
        },

        action: {
            type: String,
            required: true,
            enum: [
                "USER_LOGIN",
                "USER_LOGOUT",
                "PASSWORD_CHANGED",
                "PROJECT_DELETED",
                "ROLE_CHANGED",
                "SESSION_CREATED",
                "SESSION_REVOKED",
                "USER_REGISTERED",
                "REFRESH_TOKEN"
            ],
        },

        targetType: {
            type: String,
            enum: ["USER", "PROJECT", "SESSION"],
            required: true,
        },
        
        ipAddress: String,
        userAgent: String,

        metadata: {
            type: Object,
            default: {},
        },
    },
    { timestamps: true, }
);
export default mongoose.model("AuditLog", auditLogSchema);