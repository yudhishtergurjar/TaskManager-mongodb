import express from "express";
import cookieParser from "cookie-parser";
import userRoute from "./routes/userRoute.js";
import projectRoute from "./routes/ProjectRoute.js";
import taskRoute from "./routes/taskRoute.js";
import messageRoute from "./routes/messageRoute.js";
import swaggerUi from "swagger-ui-express";
import { swaggerDocs } from "./config/swagger.js";

const app = express();

// Swagger Documentation Route
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Middlewares
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/auth", userRoute);
app.use("/projects", projectRoute);
app.use("/tasks", taskRoute);
app.use("/message", messageRoute)

export default app;