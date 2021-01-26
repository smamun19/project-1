const express = require("express");
const bodyParser = require("body-parser");
const path = require(`path`);
const mongoose = require(`mongoose`);
const app = express();
const session = require(`express-session`);
const MongoSession = require(`connect-mongodb-session`)(session);
const csrf = require(`csurf`);
const flash = require(`connect-flash`);
const multer = require(`multer`);

app.set("view engine", "ejs");
app.set("views", "views");

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require(`./routes/auth`);
const errorHandler = require(`./controllers/error404`);
const User = require(`./models/user`);
const csrfProtection = csrf();

const sessionStore = new MongoSession({
  uri: `mongodb+srv://mamun:admin@cluster0.7b8ze.mongodb.net/shop?retryWrites=true&w=majority`,
  collection: `sessions`,
});

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, `images`);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now().toString() + `-` + file.originalname);
  },
});

const picFilter = (req, file, cb) => {
  if (
    file.mimetype === `image/png` ||
    file.mimetype === `image/jpg` ||
    file.mimetype === `image/jpeg`
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

app.use(bodyParser.urlencoded({ extended: false }));
app.use(multer({ storage: fileStorage, fileFilter: picFilter }).single(`img`));
app.use(express.static(path.join(__dirname, "public")));
app.use(`/images`, express.static(path.join(__dirname, "images")));
app.use(
  session({
    secret: `dummy secret`,
    resave: false,
    saveUninitialized: false,
    store: sessionStore,
  })
);

app.use(csrfProtection);
app.use(flash());

app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then((user) => {
      if (!user) {
        return next();
      }
      req.user = user;
      next();
    })
    .catch((err) => {
      throw new Error(err);
    });
});

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use("/admin", adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.use(errorHandler.get500);
app.use((error, req, res, next) => {
  res.redirect(`/500`);
});
app.use(errorHandler.get404);

mongoose
  .connect(
    `mongodb+srv://mamun:admin@cluster0.7b8ze.mongodb.net/shop?retryWrites=true&w=majority`,

    { useUnifiedTopology: true }
  )
  .then(() => {
    app.listen(3000);
  })
  .catch((err) => console.log(err));
