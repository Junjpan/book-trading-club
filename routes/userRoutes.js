const User = require('../models/user');
const Thread = require('../models/thread');
const Reply = require('../models/reply');
const router = require("express").Router();
const bcrypt = require("bcryptjs");
const passport = require('passport');
const ensureAuthenticate = require('../config/authenticate');



//search user
router.get('/search', ensureAuthenticate, (req, res) => {
    const { keyword } = req.query
    // console.log(keyword)
    User.find({ username: { $ne: "admin" } })
        .then((users) => {
            const filteruser = users.filter((data) => {
              var search =keyword.toLowerCase().trim();
                return data.username.toLowerCase()===search
            })
            if (filteruser.length > 0) {
                const url='/book/'+filteruser[0]._id
                res.send(url)
            } else {
                const url='/user'
                req.flash("error", "No user found, please make sure you enter full username.");
                res.send(url)
            }
        })
        .catch((err) => { throw err })
})


//delete a thread
router.delete('/message/delete/:thread_id', ensureAuthenticate, (req, res) => {
    const { thread_id } = req.params;
    const user_id = req.user._id
    //console.log(req.user.id)

    User.findById(user_id, (err, user) => {
        //console.log(user);
        const index = user.threads.indexOf(thread_id);
        user.threads.splice(index, 1)
        user.save();
    })
    //delete all the replies related to this thread.

    Reply.deleteMany({ threadid: thread_id }, (err, result) => {
        if (err) { throw err }
    })
    //delete the thread             
    Thread.deleteOne({ _id: thread_id }, (err) => {
        if (err) { throw err }
        else{
            req.flash("error", "This message was deleted sucessfully.")
            res.send("success")
        }
        

    })
})
//get User message page
router.get("/message/:id", ensureAuthenticate, (req, res) => {
    const { id } = req.params;
    User.findById(id)
        .populate({ path: "threads", model:Thread, option: { sort: { created_on: -1 } } })
        .then((user) => {
            //console.log(user)
            res.render("message/user-message", { username: user.username, id: id, threads: user.threads })
        })
        .catch((err) => { throw err })

})

router.get("/messages", ensureAuthenticate, (req, res) => {
    const { id } = req.user
    User.findById(id)
        .populate({ path: "threads", model:Thread, option: { sort: { created_on: -1 } } })
        .then((user) => {
            res.render("message/user-allthreads", { threads: user.threads })
        })
        .catch((err) => { throw err })

})


router.get("/newuser", (req, res) => {
    //console.log(res.locals)
    res.render("user/newuser", {
        title: "Create an User Account"
    })
})

router.post("/newuser", (req, res) => {
    const { username, fullname, password, city, state, address, email } = req.body;
    const usernameQuery = { username };
    //this string must contain at least 1 lowercase alphabetical character and 1 uppercase alphabetical letter,1 number and 1 specail character and must be eight characcter or longer
    const passwordRegex = new RegExp("^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])(?=.{8,})");
    //wehn using the constructor function, the normal string escape rules (preceding specail characters with \ when included in a string are necessary) for example: var re=/\w+/; var re=new RegExp('\\w+')
    const emailRegex = new RegExp("\\w+([-+.']\\w+)*@\\w+([-.]\\w+)*\\.\\w+([-.]\\w+)*");

    //make sure the password match the requirements
    if (!passwordRegex.test(password)) {
        req.flash("error", "Please change different password, the password string must contain at least 1 lowercase letter, 1 uppercase letter,1 number and 1 specail character and must be 8 characters or longer")
        return res.redirect('/user/newuser')//make sure use return to end the req.
    }

    if (!emailRegex.test(email.toLowerCase())) {
        req.flash("error", "Please enter valid email address");
        return res.redirect('/user/newuser');
    }

    User.find(usernameQuery, (err, db) => {
        //console.log(db)
        if (db.length !== 0) {
            //console.log(db)
            req.flash("error", "Please change different username,The username has been taken!")
            return res.redirect('/user/newuser')
        } else {
            const newUser = new User();
            newUser.username = username;
            newUser.fullname = fullname;
            newUser.password = password;
            newUser.state = state;
            newUser.city = city;
            newUser.address = address;
            newUser.email = email;

            bcrypt.genSalt(10, function (err, salt) {
                bcrypt.hash(newUser.password, salt, (err, hash) => {
                    if (err) { throw err }
                    newUser.password = hash;
                    newUser.save();
                    req.flash("message", "Congratulations! Your account has been set up. Please login and start trading!")
                    res.redirect('/')
                })
            })
        }
    })
})

