const Task = require("../models/Task");
const taskValidator = require("../validators/task_validata");
const SchedulerService = require("../services/scheduler_service");
const NotificationService = require("../services/notification_service");
const { logError } = require("../utils/logError");
const mongoose = require("mongoose");

/**
 * Task Controller
 * @description Handles all task-related operations (CRUD, scheduling, notifications)
 * @author: Tho Panha
 */
const TaskController = {
    /**
     * Create a new task
     * @param {Object} req - Request object with task details
     * @param {Object} res - Response object
     * @author: Tho Panha
     */
    async createTask(req, res) {
        try {
            await taskValidator.create(req.body);
            const { title, description, status, start_date, end_date, hours, minutes, category_id ,color } = req.body;

            const newTask = new Task({
                title,
                description,
                status: status || "todo",
                start_date,
                end_date,
                hours: hours || 0,
                minutes: minutes || 0,
                color: color || "#ffffff",
                created_by: req.current_id,
                category_id
            });

            const savedTask = await newTask.save();
            await SchedulerService.scheduleTaskReminders(savedTask);

            // Populate the category before sending response
            const populatedTask = await Task.findById(savedTask._id)
                .populate('category_id', 'title')
                .populate('created_by', 'first_name last_name');

            await NotificationService.sendTaskNotification(
                [req.current_id],
                savedTask._id,
                'created',
                {
                    title: `Task Created: ${savedTask.title}`,
                    body: `You have a new task to complete by ${new Date(savedTask.end_date).toLocaleString()}`
                }
            );

            return res.status(201).json({
                data: populatedTask,
                message: "Task created successfully"
            });

        } catch (error) {
            await logError("TaskController.createTask", error);
            return res.status(500).json({
                error: "Failed to create task",
                details: error.message
            });
        }
    },

    /**
     * Get all tasks for current user
     * @param {Object} req - Request object
     * @param {Object} res - Response object
     * @author: Tho Panha
     */
    getAllTasks: async (req, res) => {
        try {
            // Update any expired tasks first
            await Task.updateExpiredTasks();

            const tasks = await Task.find({ created_by: req.current_id })
                .populate('created_by', 'first_name last_name phone_number email')
                .populate({
                    path: 'category_id',
                    select: 'title'
                });

            return res.status(200).json({
                success: true,
                data: tasks,
                message: "Task list fetched successfully"
            });
        } catch (e) {
            await logError("taskController.getAllTasks", e);
            return res.status(500).json({
                success: false,
                error: "Failed to fetch tasks",
                details: e.message
            });
        }
    },

    /**
     * Get single task by ID
     * @param {Object} req - Request object with task ID
     * @param {Object} res - Response object
     * @author: Tho Panha
     */
    getTaskById: async (req, res) => {
        try {
            const task = await Task.findById(req.params.id)
                .populate('created_by', 'username email')
                .populate('category_id', 'title');

            if (!task) {
                return res.status(404).json({
                    error: "Task not found",
                    details: `Task with ID ${req.params.id} not found`
                });
            }

            // Check and update status if needed
            if (task.end_date < new Date() && !['done', 'complete'].includes(task.status)) {
                const updatedTask = await Task.findByIdAndUpdate(
                    task._id,
                    { status: 'complete' },
                    { new: true }
                ).populate('category_id', 'title');
                return res.status(200).json(updatedTask);
            }

            return res.status(200).json(task);
        } catch (e) {
            await logError("taskController.getTaskById", e);
            return res.status(500).json({
                error: "Failed to fetch task",
                details: e.message
            });
        }
    },

    /**
     * Update existing task
     * @param {Object} req - Request object with updated task data
     * @param {Object} res - Response object
     * @author: Tho Panha
     */
    updateTask: async (req, res) => {
        try {
            await taskValidator.update(req.body);

            const updatedTask = await Task.findByIdAndUpdate(
                req.params.id,
                req.body,
                {
                    new: true,
                    runValidators: true
                }
            )
                .populate('category_id', 'title')
                .populate('created_by', 'first_name last_name');

            if (!updatedTask) {
                return res.status(404).json({
                    error: "Task not found",
                    details: `Task with ID ${req.params.id} not found`
                });
            }

            await SchedulerService.scheduleTaskReminders(updatedTask);

            if (req.body.status) {
                await NotificationService.sendTaskNotification(
                    [updatedTask.created_by],
                    updatedTask._id,
                    'updated',
                    {
                        title: `Task Updated: ${updatedTask.title}`,
                        body: `Task status changed to ${updatedTask.status}`
                    }
                );
            }

            return res.status(200).json(updatedTask);
        } catch (e) {
            await logError("taskController.updateTask", e);
            return res.status(500).json({
                error: "Failed to update task",
                details: e.message
            });
        }
    },

    /**
     * Delete task
     * @param {Object} req - Request object with task ID
     * @param {Object} res - Response object
     * @author: Tho Panha
     */
    deleteTask: async (req, res) => {
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Find and delete the task
            const deletedTask = await Task.findByIdAndDelete(req.params.id)
                .session(session)
                .lean();

            if (!deletedTask) {
                await session.abortTransaction();
                return res.status(404).json({
                    success: false,
                    error: "Task not found",
                    details: `Task with ID ${req.params.id} not found`
                });
            }

            // Cancel any scheduled reminders
            await SchedulerService.cancelTaskReminders(req.params.id);

            // Send notification (fire-and-forget)
            NotificationService.sendTaskNotification(
                [deletedTask.created_by],
                deletedTask._id,
                'deleted',
                {
                    title: `Task Deleted: ${deletedTask.title}`,
                    body: `Task has been removed from your list`
                }
            ).catch(error => {
                console.error("Notification failed:", error);
            });

            await session.commitTransaction();
            return res.status(200).json({
                success: true,
                message: "Task deleted successfully",
                data: {
                    id: deletedTask._id,
                    title: deletedTask.title,
                    deletedAt: new Date()
                }
            });

        } catch (error) {
            await session.abortTransaction();
            await logError("taskController.deleteTask", error);
            return res.status(500).json({
                success: false,
                error: "Failed to delete task",
                details: process.env.NODE_ENV === 'development'
                    ? error.message
                    : 'Internal server error'
            });
        } finally {
            session.endSession();
        }
    }
};

module.exports = TaskController;