import { ObjectId } from "mongodb";
import AppDataSource from "../config/app_data_source";
import {Task} from "../entities/task.entity";

export class TaskService {
    private taskRepository = AppDataSource.getMongoRepository(Task);

    // Create a new task
    async createTask(taskData: Partial<Task>): Promise<Task> {
        const task = this.taskRepository.create(taskData);
        return await this.taskRepository.save(task);
    }

    // Get a task by ID
    async getTaskById(id: string): Promise<Task | null> {
        return await this.taskRepository.findOneBy({ _id: new ObjectId(id) });
    }

    // Delete a task by ID
    async deleteTask(id: string): Promise<boolean> {
        const result = await this.taskRepository.deleteOne({ _id: new ObjectId(id) });
        return result.acknowledged && result.deletedCount > 0;
    }

    // Update a task by ID
    async updateTask(id: string, taskData: Partial<Task>): Promise<Task | null> {
        await this.taskRepository.updateOne({ _id: new ObjectId(id) }, { $set: taskData });
        return this.getTaskById(id);
    }

    // Get all tasks
    async getAllTasks(): Promise<Task[]> {
        return await this.taskRepository.find();
    }
}