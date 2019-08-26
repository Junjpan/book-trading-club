const mongoose=require('mongoose');
require("dotenv").config();
const conn=mongoose.createConnection(process.env.URL,{useNewUrlParser:true});

const RequestSchema=mongoose.Schema({
    requestusername:{type:String},
    requestuserid:{type:mongoose.Schema.Types.ObjectId},
    pick:{type:String,
          required:true},
    take:{type:String,
            required:true},
    takeid:mongoose.Schema.Types.ObjectId,
    take_username:String,
    take_userid:mongoose.Schema.Types.ObjectId,
    requestdate:{type:Date,
               default:new Date()},
    date:String,
    note:String,
    accepted:{type:Boolean,
             default:false},
    status:{type:String,
            default:"Pending"}                           
})

module.exports=conn.model("Request",RequestSchema);