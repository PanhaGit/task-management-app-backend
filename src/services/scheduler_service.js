const schedule = require('node-schedule');
const NotificationService = require('../services/notification_service');
const { logError } = require("../utils/logError");
const Task = require('../models/Task');

/**
 * Scheduler Service
 * @description Handles task reminders and notifications scheduling
 * @author: Tho Panha
 */
const SchedulerService = {
    scheduledJobs: {}, // Stores all scheduled jobs

    /**
     * Schedule reminders for a task
     * @param {Object} task - The task to schedule reminders for
     * @author: Tho Panha
     */
    async scheduleTaskReminders(task) {
        try {
            // Cancel any existing reminders for this task
            this.cancelTaskReminders(task._id);

            const reminderIntervals = [20, 15, 10, 5, 2]; // Minutes before due
            const now = new Date();
            const dueDate = new Date(task.end_date);

            // Schedule reminders for incomplete tasks
            if (!['done', 'complete'].includes(task.status)) {
                reminderIntervals.forEach(minutes => {
                    const reminderTime = new Date(dueDate.getTime() - minutes * 60000);

                    // Schedule if reminder is in the future
                    if (reminderTime > now) {
                        const job = schedule.scheduleJob(reminderTime, async () => {
                            try {
                                const freshTask = await Task.findById(task._id);

                                if (freshTask && !['done', 'complete'].includes(freshTask.status)) {
                                    await NotificationService.sendTaskNotification(
                                        [task.created_by],
                                        task._id,
                                        'due_soon',
                                        {
                                            title: `Task Due Soon: ${task.title}`,
                                            body: `Task "${task.title}" is due in ${minutes} minutes`
                                        }
                                    );
                                }
                            } catch (err) {
                                await logError("SchedulerService.reminderJob", err);
                            }
                        });

                        // Store the scheduled job
                        this.scheduledJobs[`${task._id}_${minutes}`] = job;
                    }
                });
            }

            // Schedule completion handler at end_date
            if (dueDate > now) {
                const job = schedule.scheduleJob(dueDate, async () => {
                    try {
                        const freshTask = await Task.findByIdAndUpdate(
                            task._id,
                            { status: 'complete' },
                            { new: true }
                        );

                        if (freshTask) {
                            await NotificationService.sendTaskNotification(
                                [task.created_by],
                                task._id,
                                'completed',
                                {
                                    title: `Task Completed: ${task.title}`,
                                    body: `Task has been automatically marked as complete`
                                }
                            );
                        }
                    } catch (err) {
                        await logError("SchedulerService.completionJob", err);
                    }
                });
                this.scheduledJobs[`${task._id}_complete`] = job;
            }

        } catch (err) {
            await logError("SchedulerService.scheduleTaskReminders", err);
        }
    },

    /**
     * Cancel all reminders for a specific task
     * @param {String} taskId - ID of the task to cancel reminders for
     * @author: Tho Panha
     */
    cancelTaskReminders(taskId) {
        Object.keys(this.scheduledJobs).forEach(key => {
            if (key.startsWith(taskId)) {
                this.scheduledJobs[key].cancel();
                delete this.scheduledJobs[key];
            }
        });
    },

    /**
     * Reschedule reminders for all tasks
     * @author: Tho Panha
     */
    async rescheduleAllTasks() {
        try {
            // Cancel all existing jobs
            Object.values(this.scheduledJobs).forEach(job => job.cancel());
            this.scheduledJobs = {};

            // Get all incomplete future tasks
            const tasks = await Task.find({
                end_date: { $gt: new Date() },
                status: { $nin: ['done', 'complete'] }
            });

            // Reschedule reminders for each task
            for (const task of tasks) {
                await this.scheduleTaskReminders(task);
            }

        } catch (err) {
            await logError("SchedulerService.rescheduleAllTasks", err);
        }
    }
};

// Initialize scheduling on server start
SchedulerService.rescheduleAllTasks();

// Hourly maintenance job
setInterval(() => {
    Task.updateExpiredTasks();
    SchedulerService.rescheduleAllTasks();
}, 60 * 60 * 1000);

module.exports = SchedulerService;