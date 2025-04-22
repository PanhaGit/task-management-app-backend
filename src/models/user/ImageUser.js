const mongoose = require('mongoose');

const imagesUserSchema = new mongoose.Schema({
    image_profile: {
        type: [String],
        default: []
    },
    image_cover: {
        type: [String],
        default: []
    }
},{ timestamps: true });

module.exports = mongoose.model('images_user', imagesUserSchema);
