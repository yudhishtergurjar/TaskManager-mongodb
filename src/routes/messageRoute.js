import express from "express";
import {getMessages, editMessage, deleteMessage} from "../controllers/messageController.js";

import { authMiddleware } from "../middlewares/authMiddleware.js";
import { isMember } from "../middlewares/roleCheck.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Messages
 *   description: Message management endpoints
 */

router.use(authMiddleware);

/**
 * @swagger
 * /message/{id}:
 *   get:
 *     summary: Get messages for a given topic or chat
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Message thread or chat ID
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *       403:
 *         description: Forbidden - Not a member
 *       500:
 *         description: Internal server error
 */
router.get("/:id",isMember, getMessages);

/**
 * @swagger
 * /message/edit/{id}:
 *   patch:
 *     summary: Edit a message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Message ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message updated successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Message not found
 *       500:
 *         description: Internal server error
 */
router.patch("/edit/:id", editMessage);

/**
 * @swagger
 * /message/delete/{id}:
 *   delete:
 *     summary: Delete a message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Message ID
 *     responses:
 *       200:
 *         description: Message deleted successfully
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Message not found
 *       500:
 *         description: Internal server error
 */
router.delete("/delete/:id", deleteMessage);

export default router;
