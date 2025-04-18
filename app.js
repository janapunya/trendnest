const express = require('express');
const app = express();
const session = require('express-session');
const usermodel = require('./models/userModel');
const sellerData = require('./models/sellerData');
const productData = require('./models/productData');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const cookieParser = require('cookie-parser');
const likeModel = require('./models/likeModel');
const cartModel = require('./models/cartModel');
const orderModel = require('./models/orderModel');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
    cloud_name: 'dyiyccrbt',
    api_key: '389349672847818',
    api_secret: 'c5XsSozZ0euEdmsWRz0s-GrEJaM'
});
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());
app.set('view engine', 'ejs');

// Serve static files from multiple directories
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'public/images')));
app.use('/images/user_image', express.static(path.join(__dirname, 'public/images/user_image')));
app.use('/images/product', express.static(path.join(__dirname, 'public/images/product')));

// Create user_image directory if it doesn't exist
const userImageDir = path.join(__dirname, 'public/images/user_image');
if (!fs.existsSync(userImageDir)) {
    fs.mkdirSync(userImageDir, { recursive: true });
}

// Create product image directory if it doesn't exist
const productImageDir = path.join(__dirname, 'public/images/product');
if (!fs.existsSync(productImageDir)) {
    fs.mkdirSync(productImageDir, { recursive: true });
}

const storage = multer.memoryStorage();
const storage1 = multer.memoryStorage();

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

