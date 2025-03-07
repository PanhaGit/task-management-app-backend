// src/routes/task.routes.ts
import express from "express";
import { TaskController } from "../controller/task.controller";

const router = express.Router();
const taskController = new TaskController();

router.get('/v1/tasks', taskController.getAllTasks.bind(taskController));
router.post('/v1/tasks', taskController.createTask.bind(taskController));
router.put('/v1/tasks/:id', taskController.updateTask.bind(taskController));
router.get('/v1/tasks/:id', taskController.getTaskById.bind(taskController));
router.delete('/v1/tasks/:id', taskController.deleteTask.bind(taskController));
export default router;