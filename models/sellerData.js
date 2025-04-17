const mongoose=require("mongoose");
const connect=require("../config/mongoose_connection");

const userScheme=mongoose.Schema({
    name:String,
    email:String,
    phnumber:String,
    city:String,
})
module.exports = mongoose.model("seller", userScheme);