const upload1 = multer({ 
    storage: storage1,
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// Session middleware setup
app.use(session({
    secret: 'punya', // Change this to a secure secret key
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

app.get("/", async (req, res) => {
    try {
        const token = req.cookies.token;
        const products = await productData.find({});
        let userLikes = [];

        if (token) {
            try {
                const decoded = jwt.verify(token, "punya");
                const user = await usermodel.findOne({ email: decoded.email });
                
                if (user) {
                    // Get user's likes
                    const likes = await likeModel.find({ email: user.email });
                    userLikes = likes.map(like => like.productId.toString());
                }
            } catch (err) {
                console.error("[Auth] Token verification failed:", err.message);
                res.clearCookie("token");
            }
        }

        res.render("index", { 
            user: token ? await usermodel.findOne({ email: jwt.verify(token, "punya").email }) : "",
            data: products,
            userLikes: userLikes,
            error: null
        });
    } catch (err) {
        console.error("[Auth] Error:", err.message);
        res.clearCookie("token");
        const products = await productData.find({});
        res.render("index", { 
            user: "", 
            data: products,
            userLikes: [],
            error: "An error occurred"
        });
    }
})

app.get("/login",(req,res) =>{
    res.render("login",{error:null})
})

app.get("/otp",(req,res) =>{
    res.render("otp",{err:null})
})


app.get("/signup",(req,res) =>{
    res.render("signup",{error:null})
})


app.get("/logout",(req,res)=>{
    res.clearCookie("token");
    res.redirect("/")
})






app.get("/mycart", async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.redirect("/login");
        }

        const decoded = jwt.verify(token, "punya");
        const user = await usermodel.findOne({ email: decoded.email });
        
        if (!user) {
            return res.redirect("/login");
        }

        // Get all cart items for the user
        const cartItems = await cartModel.find({ email: user.email });
        
        // Extract product IDs from cart items
        const productIds = cartItems.map(item => item.productId);
        
        // Find all products that match the cart product IDs
        const products = await productData.find({ _id: { $in: productIds } });

        res.render("mycart", { 
            user, 
            alldata: products,
            cart: cartItems,
            error: null 
        });
    } catch (err) {
        console.error("[Cart] Error:", err.message);
        res.clearCookie("token");
        res.render("mycart", { 
            user: null, 
            alldata: [], 
            cart: [],
            error: "Failed to load cart items. Please try again." 
        });
    }
});





app.post("/deletecart", async (req, res) => {
    try {
        const { deleteData } = req.body;
        
        // Verify user is logged in
        const token = req.cookies.token;
        if (!token) {
            return res.redirect("/login");
        }

        const decoded = jwt.verify(token, "punya");
        
        // Delete the cart item for the specific user and product
        const deletedItem = await cartModel.findOneAndDelete({
            email: decoded.email,
            productId: deleteData
        });

        if (!deletedItem) {
            console.log("No cart item found for user:", decoded.email, "product:", deleteData);
            return res.status(404).json({ error: "Cart item not found" });
        }

        res.redirect("/mycart");
    } catch (err) {
        console.error("[Delete Cart] Error:", err.message);
        res.status(500).json({ error: "Failed to delete cart item" });
    }
});


app.get("/sellerdata", async(req,res)=>{
    try {
        const token = req.cookies.token;
        if (!token) {
            const products = await productData.find({});
            return res.render("index", { user: "", data: products, error: "Please login to access seller features" });
        }

        // Verify the token
        const decoded = jwt.verify(token, "punya");
        const user = await usermodel.findOne({ email: decoded.email });
        
        if (!user) {
            const products = await productData.find({});
            return res.render("index", { user: "", data: products, error: "User not found. Please login again" });
        }

        // Check if user is already a seller
        const seller = await sellerData.findOne({email: user.email});
        
        if(!seller) {
            // If not a seller, show seller registration form
            res.render("sellerdata", { user, error: null });
        } else {
            // If already a seller, get their products and show sell page
            try {
                const products = await productData.find({email: user.email});
                res.render("sell", { user: seller, alldata: products, error: null });
            } catch (productErr) {
                console.error("[Products] Error fetching products:", productErr.message);
                res.render("sell", { user: seller, alldata: [], error: "Error loading products. Please try again" });
            }
        }
    } catch (err) {
        console.error("[Auth] Token verification failed:", err.message);
        res.clearCookie("token");
        const products = await productData.find({});
        res.render("index", { user: "", data: products, error: "Session expired. Please login again" });
    }
})

app.get("/sell", async(req,res)=>{
    try {
        const token = req.cookies.token;
        if (!token) {
            const products = await productData.find({});
            return res.render("index", { user: "", data: products, error: "Please login to access seller features" });
        }

        const decoded = jwt.verify(token, "punya");
        const user = await usermodel.findOne({ email: decoded.email });
        
        if (!user) {
            const products = await productData.find({});
            return res.render("index", { user: "", data: products, error: "User not found. Please login again" });
        }

        const seller = await sellerData.findOne({email: user.email});
        if (!seller) {
            return res.redirect("/sellerdata");
        }

        try {
            const alldata = await productData.find({email: user.email});
            res.render("sell", { user: seller, alldata, error: null });
        } catch (productErr) {
            console.error("[Products] Error fetching products:", productErr.message);
            res.render("sell", { user: seller, alldata: [], error: "Error loading products. Please try again" });
        }
    } catch (err) {
        console.error("[Auth] Token verification failed:", err.message);
        res.clearCookie("token");
        const products = await productData.find({});
        res.render("index", { user: "", data: products, error: "Session expired. Please login again" });
    }
})


app.get("/addproduct",async(req,res)=>{
    const token = req.cookies.token;
        if (!token) {
            return res.render("index", { user:"" });
        }

        // Verify the token
        const decoded = jwt.verify(token, "punya");
        const user = await usermodel.findOne({ email: decoded.email });
        
        if (!user) {
            return res.render("index", { user:"" });
        }

        res.render("addproduct",{user});
})


app.post("/addproduct", upload1.single("image"), async(req,res)=>{
    const {email, brand, productName, prize, discount} = req.body;
    try {
        if (!req.file) {
            return res.render("addproduct", { 
                user: { email },
                error: "Please upload a product image" 
            });
        }

        // Upload image to Cloudinary
        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream({
                folder: 'product_images',
                resource_type: 'auto'
            }, (error, result) => {
                if (error) reject(error);
                else resolve(result);
            });
            uploadStream.end(req.file.buffer);
        });

        let imgurl = result.secure_url;
        console.log("Saving product image at:", imgurl); // Debug log

        let product = await productData.create({
            email,
            brand,
            productName,
            prize,
            discount,
            imgurl,
        });
        res.redirect("/sell");
    } catch(err) {
        console.error("Add product error:", err);
        res.render("addproduct", { 
            user: { email },
            error: "Failed to add product. Please try again." 
        });
    }
});


