module.exports=function ensureAuthenticated(req,res,next){
if(req.isAuthenticated()){
    return next()
}else{
    req.flash("error","Please Login");
    res.redirect('/user/login');
}


}