import express from "express";
import {getMessages, editMessage, deleteMessage} from "../controllers/messageController.js";

import { authMiddleware } from "../middlewares/authMiddleware.js";
import { isMember } from "../middlewares/roleCheck.js";

const router = express.Router();

router.use(authMiddleware);

router.get("/:id",isMember, getMessages);
router.patch("/messages/:id", editMessage);
router.delete("/messages/:id", deleteMessage);

export default router;
