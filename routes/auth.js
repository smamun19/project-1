const express = require(`express`);
const { check } = require(`express-validator`);

const router = express.Router();

const authController = require(`../controllers/auth`);

router.get(`/login`, authController.getLogin);

router.get(`/signup`, authController.getSignup);

router.post(
  `/login`,
  check(`email`).isEmail().withMessage(`Please enter a valid email`),
  authController.postLogin
);

router.post(
  `/signup`,
  check(`email`)
    .isEmail()
    .withMessage(`Please enter a valid Email address`)
    .normalizeEmail(),
  check(`password`)
    .trim()
    .isLength({ min: 5 })
    .withMessage(`password must be at least 5 character long`),
  check(`confirmPassword`)
    .trim()
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error(`Passwords have to be matched!`);
      }
      return true;
    }),
  authController.postSignup
);

router.post(`/logout`, authController.postLogout);

router.get(`/reset`, authController.getReset);

router.post(`/reset`, authController.postReset);

router.get(`/update-password/:token`, authController.getUpdatePassword);

router.post(`/updatePassword`, authController.postUpdatePassword);

module.exports = router;
