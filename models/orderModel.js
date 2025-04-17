const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true
    },
    products: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'productData',
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        price: {
            type: Number,
            required: true
        }
    }],
    totalAmount: {
        type: Number,
        required: true
    },
    shippingAddress: {
        address: String,
        city: String,
        state: String,
        pincode: String
    },
    paymentMethod: {
        type: String,
        enum: ['COD', 'UPI', 'Card'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('order', orderSchema); 