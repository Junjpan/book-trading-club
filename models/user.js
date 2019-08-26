const mongoose=require('mongoose');
require("dotenv").config();
const conn=mongoose.createConnection(process.env.URL,{useNewUrlParser:true});



const UserSchema=mongoose.Schema({
    username:{type:String,
          required:true,
          unique:true,
          trim:true},      
    fullname:{type:String,
              required:true}, 
    password:{type:String,
              required:true,
              minlength:8},
    email:String,                     
    city:String,
    state:String,
    address:String,
    profileimage:{type:String,
                  default:"profile.png"},
    books:[{type:mongoose.Schema.Types.ObjectId,ref:"Book"}],
    threads:[{type:mongoose.Schema.Types.ObjectId,ref:"Thread"}],
    systems:[{type:mongoose.Schema.Types.ObjectId,ref:"System"}]    
})

module.exports=conn.model("User",UserSchema);