router.get("/login", (req, res) => {
    res.render("user/login", { title: "Login" })
})

router.post('/login', passport.authenticate('local', { failureRedirect: "/user/login", failureFlash: "Invalid username or password." }), (req, res) => {
    //once authenitcate is success. req.user was established and user.id will be stored in session under passport attribute and can be accessed whole website
    //console.log(req.user,req.isAuthenticated(),req.session);
    req.flash("message", `${req.user.fullname} welcome back! You are logged in.`)

    res.redirect("/book/all/1")

})

router.get('/logout', (req, res) => {
    req.flash("error", `You are logged out`)
    req.logout();//invoking logout() will remove req.user property and clear the seesion's passport propert   
    res.redirect('/user/login')

})
//view user profile
router.get('/:id', ensureAuthenticate, (req, res) => {
    res.render("user/user-profile")
})

//get edit profile
router.get('/edit/:id', ensureAuthenticate, (req, res) => {
    res.render("user/edit-profile", { title: "Edit Profile for " + req.user.fullname })
})

//post edited profile
router.post("/edit/:id", ensureAuthenticate, (req, res) => {
    const { id } = req.params;
    const { username, fullname, city, state, address, email } = req.body;
    User.findByIdAndUpdate(id, { $set: { username, fullname, city, state, address, email } }, { new: true, useFindAndModify: false }, (err, user) => {
        if (err) { throw err }
        else {
            req.flash("message", 'Profile has been sucessfully updated');
            res.redirect('/user/' + id)
        }
    })
})

//get the change password page
router.get('/edit/changepassword/:id', ensureAuthenticate, (req, res) => {
    res.render("user/change-Password", { title: "Change Password for " + req.user.fullname })
})

// post the change in the password page
router.post('/edit/changepassword/:id', ensureAuthenticate, (req, res) => {
    const { id } = req.params;
    const { password } = req.body;
    const { password1 } = req.body

    if (password === password1) {
        User.findById(id, (err, user) => {
            bcrypt.genSalt(10, (err, salt) => {
                bcrypt.hash(password1, salt, (err, hash) => {
                    if (err) { throw err }
                    else {
                        user.password = hash;
                        user.save();
                        req.flash("message", "Password has been updated.");
                        res.redirect('/user/' + id)
                    }
                })
            })
        })

    } else {
        req.flash("error", "Password is not match.");
        res.redirect("/user/edit/changepassword/" + id)
    }

})

//list all user except admin
router.get('/', ensureAuthenticate, (req, res) => {
    User.find({ username: { $ne: "admin" } }, (err, users) => {
        if (err) { throw err }
        //console.log(users)
        res.render('user/allusers', { title: "Book Club Users List", users: users })

    })
})



//post message 
router.post("/message/:id", ensureAuthenticate, (req, res) => {
    const { id } = req.params;
    const newThread = new Thread();
    const date = new Date();
    newThread.title = req.body.title;
    newThread.username = req.body.username;
    newThread.message = req.body.message;
    newThread.date = date.getMonth() + 1 + "/" + date.getDate() + "/" + date.getFullYear()
    newThread.save({ new: true }, (err, thread) => {
        //console.log(thread)
        User.findById(id, (err, user) => {
            user.threads.push(thread._id)
            user.save();
        })
        req.flash("message", "Message has been sent")
        res.redirect('/user/message/' + id)
    })

})



// get thread relies
router.get('/reply/:id', ensureAuthenticate, (req, res) => {
    const thread_id = req.params.id;
    Thread.findById(thread_id)
        .populate({ path: "replies", model:Reply })
        .then((thread) => {
            //console.log(thread)
            res.render("message/reply", { thread: thread })
        })
})

router.post('/reply/:id', ensureAuthenticate, (req, res) => {
    const thread_id = req.params.id;
    const newReply = new Reply();
    const date = new Date();
    newReply.username = req.body.username;
    newReply.message = req.body.message;
    newReply.threadid = thread_id;
    newReply.date = date.getMonth() + 1 + "/" + date.getDate() + "/" + date.getFullYear()
    newReply.save({ new: true }, (err, reply) => {
        Thread.findById(thread_id, (err, thread) => {
            thread.replies.push(reply._id);
            thread.save();
        })
        res.redirect('/user/reply/' + thread_id)
    })

})




module.exports = router;
