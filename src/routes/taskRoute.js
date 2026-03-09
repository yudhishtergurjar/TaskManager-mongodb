import express from "express";
import "dotenv/config";
import { schemaMiddleware } from "../middlewares/schemaMiddleware.js"; 
import { authMiddleware } from "../middlewares/authMiddleware.js"; 
import { cacheMiddlewareTask } from "../middlewares/cacheMiddlewareTask.js";
import { createTaskSchema, updateTaskSchema } from "../validators/taskValidator.js";
import { isMember, isOwner } from "../middlewares/roleCheck.js"; 

import {addTask,assignedTasks,totalTasks,updateTask,markCompletedTask,deleteTask} from "../controllers/taskController.js";


const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: Task management endpoints
 */

router.use(authMiddleware);
// read krne wale route pe isOwner, isMember lgana jruri ha so that we maintaon redis key.

/**
 * @swagger
 * /tasks/add/{id}:
 *   post:
 *     summary: Add a task to a project
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [TODO, IN_PROGRESS, DONE]
 *               assignedTo:
 *                 type: string
 *                 description: User ID (optional)
 *               dueDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Task successfully created
 *       400:
 *         description: Validation Error
 *       403:
 *         description: Forbidden - Not the owner
 *       500:
 *         description: Internal server error
 */
//id:projectId
router.post('/add/:id' ,schemaMiddleware(createTaskSchema), isOwner ,addTask);//isOwnerMiddleware run

/**
 * @swagger
 * /tasks/assigned/{id}:
 *   get:
 *     summary: Get tasks assigned to a specific user or in a project
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Tasks retrieved successfully
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
//id:ProjectId
router.get('/assigned/:id', isOwner, cacheMiddlewareTask("assignedTasks") ,assignedTasks);

/**
 * @swagger
 * /tasks/totalTasks/{id}:
 *   get:
 *     summary: Get all tasks in a project
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Project ID
 *     responses:
 *       200:
 *         description: All tasks retrieved successfully
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
//id:projectId
router.get('/totalTasks/:id', isOwner, cacheMiddlewareTask("totalTasks") ,totalTasks);

/**
 * @swagger
 * /tasks/update/{id}:
 *   patch:
 *     summary: Update a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [TODO, IN_PROGRESS, DONE]
 *               dueDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Task updated successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Task not found
 *       500:
 *         description: Internal server error
 */
//id:taskId
router.patch("/update/:id",schemaMiddleware(updateTaskSchema),updateTask);

/**
 * @swagger
 * /tasks/markCompleted/{id}:
 *   get:
 *     summary: Mark a task as completed
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task marked as completed
 *       404:
 *         description: Task not found
 *       500:
 *         description: Internal server error
 */
//id:taskid
router.get("/markCompleted/:id",markCompletedTask)

/**
 * @swagger
 * /tasks/delete/{id}:
 *   delete:
 *     summary: Delete a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *       404:
 *         description: Task not found
 *       500:
 *         description: Internal server error
 */
//id:taskId
router.delete("/delete/:id",deleteTask);

export default router;