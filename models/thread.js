const mongoose=require('mongoose');
require("dotenv").config();
const conn=mongoose.createConnection(process.env.URL,{useNewUrlParser:true});

const ThreadSchema=mongoose.Schema({
    username:{type:String,
          required:true},
    title:{type:String,
          required:true},      
    message:{type:String,
            required:true},
    replies:[{type:mongoose.Schema.Types.ObjectId,ref:"Reply"}],
    created_on:{type:Date,
               default:new Date()},
    date:String,
    readstatus:{type:Boolean,
                default:false},
    privite:{type:Boolean,
            default:false}                                       
})

module.exports=conn.model("Thread",ThreadSchema);