app.post("/deleteproduct",async(req,res)=>{
    const {deleteData}=req.body;
    const alldata = await productData.findByIdAndDelete(deleteData);
    res.redirect("/sell")
})

app.post("/sellerdata", async (req, res) => {
    const {name, email, phnumber, city} = req.body;
    
    try {
        // Validate input


        // Check if seller already exists
        const existingSeller = await sellerData.findOne({email});
        if (existingSeller) {
            return res.render("sellerdata", { 
                user: { email }, 
                error: "You are already registered as a seller" 
            });
        }

        // Create new seller
        const sellerdata = await sellerData.create({
            name,
            email,
            phnumber,
            city,
        });


        // Create new token and redirect
        const token = jwt.sign({email}, "punya");
        res.cookie("token", token, {httpOnly: true, sameSite: 'lax'});
        
        // Get products and render sell page
        const products = await productData.find({email});
        res.render("sell", { 
            user: sellerdata, 
            alldata: products,
            error: null,
            success: "Successfully registered as seller!"
        });
    } catch (error) {
        console.error("Error creating seller data:", error);
        res.render("sellerdata", { 
            user: { email }, 
            error: "Failed to create seller data. Please try again" 
        });
    }
})

app.post("/signup", async (req,res) =>{
    try{
        let {email,password}=req.body;
        if(!email || !password){
            return res.render("signup", { error: "Email and password are required" });
        }

        // Find user by email
        const user = await usermodel.findOne({email});
        if(!user){
            return res.render("signup", { error: "User not found" });
        }

        // Compare passwords
        const isMatch = await bcrypt.compare(password, user.password);
        if(isMatch){
            // Create JWT token
            let token = jwt.sign({email:email}, "punya", { expiresIn: '1h' });
            res.cookie("token", token, {
                httpOnly: true,
                sameSite: 'lax'
            });
            res.redirect("/");
        } else {
            res.render("signup", { error: "Incorrect password" });
        }
    }
    catch(err){
        res.render("signup", { error: "An error occurred. Please try again." });
    }
})


