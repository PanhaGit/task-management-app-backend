import { Request, Response } from "express";
import {TaskService} from "../services/task.service";

export class TaskController {
    private taskService = new TaskService();

    // Get all tasks
    async getAllTasks(req: Request, res: Response) {
        try {
            const tasks = await this.taskService.getAllTasks();
            res.status(200).json(tasks);
        } catch (error) {
            res.status(500).json({ message: "Failed to fetch tasks" });
        }
    }


    // Create a new task
    async createTask(req: Request, res: Response) {
        try {
            const task = await this.taskService.createTask(req.body);
            res.status(201).json(task);
        } catch (error) {
            res.status(500).json({ message: "Failed to create task" });
        }
    }

    // Get a task by ID
    async getTaskById(req: Request, res: Response) {
        try {
            const task = await this.taskService.getTaskById(req.params.id);
            if (task) {
                res.status(200).json(task);
            } else {
                res.status(404).json({ message: "Task not found" });
            }
        } catch (error) {
            res.status(500).json({ message: "Failed to fetch task" });
        }
    }

    // Delete a task by ID
    async deleteTask(req: Request, res: Response) {
        try {
            const isDeleted = await this.taskService.deleteTask(req.params.id);
            if (isDeleted) {
                res.status(200).json({ message: "Task deleted successfully" });
            } else {
                res.status(404).json({ message: "Task not found" });
            }
        } catch (error) {
            res.status(500).json({ message: "Failed to delete task" });
        }
    }

    // Update a task by ID
    async updateTask(req: Request, res: Response) {
        try {
            const task = await this.taskService.updateTask(req.params.id, req.body);
            if (task) {
                res.status(200).json(task);
            } else {
                res.status(404).json({ message: "Task not found" });
            }
        } catch (error) {
            res.status(500).json({ message: "Failed to update task" });
        }
    }


}