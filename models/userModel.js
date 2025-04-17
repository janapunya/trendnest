const mongoose=require("mongoose");
const connect=require("../config/mongoose_connection");

const userScheme=mongoose.Schema({
    name:String,
    phnumber:String,
    age:Number,
    email:String,
    password:String,
    imgurl:String,
})
module.exports = mongoose.model("user", userScheme);