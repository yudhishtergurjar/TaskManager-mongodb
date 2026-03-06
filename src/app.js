import express from "express";
import cookieParser from "cookie-parser";
import userRoute from "./routes/userRoute.js";
import projectRoute from "./routes/ProjectRoute.js";
import taskRoute from "./routes/taskRoute.js";
import messageRoute from "./routes/messageRoute.js";

const app = express();

// Middlewares
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/auth", userRoute);
app.use("/projects", projectRoute);
app.use("/tasks", taskRoute);
app.use("/message", messageRoute)

export default app;