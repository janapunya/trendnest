const mongoose = require('mongoose');

const likeSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'productData',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Create compound index to ensure unique likes
likeSchema.index({ email: 1, productId: 1 }, { unique: true });

module.exports = mongoose.model('like', likeSchema); 