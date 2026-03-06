import express from "express";
import "dotenv/config";
import { schemaMiddleware } from "../middlewares/schemaMiddleware.js"; 
import { authMiddleware } from "../middlewares/authMiddleware.js"; 
import { cacheMiddlewareProject } from "../middlewares/cacheMiddlewareProject.js";
import { createProjectSchema, updateProjectSchema } from "../validators/projectValidator.js";
import { isMember, isOwner } from "../middlewares/roleCheck.js"; 

import {addProject, readProject, updateProject,deleteProject,listProject, addMember, removeMember} from "../controllers/projectController.js";


const router = express.Router();
router.use(authMiddleware);

router.post('/add', schemaMiddleware(createProjectSchema),addProject);

router.get('/read/:id' , isMember , cacheMiddlewareProject("readProject"), readProject);

router.patch("/update/:id",schemaMiddleware(updateProjectSchema), isOwner ,updateProject);

router.delete("/delete/:id",isOwner ,deleteProject)

router.get("/list", cacheMiddlewareProject("listProject"),listProject);

router.post("/addMember/:id", isOwner, addMember);

router.post("/removeMember/:id",isOwner,removeMember);


export default router;