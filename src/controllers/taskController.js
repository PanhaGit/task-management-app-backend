const Task = require("../models/Task");
const { logError } = require("../utils/logError");
const taskValidator = require("../validators/task_validata");

const TaskController = {
    createTask: async (req, res) => {
        try {
            await taskValidator.create(req.body);

            const { title, description, status, start_date, end_date, hours, minutes } = req.body;

            const newTask = new Task({
                title,
                description,
                status: status || "todo",
                start_date,
                end_date,
                hours: hours || 0,
                minutes: minutes || 0,
                created_by: req.current_id
            });

            const savedTask = await newTask.save();
            res.status(201).json({
                data:savedTask,
                message: `Task created successfully.`,
            });
        } catch (e) {
            await logError("taskController.createTask", e.message);

            if (e.isJoi) {
                return res.status(400).json({
                    error: "Validation error",
                    details: e.details.map(d => ({
                        field: d.path[0],
                        message: d.message
                    }))
                });
            }

            res.status(500).json({
                error: "Failed to create task",
                details: e.message
            });
        }
    },

    getAllTasks: async (req, res) => {
        try {
            const tasks = await Task.find().populate('created_by', 'username email');
            res.status(200).json(tasks);
        } catch (e) {
            await logError("taskController.getAllTasks", e.message);
            res.status(500).json({
                error: "Failed to fetch tasks",
                details: e.message
            });
        }
    },

    getTaskById: async (req, res) => {
        try {
            const task = await Task.findById(req.params.id).populate('created_by', 'username email');

            if (!task) {
                return res.status(404).json({
                    error: "Task not found",
                    details: `No task found with id ${req.params.id}`
                });
            }

            res.status(200).json(task);
        } catch (e) {
            await logError("taskController.getTaskById", e.message);
            res.status(500).json({
                error: "Failed to fetch task",
                details: e.message
            });
        }
    },

    updateTask: async (req, res) => {
        try {
            await taskValidator.update(req.body);

            const updatedTask = await Task.findByIdAndUpdate(
                req.params.id,
                req.body,
                { new: true, runValidators: true }
            );

            if (!updatedTask) {
                return res.status(404).json({
                    error: "Task not found",
                    details: `No task found with id ${req.params.id}`
                });
            }

            res.status(200).json(updatedTask);
        } catch (e) {
            await logError("taskController.updateTask", e.message);

            if (e.isJoi) {
                return res.status(400).json({
                    error: "Validation error",
                    details: e.details.map(d => ({
                        field: d.path[0],
                        message: d.message
                    }))
                });
            }

            res.status(500).json({
                error: "Failed to update task",
                details: e.message
            });
        }
    },

    deleteTask: async (req, res) => {
        try {
            const deletedTask = await Task.findByIdAndDelete(req.params.id);

            if (!deletedTask) {
                return res.status(404).json({
                    error: "Task not found",
                    details: `No task found with id ${req.params.id}`
                });
            }

            res.status(200).json({ message: "Task deleted successfully" });
        } catch (e) {
            await logError("taskController.deleteTask", e.message);
            res.status(500).json({
                error: "Failed to delete task",
                details: e.message
            });
        }
    },

    getTasksByStatus: async (req, res) => {
        try {
            const tasks = await Task.find({ status: req.params.status })
                .populate('created_by', 'username email');
            res.status(200).json(tasks);
        } catch (e) {
            await logError("taskController.getTasksByStatus", e.message);
            res.status(500).json({
                error: "Failed to fetch tasks by status",
                details: e.message
            });
        }
    }
};

module.exports = TaskController;