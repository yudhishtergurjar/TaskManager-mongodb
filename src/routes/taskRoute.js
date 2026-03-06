import express from "express";
import "dotenv/config";
import { schemaMiddleware } from "../middlewares/schemaMiddleware.js"; 
import { authMiddleware } from "../middlewares/authMiddleware.js"; 
import { cacheMiddlewareTask } from "../middlewares/cacheMiddlewareTask.js";
import { createTaskSchema, updateTaskSchema } from "../validators/taskValidator.js";
import { isMember, isOwner } from "../middlewares/roleCheck.js"; 

import {addTask,assignedTasks,totalTasks,updateTask,markCompletedTask,deleteTask} from "../controllers/taskController.js";


const router = express.Router();
router.use(authMiddleware);
// read krne wale route pe isOwner, isMember lgana jruri ha so that we maintaon redis key.

//id:projectId
router.post('/add/:id' ,schemaMiddleware(createTaskSchema), isOwner ,addTask);//isOwnerMiddleware run

//id:ProjectId
router.get('/assigned/:id', isOwner, cacheMiddlewareTask("assignedTasks") ,assignedTasks);

//id:projectId
router.get('/totalTasks/:id', isOwner, cacheMiddlewareTask("totalTasks") ,totalTasks);

//id:taskId
router.patch("/update/:id",schemaMiddleware(updateTaskSchema),updateTask);

//id:taskid
router.get("/markCompleted/:id",markCompletedTask)

//id:taskId
router.delete("/delete/:id",deleteTask);

export default router;