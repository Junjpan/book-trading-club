const express = require("express");
const path = require("path");
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const passport = require('passport');
const session = require("express-session");
const flash = require("connect-flash")
const requestRoute = require('./routes/requestRoutes');
const bookRoute = require('./routes/bookRoutes');
const tradeRoute = require('./routes/tradeRoutes');
const userRoute = require('./routes/userRoutes');
const ensureAuthenticate = require('./config/authenticate');
const crypto = require('crypto');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const ObjectId = require('mongodb').ObjectID;
const User = require('./models/user');





mongoose.set('useCreateIndex', true);//to fix the warning: DeprecationWarning: collection.ensureIndex is deprecated. Use createIndexes instead.
const app = express();
require("dotenv").config();

/** mongoose.model ties the defined model to the default connection that was created by calling mongoose .connect
 * conn.model ties the model to the connectiooin that was created by calling var conn=mongoose.createConnection()
mongoose.connect(process.env.URL,{useNewUrlParser:true},(err,db)=>{
if (err) throw err;
console.log("Connected to MongoDB...")
})*/


const conn = mongoose.createConnection(process.env.URL, { useNewUrlParser: true });
let gfs

conn.once('open', (err, db) => {
  console.log("Connected to MongoDB...")
  //init stream
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection('uploads');

})

//create storage engine
var storage = new GridFsStorage({
  url: process.env.URL,
  options: { useNewUrlParser: true },
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        const filename = buf.toString('hex') + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          metadata: { "userid": req.user._id },//set any information you wanted to be stored in this collection
          bucketName: 'uploads'
        };
        resolve(fileInfo);
      });
    });
  }
});
const upload = multer({ storage });//middleware and upload the data to the database

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())


app.use(session({
  secret: "cats",
  resave: false,
  saveUninitialized: false
}));
app.use(flash());
//   Choosing false for saveUninitialized is useful for implementing login sessions, reducing server storage usage, or complying with laws that require permission before setting a cookie. Choosing false will also help with race conditions where a client makes multiple parallel requests without a session.            
app.use(passport.initialize());
app.use(passport.session());
require('./config/passport')(passport);

app.use(express.static(path.join(__dirname, "public")))
app.set("views", path.join(__dirname, "view", "views"))// which is equal to view\views
app.set("view engine", "pug")

//set up locals vairable
app.use((req, res, next) => {
  res.locals.user = req.user || null;
  res.locals.message = req.flash('message');
  res.locals.error = req.flash("error");
  next();
})

//frontpage
app.get("/", (req, res) =>
  res.render("index"))


//upload profile pics
//@get upload profile page 
app.get('/upload', ensureAuthenticate, (req, res) => {
  const query = { "metadata.userid": ObjectId(req.user._id) }
  gfs.files.find(query).toArray((err, file) => {
    if (file.length !== 0) {
      //console.log(file)
      res.render('user/profilepic', { file: file[0] })
    } else {
      res.render('user/profilepic')
    }
  })
})

app.get('/image/:filename', (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    if (file==null) {
      User.findById(req.user._id, (err, user) => {
        user.profileimage ="profile.png";
        user.save();
      })
    } else {
      if (file.contentType == "image/jpeg" || file.contentType == "img/png") {
        const readstream = gfs.createReadStream(file.filename);
        readstream.pipe(res);
      } else {
        User.findById(req.user._id, (err, user) => {
          user.profileimage = "profile.png";
          user.save();
        })

      }
    }
  })
})
  //file will be save in the mongo right away after we select the file to upload
  //upload pic or update a pic and at the same time delete the old one
  app.post('/upload/:userid', ensureAuthenticate, upload.single("profile"), (req, res) => {
    //console.log(req.file)
    User.findById(req.user._id, (err, user) => {
      user.profileimage = req.file.filename
      user.save();
    })
    const query = { "metadata.userid": ObjectId(req.user._id) }
    const fileid = req.file._id;
    gfs.files.find(query).toArray((err, files) => {
      if (files.length == 1) {
        res.redirect('/upload')
      } else {
        const oldfile = files.filter((file) => {
          return file._id !== fileid
        })
        const oldid = oldfile[0]._id
        //remove the pic from files and chunks 
        gfs.remove({ _id: oldid, root: "uploads" }, (err, file) => {
          if (err) { throw err }
          else { res.redirect('/upload') }
        })
      }
    })

  })



  app.use("/book", bookRoute);
  app.use("/user", userRoute);
  app.use("/request", requestRoute);
  app.use("/trade", tradeRoute);

  //make sure put it at the end of the code

  app.use((req, res, next) => {
    res.status(400).send("There is not such page!");
    next()
  })

  const port = process.env.PORT || 5000;
  app.listen(port, () => {
    console.log("Server started on port " + port)
  })