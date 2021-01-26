const express = require("express");

const shopController = require(`../controllers/shop`);
const isAuth = require(`../util/isAuth`);

const router = express.Router();

router.get("/", shopController.getIndex);

router.get("/products", shopController.getProducts);

router.get(`/products/:productId`, shopController.getProduct);

router.get("/cart", isAuth, shopController.getCart);

router.post(`/cart`, isAuth, shopController.postCart);

router.post(`/cart-delete-item`, isAuth, shopController.deleteProductFromCart);

router.get(`/checkout`, isAuth, shopController.getCheckout);

router.get(`/checkout/success`, isAuth, shopController.postOrder);

router.get(`/checkout/cancel`, isAuth, shopController.getCheckout);

//router.post(`/create-order`, isAuth, shopController.postOrder);

router.get(`/orders`, isAuth, shopController.getOrders);

router.get(`/orders/:orderId`, isAuth, shopController.getInvoice);

module.exports = router;
