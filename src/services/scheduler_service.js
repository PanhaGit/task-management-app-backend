const schedule = require('node-schedule');
const NotificationService = require('../services/notification_service');
const { logError } = require("../utils/logError");
const Task = require('../models/Task');

const SchedulerService = {
    scheduledJobs: {}, // ផ្ទុកការងារដែលបានកំណត់ពេលវេលា

    // កំណត់ពេលវេលារំលឹកសម្រាប់កិច្ចការ
    async scheduleTaskReminders(task) {
        try {
            // បោះបង់ការរំលឹកចាស់ទាំងអស់
            this.cancelTaskReminders(task._id);

            const reminderIntervals = [20, 15, 10, 5, 2]; // គិតជានាទី
            const now = new Date();
            const dueDate = new Date(task.end_date);

            // កំណត់ពេលវេលារំលឹកសម្រាប់កិច្ចការដែលមិនទាន់បានបញ្ចប់
            if (!['done', 'complete'].includes(task.status)) {
                reminderIntervals.forEach(minutes => {
                    const reminderTime = new Date(dueDate.getTime() - minutes * 60000);

                    // កំណត់ពេលវេលារំលឹកបើវានៅអនាគត
                    if (reminderTime > now) {
                        const job = schedule.scheduleJob(reminderTime, async () => {
                            try {
                                // ពិនិត្យមើលកិច្ចការថ្មីៗ
                                const freshTask = await Task.findById(task._id);

                                // ផ្ញើការជូនដំណឹងបើកិច្ចការនៅតែមាន និងមិនទាន់បានបញ្ចប់
                                if (freshTask && !['done', 'complete'].includes(freshTask.status)) {
                                    await NotificationService.sendTaskNotification(
                                        { status: () => {} }, // ការឆ្លើយតបម៉ូក
                                        task.created_by,
                                        task._id,
                                        'due_soon',
                                        {
                                            minutes,
                                            title: `កិច្ចការនឹងដល់ពេលកំណត់: ${task.title}`,
                                            body: `កិច្ចការ "${task.title}" នឹងដល់ពេលកំណត់ក្នុងរយៈពេល ${minutes} នាទី`
                                        }
                                    );
                                }
                            } catch (err) {
                                await logError("SchedulerService.reminderJob", err);
                            }
                        });

                        // រក្សាទុកការងារដែលបានកំណត់ពេលវេលា
                        this.scheduledJobs[`${task._id}_${minutes}`] = job;
                    }
                });
            }

            // កំណត់ពេលវេលារំលឹកពេលដល់ពេលកំណត់
            if (dueDate > now) {
                const job = schedule.scheduleJob(dueDate, async () => {
                    try {
                        const freshTask = await Task.findById(task._id);
                        if (freshTask && !['done', 'complete'].includes(freshTask.status)) {
                            await NotificationService.sendTaskNotification(
                                { status: () => {} },
                                task.created_by,
                                task._id,
                                'overdue',
                                {
                                    title: `កិច្ចការដល់ពេលកំណត់: ${task.title}`,
                                    body: `កិច្ចការ "${task.title}" ដល់ពេលកំណត់ហើយ!`
                                }
                            );
                        }
                    } catch (err) {
                        await logError("SchedulerService.dueNowJob", err);
                    }
                });
                this.scheduledJobs[`${task._id}_due_now`] = job;
            }

        } catch (err) {
            await logError("SchedulerService.scheduleTaskReminders", err);
        }
    },

    // បោះបង់ការរំលឹកសម្រាប់កិច្ចការជាក់លាក់
    cancelTaskReminders(taskId) {
        Object.keys(this.scheduledJobs).forEach(key => {
            if (key.startsWith(taskId)) {
                this.scheduledJobs[key].cancel();
                delete this.scheduledJobs[key];
            }
        });
    },

    // កំណត់ពេលវេលារំលឹកឡើងវិញសម្រាប់កិច្ចការទាំងអស់
    async rescheduleAllTasks() {
        try {
            // បោះបង់ការងារចាស់ទាំងអស់
            Object.values(this.scheduledJobs).forEach(job => job.cancel());
            this.scheduledJobs = {};

            // យកកិច្ចការទាំងអស់ដែលមិនទាន់បានបញ្ចប់
            const tasks = await Task.find({
                end_date: { $gt: new Date() },
                status: { $nin: ['done', 'complete'] }
            });

            // កំណត់ពេលវេលារំលឹកសម្រាប់រាល់កិច្ចការ
            for (const task of tasks) {
                await this.scheduleTaskReminders(task);
            }

            // console.log(`បានកំណត់ពេលវេលារំលឹកឡើងវិញសម្រាប់ ${tasks.length} កិច្ចការ`);
        } catch (err) {
            await logError("SchedulerService.rescheduleAllTasks", err);
        }
    }
};

// កំណត់ពេលវេលារំលឹកឡើងវិញនៅពេលចាប់ផ្តើមសឺវ័រ
SchedulerService.rescheduleAllTasks();

// កំណត់ពេលវេលារំលឹកឡើងវិញរាល់ម៉ោង
setInterval(() => {
    SchedulerService.rescheduleAllTasks();
}, 60 * 60 * 1000); // 1 ម៉ោង

module.exports = SchedulerService;