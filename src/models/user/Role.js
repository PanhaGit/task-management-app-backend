const mongoose = require('mongoose');

/**
 * Role : Admin
 *        User
 * */


const roleSchema = new mongoose.Schema({
    role_name: {
        type: String,
        required: true,
        unique: true,
        enum: ['admin', 'user'],
        default:"user"
    },
    permissions: {
        type: [String],
        default: []
    }
});

module.exports = mongoose.model('role', roleSchema);