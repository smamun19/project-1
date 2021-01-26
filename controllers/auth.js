const bcrypt = require(`bcryptjs`);
const crypto = require(`crypto`);
const User = require(`../models/user`);
const nodeMailer = require(`nodemailer`);
const { validationResult } = require(`express-validator`);

const transporter = nodeMailer.createTransport({
  service: `gmail`,
  auth: {
    user: `mamun34597@gmail.com`,
    pass: `smamun19@gmail.com!`,
  },
});

exports.getLogin = (req, res, next) => {
  let flashMessage = req.flash(`err`);
  if (flashMessage.length > 0) {
    flashMessage = flashMessage[0];
  } else {
    flashMessage = null;
  }
  res.render(`auth/login`, {
    path: `/login`,
    pageTitle: `Login`,
    errMessage: flashMessage,
    oldInput: { email: "" },
    validationErrors: [],
  });
};

exports.getSignup = (req, res, next) => {
  let flashMessage = req.flash(`err`);
  if (flashMessage.length > 0) {
    flashMessage = flashMessage[0];
  } else {
    flashMessage = null;
  }
  res.render("auth/signup", {
    path: "/signup",
    pageTitle: "Signup",
    errMessage: flashMessage,
    oldInput: { email: "" },
    validationErrors: [],
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render("auth/login", {
      path: "/login",
      pageTitle: "Login",
      errMessage: errors.array()[0].msg,
      oldInput: { email: email },
      validationErrors: { email: `` },
    });
  }

  User.findOne({ email: email })
    .then((user) => {
      if (!user) {
        return res.status(422).render("auth/login", {
          path: "/login",
          pageTitle: "Login",
          errMessage: `This email is not registered yet`,
          oldInput: { email: email },
          validationErrors: [{ param: `email` }],
        });
      }
      bcrypt
        .compare(password, user.password)
        .then((result) => {
          if (!result) {
            return res.status(422).render("auth/login", {
              path: "/login",
              pageTitle: "Login",
              errorMessage: `Invalid password`,
              oldInput: { email: email },
              validationErrors: [{ param: `password` }],
            });
          }
          req.session.isLoggedIn = true;
          req.session.user = user;
          return req.session.save((err) => {
            console.log(err);
            res.redirect(`/`);
          });
        })
        .catch((err) => {
          res.redirect(`/500`);
        });
    })
    .catch((err) => {
      res.redirect(`/500`);
    });
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("auth/signup", {
      path: "/signup",
      pageTitle: "Signup",
      errMessage: errors.array()[0].msg,
      oldInput: { email: email },
      validationErrors: errors.array(),
    });
  }
  User.findOne({ email: email })
    .then((userDoc) => {
      if (userDoc) {
        req.flash(
          `err`,
          `This email is already in use.Please try another one!`
        );
        return res.redirect(`/signup`);
      }
      return bcrypt
        .hash(password, 12)
        .then((hashedPassword) => {
          const user = new User({
            email: email,
            password: hashedPassword,
            cart: { items: [] },
          });
          return user.save();
        })
        .then(() => {
          return transporter.sendMail({
            to: email,
            from: `mamun34597@gmail.com`,
            subject: `regestration successfull!`,
            html: `<h21>you have successfully signed up!</h1>`,
          });
        });
    })
    .then(() => {
      res.redirect(`/login`);
    })

    .catch((err) => {
      res.redirect(`/500`);
    });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    console.log(err);
    res.redirect(`/`);
  });
};

exports.getReset = (req, res, next) => {
  let flashMessage = req.flash(`err`);
  if (flashMessage.length > 0) {
    flashMessage = flashMessage[0];
  } else {
    flashMessage = null;
  }
  res.render("auth/reset", {
    path: "/reset",
    pageTitle: "Reset Password",
    errMessage: flashMessage,
  });
};

exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      console.log(err);
      return res.redirect(`/reset`);
    }
    const token = buffer.toString(`hex`);
    User.findOne({ email: req.body.email })
      .then((user) => {
        if (!user) {
          req.flash(`error`, `No account found!`);
          return res.redirect(`/reset`);
        }
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        return user.save();
      })
      .then(() => {
        res.redirect(`/`);
        transporter.sendMail({
          to: req.body.email,
          from: `mamun34597@gmail.com`,
          subject: `reset password`,
          html: `<p>you have successfully signed up!</p>
          <p>Click <a href="http://localhost:3000/update-password/${token}">here</a> to set a new password</p>`,
        });
      })
      .catch((err) => {
        res.redirect(`/500`);
      });
  });
};

exports.getUpdatePassword = (req, res, next) => {
  const token = req.params.token;
  User.findOne({ resetToken: token, resetTokenExpiration: { $gt: Date.now() } })
    .then((user) => {
      let flashMessage = req.flash(`err`);
      if (flashMessage.length > 0) {
        flashMessage = flashMessage[0];
      } else {
        flashMessage = null;
      }
      res.render("auth/update-password", {
        path: "/update-password",
        pageTitle: "Update Password",
        errMessage: flashMessage,
        resetToken: token,
        userId: user._id.toString(),
      });
    })
    .catch((err) => {
      res.redirect(`/500`);
    });
};

exports.postUpdatePassword = (req, res, next) => {
  let resetUser;
  const newPass = req.body.password;
  const userId = req.body.userId;
  const token = req.body.resetToken;

  User.findOne({
    resetToken: token,
    resetTokenExpiration: { $gt: Date.now() },
    _id: userId,
  })
    .then((user) => {
      resetUser = user;
      return bcrypt.hash(newPass, 12);
    })
    .then((hashedPassword) => {
      resetUser.password = hashedPassword;
      resetUser.resetToken = undefined;
      resetUser.resetTokenExpiration = undefined;
      return resetUser.save();
    })
    .then(() => {
      res.redirect(`/login`);
    })
    .catch((err) => {
      res.redirect(`/500`);
    });
};
