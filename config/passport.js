const LocalStrategy=require('passport-local').Strategy;
const User=require('../models/user');
const bcrypt=require('bcryptjs');



module.exports=(passport)=>{
    passport.use(new LocalStrategy(
        function(username,password,done){
            User.findOne({username},(err,user)=>{
                if(err){return done(err);}
                if(!user){
                    return done (null,false,{message:'Incorrect Username'})
                }
                bcrypt.compare(password,user.password,(err,isMatch)=>{
                    if(err){throw err};
                    if(isMatch){
                        return done (null,user);
                    }else{
                        return done (null,false,{message:"Wrong Password!"})
                    }
                })
            })
        }
    ))

    passport.serializeUser((user,done)=>{
        done(null,user.id);
    })

    passport.deserializeUser((id,done)=>{
        User.findById(id,(err,user)=>{
            done(err,user);
        })
    })
}