const express = require('express');
const router = express.Router();
const orderModel = require('../models/orderModel');
const cartModel = require('../models/cartModel');
const productData = require('../models/productData');

// Create new order
router.post('/create', async (req, res) => {
    try {
        const { email, products, totalAmount, shippingAddress, paymentMethod } = req.body;

        // Create new order
        const newOrder = new orderModel({
            email,
            products,
            totalAmount,
            shippingAddress,
            paymentMethod
        });

        await newOrder.save();

        // Clear the cart after successful order
        await cartModel.findOneAndUpdate(
            { email },
            { $set: { products: [] } }
        );

        res.status(201).json({
            success: true,
            message: 'Order placed successfully',
            order: newOrder
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to place order',
            error: error.message
        });
    }
});

// Get user orders
router.get('/user/:email', async (req, res) => {
    try {
        const orders = await orderModel.find({ email: req.params.email })
            .sort({ createdAt: -1 })
            .populate('products.productId');

        res.status(200).json({
            success: true,
            orders
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch orders',
            error: error.message
        });
    }
});

// Get seller orders
router.get('/seller/:email', async (req, res) => {
    try {
        // First get all products of the seller
        const sellerProducts = await productData.find({ email: req.params.email });
        const productIds = sellerProducts.map(product => product._id);

        // Then find all orders that contain these products
        const orders = await orderModel.find({
            'products.productId': { $in: productIds }
        })
        .populate('products.productId')
        .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            orders
        });
    } catch (error) {
        console.error('Error fetching seller orders:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch seller orders',
            error: error.message
        });
    }
});

module.exports = router; 