import express from "express";
import "dotenv/config";
import { schemaMiddleware } from "../middlewares/schemaMiddleware.js"; 
import { userRegisterSchema, userLoginSchema } from "../validators/authValidator.js";

import { registerUser,loginUser,logoutUser,refreshToken } from "../controllers/userController.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: User authentication endpoints
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       201:
 *         description: User successfully registered
 *       400:
 *         description: Validation Error or User already exists
 *       500:
 *         description: Internal server error
 */
router.post('/register',schemaMiddleware(userRegisterSchema),registerUser);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user and receive tokens
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *                 user:
 *                   type: object
 *       400:
 *         description: Invalid credentials
 *       500:
 *         description: Internal server error
 */
router.post('/login',schemaMiddleware(userLoginSchema),loginUser)

/**
 * @swagger
 * /auth/logout:
 *   get:
 *     summary: Logout user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get('/logout',logoutUser);

/**
 * @swagger
 * /auth/refreshToken:
 *   get:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     description: Uses the refresh token stored in cookies to get a new access token
 *     responses:
 *       200:
 *         description: Token successfully refreshed
 *       401:
 *         description: Unauthorized - Invalid or expired refresh token
 *       500:
 *         description: Internal server error
 */
router.get('/refreshToken',refreshToken);


export default router;