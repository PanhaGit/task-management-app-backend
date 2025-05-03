const mongoose = require("mongoose");

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
        created_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        }
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Task", TaskSchema);