const mongoose = require("mongoose");

const CategorySchema = new mongoose.Schema({
    title: {
        type: String,
        maxlength: 100,
        required: true
    },
    created_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
}, { timestamps: true });


module.exports= mongoose.model("Category", CategorySchema);