app.post("/login", upload.single("file"), async (req, res) => {
    try {
        if (!req.file) {
            return res.render("login", { error: "Please upload a profile picture" });
        }

        const otp = Math.floor(Math.random() * 900000) + 100000;
        let {name, phnumber, age, email, password} = req.body;
        
        // Upload image to Cloudinary
        const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream({
                folder: 'user_images',
                resource_type: 'auto'
            }, (error, result) => {
                if (error) reject(error);
                else resolve(result);
            });
            uploadStream.end(req.file.buffer);
        });
        
        let imgurl = result.secure_url;
        let check = await usermodel.findOne({email});
        
        if(!check) {
            var transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: 'trendnestshop99@gmail.com',
                    pass: 'owvs nipd ngsu xaow'
                }
            });
            
            var mailOptions = {
                from: 'trendnestshop99@gmail.com',
                to: email,
                subject: `Welcome to Trendnest, ${name}`,
                text: `Your OTP is ${otp}`
            };
            
            transporter.sendMail(mailOptions, function(error, info) {
                if (error) {
                    console.log(error);
                } else {
                    console.log('Email sent: ' + info.response);
                }
            });
            
            req.session.user = {
                name,
                phnumber,
                age,
                email,
                password,
                otp,
                imgurl,
            };
            res.render("otp", { name: req.session.user.name, err: null });
        } else {
            res.render("login", {error: "Email already registered" });
        }
    } catch(err) {
        console.error("Login error:", err);
        res.render("login", { error: "An error occurred. Please try again." });
    }
});
app.post("/otp",async(req,res)=>{
    try {
        let { otp } = req.body;
        const sessionUser = req.session.user;
        
        if (!sessionUser) {
            return res.render("otp", { name: null, err: "Session expired. Please try again." });
        }

        if (sessionUser.otp == otp) {
            // Check if user already exists
            const existingUser = await usermodel.findOne({ email: sessionUser.email });
            if (existingUser) {
                return res.render("otp", { name: sessionUser, err: "User already registered" });
            }

            // Create new user
            const salt = await bcrypt.genSalt(15);
            const hashedPassword = await bcrypt.hash(sessionUser.password, salt);
            const newUser = await usermodel.create({
                name: sessionUser.name,
                phnumber: sessionUser.phnumber,
                age: sessionUser.age,
                email: sessionUser.email,
                password: hashedPassword,
                imgurl: sessionUser.imgurl,
            });


                const token = jwt.sign({ email: sessionUser.email }, "punya", { expiresIn: '1h' });
                res.cookie("token", token, {
                    httpOnly: true,
                    sameSite: 'lax'});
                return res.redirect("/");
        }
        else {
            return res.render("otp", { name: sessionUser, err: "Invalid OTP" });
        } 
        
    }
    catch (err) {
        console.error("OTP verification error:", err);
        return res.render("otp", { name: req.session.user, err: "An error occurred. Please try again." });
    }
})
// Add new routes for likes
app.post("/like", async(req,res)=>{
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.json({ success: false, error: "Please login to like products" });
        }

        const decoded = jwt.verify(token, "punya");
        const { productId } = req.body;

        // Check if product exists
        const product = await productData.findById(productId);
        if (!product) {
            return res.json({ success: false, error: "Product not found" });
        }

        // Check if already liked
        const existingLike = await likeModel.findOne({
            email: decoded.email,
            productId: productId
        });

        if (existingLike) {
            // Unlike
            await likeModel.findByIdAndDelete(existingLike._id);
            return res.json({ success: true, action: "unliked" });
        } else {
            // Like
            await likeModel.create({
                email: decoded.email,
                productId: productId
            });
            return res.json({ success: true, action: "liked" });
        }
    } catch (err) {
        console.error("Like error:", err);
        return res.json({ success: false, error: "Failed to like product" });
    }
});

// Add route to show liked products
app.get("/liked", async(req,res)=>{
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.redirect("/login");
        }

        const decoded = jwt.verify(token, "punya");
        const user = await usermodel.findOne({ email: decoded.email });
        
        if (!user) {
            return res.redirect("/login");
        }

        // Get all liked products with proper error handling
        const likes = await likeModel.find({ email: user.email })
            .populate('productId')
            .sort({ createdAt: -1 });

        // Filter out any null products and map to product objects
        const likedProducts = likes
            .filter(like => like.productId !== null)
            .map(like => like.productId);

        res.render("liked", { 
            user,
            products: likedProducts,
            error: null
        });
    } catch (err) {
        console.error("Error fetching liked products:", err);
        res.render("liked", { 
            user: null,
            products: [],
            error: "Failed to load liked products"
        });
    }
});

app.post("/addcart",async(req,res)=>{
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.redirect("/login");
        }
        const decoded = jwt.verify(token, "punya");
        const {productId}=req.body;
        const cart = await cartModel.create({
            email:decoded.email,
            productId,
        });
        res.redirect("/");
    } catch (error) {
        res.redirect("/");
    }
})

// Order routes
app.get("/myorders", async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.redirect("/login");
        }

        const decoded = jwt.verify(token, "punya");
        const user = await usermodel.findOne({ email: decoded.email });
        
        if (!user) {
            return res.redirect("/login");
        }

        // Get all orders for the user with populated product details
        const orders = await orderModel.find({ email: user.email })
            .populate('products.productId')
            .sort({ createdAt: -1 });

        res.render("myorders", { 
            user,
            orders,
            error: null
        });
    } catch (err) {
        console.error("Error fetching orders:", err);
        res.render("myorders", { 
            user: null,
            orders: [],
            error: "Failed to load orders"
        });
    }
});

