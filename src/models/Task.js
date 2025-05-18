const mongoose = require("mongoose");

/**
 * Task Schema
 * @description Defines the structure of task documents in MongoDB
 * @author: Tho Panha
 */
const TaskSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        description: {
            type: String,
            required: false,
            trim: true,
            maxlength: 800,
        },
        status: {
            type: String,
            enum: ["todo", "in_progress", "done", "complete"],
            default: "todo",
        },
        start_date: {
            type: Date,
            required: true,
        },
        end_date: {
            type: Date,
            required: true,
        },
        hours: {
            type: Number,
            min: 0,
            max: 23,
        },
        minutes: {
            type: Number,
            min: 0,
            max: 59,
        },
        color: {
            type: String,
            default: "#ffffff"
        },
        created_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        category_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
            required: true
        }
    },
    {
        timestamps: true,
    }
);

/**
 * Pre-save hook to automatically update status when end date passes
 * @author: Tho Panha
 */
TaskSchema.pre('save', function(next) {
    const now = new Date();
    if (this.end_date < now && !['done', 'complete'].includes(this.status)) {
        this.status = 'complete';
    }
    next();
});

/**
 * Static method to update expired tasks
 * @returns {Promise} Result of the update operation
 * @author: Tho Panha
 */
TaskSchema.statics.updateExpiredTasks = async function() {
    const now = new Date();
    return this.updateMany(
        {
            end_date: { $lt: now },
            status: { $nin: ['done', 'complete'] }
        },
        { $set: { status: 'complete' } }
    );
};

module.exports = mongoose.model("Task", TaskSchema);