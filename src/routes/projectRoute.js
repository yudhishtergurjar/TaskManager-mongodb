import express from "express";
import "dotenv/config";
import { schemaMiddleware } from "../middlewares/schemaMiddleware.js"; 
import { authMiddleware } from "../middlewares/authMiddleware.js"; 
import { cacheMiddlewareProject } from "../middlewares/cacheMiddlewareProject.js";
import { createProjectSchema, updateProjectSchema } from "../validators/projectValidator.js";
import { isMember, isOwner } from "../middlewares/roleCheck.js"; 

import {addProject, readProject, updateProject,deleteProject,listProject, addMember, removeMember} from "../controllers/projectController.js";


const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Projects
 *   description: Project management endpoints
 */

router.use(authMiddleware);

/**
 * @swagger
 * /projects/add:
 *   post:
 *     summary: Create a new project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
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
 *     responses:
 *       201:
 *         description: Project successfully created
 *       400:
 *         description: Validation Error
 *       500:
 *         description: Internal server error
 */
router.post('/add', schemaMiddleware(createProjectSchema),addProject);

/**
 * @swagger
 * /projects/read/{id}:
 *   get:
 *     summary: Read project details
 *     tags: [Projects]
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
 *         description: Project details retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not a member
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 */
router.get('/read/:id' , isMember , cacheMiddlewareProject("readProject"), readProject);

/**
 * @swagger
 * /projects/update/{id}:
 *   patch:
 *     summary: Update a project
 *     tags: [Projects]
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
 *     responses:
 *       200:
 *         description: Project updated successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not the owner
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 */
router.patch("/update/:id",schemaMiddleware(updateProjectSchema), isOwner ,updateProject);

/**
 * @swagger
 * /projects/delete/{id}:
 *   delete:
 *     summary: Delete a project
 *     tags: [Projects]
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
 *         description: Project deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not the owner
 *       404:
 *         description: Project not found
 *       500:
 *         description: Internal server error
 */
router.delete("/delete/:id",isOwner ,deleteProject)

/**
 * @swagger
 * /projects/list:
 *   get:
 *     summary: List all projects the user is part of
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of projects
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/list", cacheMiddlewareProject("listProject"),listProject);

/**
 * @swagger
 * /projects/addMember/{id}:
 *   post:
 *     summary: Add a member to the project
 *     tags: [Projects]
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
 *               - memberId
 *             properties:
 *               memberId:
 *                 type: string
 *                 description: User ID of the new member
 *     responses:
 *       200:
 *         description: Member added successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not the owner
 *       404:
 *         description: Project or User not found
 *       500:
 *         description: Internal server error
 */
router.post("/addMember/:id", isOwner, addMember);

/**
 * @swagger
 * /projects/removeMember/{id}:
 *   post:
 *     summary: Remove a member from the project
 *     tags: [Projects]
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
 *               - memberId
 *             properties:
 *               memberId:
 *                 type: string
 *                 description: User ID of the member to remove
 *     responses:
 *       200:
 *         description: Member removed successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Not the owner
 *       404:
 *         description: Project or User not found
 *       500:
 *         description: Internal server error
 */
router.post("/removeMember/:id",isOwner,removeMember);


export default router;