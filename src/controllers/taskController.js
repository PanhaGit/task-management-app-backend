const Task = require("../models/Task");
const { logError } = require("../utils/logError");
const taskValidator = require("../validators/task_validata");
const SchedulerService = require("../services/scheduler_service");
const NotificationService = require("../services/notification_service");

const TaskController = {
    // បង្កើតកិច្ចការថ្មី
    async createTask(req, res) {
        try {
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

            // Send notification to task creator
            await NotificationService.sendTaskNotification(
                [req.current_id], // Send to creator
                savedTask._id,
                'created',
                {
                    title: `Task Created: ${savedTask.title}`,
                    body: `You have a new task to complete by ${new Date(savedTask.end_date).toLocaleString()}`
                }
            );

            res.status(201).json({
                data: savedTask,
                message: "Task created successfully",
                message_kh: "កិច្ចការត្រូវបានបង្កើតដោយជោគជ័យ"
            });

        } catch (error) {
            await logError("TaskController.createTask", error);
            res.status(500).json({
                error: "Failed to create task",
                error_kh: "បង្កើតកិច្ចការមិនជោគជ័យ",
                details: error.message
            });
        }
    },

    // យកកិច្ចការទាំងអស់
    getAllTasks: async (req, res) => {
        try {
            const tasks = await Task.find().populate('created_by', 'username email');
            res.status(200).json(tasks);
        } catch (e) {
            await logError("taskController.getAllTasks", e.message);
            res.status(500).json({
                error: "មិនអាចទាញយកកិច្ចការបាន",
                details: e.message
            });
        }
    },

    // យកកិច្ចការតាម ID
    getTaskById: async (req, res) => {
        try {
            const task = await Task.findById(req.params.id).populate('created_by', 'username email');

            if (!task) {
                return res.status(404).json({
                    error: "រកមិនឃើញកិច្ចការ",
                    details: `មិនមានកិច្ចការដែលមានលេខសម្គាល់ ${req.params.id}`
                });
            }

            res.status(200).json(task);
        } catch (e) {
            await logError("taskController.getTaskById", e.message);
            res.status(500).json({
                error: "មិនអាចទាញយកកិច្ចការបាន",
                details: e.message
            });
        }
    },

    // ធ្វើបច្ចុប្បន្នភាពកិច្ចការ
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
                    error: "រកមិនឃើញកិច្ចការ",
                    details: `មិនមានកិច្ចការដែលមានលេខសម្គាល់ ${req.params.id}`
                });
            }

            // កំណត់ពេលវេលារំលឹកឡើងវិញ
            await SchedulerService.scheduleTaskReminders(updatedTask);

            // ផ្ញើការជូនដំណឹងបើស្ថានភាពបានផ្លាស់ប្តូរ
            if (req.body.status) {
                await NotificationService.sendTaskNotification(
                    { status: () => {} },
                    updatedTask.created_by,
                    updatedTask._id,
                    'updated'
                );
            }

            res.status(200).json(updatedTask);
        } catch (e) {
            await logError("taskController.updateTask", e.message);
            res.status(500).json({
                error: "មិនអាចធ្វើបច្ចុប្បន្នភាពកិច្ចការបាន",
                details: e.message
            });
        }
    },

    // លុបកិច្ចការ
    deleteTask: async (req, res) => {
        try {
            const deletedTask = await Task.findByIdAndDelete(req.params.id);

            if (!deletedTask) {
                return res.status(404).json({
                    error: "រកមិនឃើញកិច្ចការ",
                    details: `មិនមានកិច្ចការដែលមានលេខសម្គាល់ ${req.params.id}`
                });
            }

            // បោះបង់ការរំលឹកទាំងអស់
            SchedulerService.cancelTaskReminders(req.params.id);

            // ផ្ញើការជូនដំណឹង
            await NotificationService.sendTaskNotification(
                { status: () => {} },
                deletedTask.created_by,
                deletedTask._id,
                'deleted'
            );

            res.status(200).json({ message: "កិច្ចការត្រូវបានលុបដោយជោគជ័យ" });
        } catch (e) {
            await logError("taskController.deleteTask", e.message);
            res.status(500).json({
                error: "មិនអាចលុបកិច្ចការបាន",
                details: e.message
            });
        }
    }
};

module.exports = TaskController;