app.post("/createorder", async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.json({ success: false, error: "Please login to place order" });
        }

        const decoded = jwt.verify(token, "punya");
        const { products, shippingAddress, paymentMethod } = req.body;

        // Validate input
        if (!products || !Array.isArray(products) || products.length === 0) {
            return res.json({ success: false, error: "No products in order" });
        }

        if (!shippingAddress || !paymentMethod) {
            return res.json({ success: false, error: "Shipping address and payment method are required" });
        }

        // Calculate total amount
        let totalAmount = 0;
        for (const item of products) {
            const product = await productData.findById(item.productId);
            if (!product) {
                return res.json({ success: false, error: `Product not found: ${item.productId}` });
            }
            totalAmount += product.prize * item.quantity;
        }

        // Create order
        const order = await orderModel.create({
            email: decoded.email,
            products: products.map(item => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.price
            })),
            totalAmount,
            shippingAddress,
            paymentMethod,
            status: 'pending'
        });

        // Remove items from cart
        await cartModel.deleteMany({ 
            email: decoded.email,
            productId: { $in: products.map(item => item.productId) }
        });

        res.json({ 
            success: true, 
            orderId: order._id,
            message: "Order placed successfully"
        });
    } catch (err) {
        console.error("Error creating order:", err);
        res.json({ success: false, error: "Failed to place order" });
    }
});

app.post("/cancelorder", async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.json({ success: false, error: "Please login to cancel order" });
        }

        const decoded = jwt.verify(token, "punya");
        const { orderId } = req.body;

        const order = await orderModel.findOne({ 
            _id: orderId,
            email: decoded.email
        });

        if (!order) {
            return res.json({ success: false, error: "Order not found" });
        }

        if (order.status !== 'pending') {
            return res.json({ success: false, error: "Only pending orders can be cancelled" });
        }

        order.status = 'cancelled';
        await order.save();

        res.json({ success: true, message: "Order cancelled successfully" });
    } catch (err) {
        console.error("Error cancelling order:", err);
        res.json({ success: false, error: "Failed to cancel order" });
    }
});

// Seller orders page
app.get("/sellerorders", async (req, res) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.redirect("/login");
        }

        const decoded = jwt.verify(token, "punya");
        const user = await usermodel.findOne({ email: decoded.email });
        
        if (!user) {
            return res.redirect("/login");
        }

        // Get all orders for seller's products
        const sellerProducts = await productData.find({ email: user.email });
        const productIds = sellerProducts.map(product => product._id);

        const orders = await orderModel.find({
            'products.productId': { $in: productIds }
        })
        .populate('products.productId')
        .sort({ createdAt: -1 });

        res.render("sellerorders", { 
            user,
            orders,
            error: null
        });
    } catch (err) {
        console.error("Error fetching seller orders:", err);
        res.render("sellerorders", { 
            user: null,
            orders: [],
            error: "Failed to load orders"
        });
    }
});

// Search products
app.get("/search", async (req, res) => {
    try {
        const { query } = req.query;
        
        if (!query) {
            return res.json({ products: [] });
        }

        // Search in both brand and productName fields
        const products = await productData.find({
            $or: [
                { brand: { $regex: query, $options: 'i' } },
                { productName: { $regex: query, $options: 'i' } }
            ]
        });

        res.json({ products });
    } catch (err) {
        console.error("Search error:", err);
        res.status(500).json({ error: "Failed to search products" });
    }
});

// Product details route
app.get("/product/:id", async (req, res) => {
    try {
        const token = req.cookies.token;
        let user = null;
        let userLikes = [];

        if (token) {
            try {
                const decoded = jwt.verify(token, "punya");
                user = await usermodel.findOne({ email: decoded.email });
                
                if (user) {
                    const likes = await likeModel.find({ email: user.email });
                    userLikes = likes.map(like => like.productId.toString());
                }
            } catch (err) {
                console.error("[Auth] Token verification failed:", err.message);
                res.clearCookie("token");
            }
        }

        const product = await productData.findById(req.params.id);
        if (!product) {
            return res.status(404).render('error', { message: 'Product not found' });
        }

        res.render("productDetails", { 
            user,
            product,
            userLikes,
            error: null
        });
    } catch (err) {
        console.error("Product details error:", err);
        res.status(500).render('error', { message: 'Error loading product details' });
    }
});

app.listen(3000);