const express = require("express");
const { check } = require(`express-validator`);

const adminController = require(`../controllers/admin`);
const isAuth = require(`../util/isAuth`);

const router = express.Router();

router.get("/add-product", isAuth, adminController.getAddProducts);

router.get("/products", isAuth, adminController.getProducts);

router.post(
  "/add-product",
  [
    check(`title`).isString().trim(),
    //check(`imgUrl`).isURL(),
    check(`price`).isFloat().trim(),
    check(`description`).isLength({ max: 300 }).trim(),
  ],
  isAuth,
  adminController.postAddProducts
);

router.get(`/edit-product/:productId`, isAuth, adminController.getEditProduct);

router.post(
  `/edit-product`,
  [
    check(`title`).isString().trim(),
    check(`price`).isFloat().trim(),
    check(`description`).isLength({ max: 300 }).trim(),
  ],
  isAuth,
  adminController.postEditProduct
);

router.delete(`/product/:productId`, isAuth, adminController.deleteProduct);

module.exports = router;
