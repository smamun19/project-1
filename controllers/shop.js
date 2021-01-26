const Product = require(`../models/product`);
const Order = require(`../models/order`);
const path = require(`path`);
const fs = require(`fs`);
const PDFkit = require(`pdfkit`);
const stripe = require(`stripe`)(
  `sk_test_51IAVpxEkJ8AggA6gHFgnDebRSECyDhwxA3gVnbVRppGPP7SpgaOIbgG0Tgy2BBhsiVCv11Z3ugdBnnn1ZhbhvFKN00Edy3c01M`
);

const itemPerPage = 1;

exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems = 0;

  Product.find()
    .countDocuments()
    .then((numProducts) => {
      totalItems = numProducts;
      return Product.find()
        .skip((page - 1) * itemPerPage)
        .limit(itemPerPage);
    })
    .then((products) => {
      res.render("shop/product-list", {
        prods: products,
        pageTitle: "Products",
        path: "/products",
        currentPage: page,
        hasNextPage: page * itemPerPage < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / itemPerPage),
        isAuthenticated: req.session.isLoggedIn,
      });
    })
    .catch((err) => {
      res.redirect(`/500`);
    });
};

exports.getProduct = (req, res, next) => {
  const productId = req.params.productId;
  Product.findById(productId)
    .then((product) => {
      res.render(`shop/product-detail`, {
        product: product,
        pageTitle: product.title,
        path: `/products`,
        isAuthenticated: req.session.isLoggedIn,
      });
    })
    .catch((err) => {
      res.redirect(`/500`);
    });
};

exports.getIndex = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalItems = 0;

  Product.find()
    .countDocuments()
    .then((numProducts) => {
      totalItems = numProducts;
      return Product.find()
        .skip((page - 1) * itemPerPage)
        .limit(itemPerPage);
    })
    .then((products) => {
      res.render("shop/index", {
        prods: products,
        pageTitle: "Shop",
        path: "/",
        currentPage: page,
        hasNextPage: page * itemPerPage < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / itemPerPage),
        isAuthenticated: req.session.isLoggedIn,
      });
    })
    .catch((err) => {
      res.redirect(`/500`);
    });
};

exports.getCart = (req, res, next) => {
  req.user
    .populate(`cart.items.productId`)
    .execPopulate()
    .then((user) => {
      const products = user.cart.items;
      res.render(`shop/cart`, {
        path: `/cart`,
        pageTitle: `Your Cart`,
        products: products,
        isAuthenticated: req.session.isLoggedIn,
      });
    })
    .catch((err) => {
      res.redirect(`/500`);
    });
};

exports.postCart = (req, res, next) => {
  const productId = req.body.productId;
  Product.findById(productId)
    .then((product) => {
      return req.user.addToCart(product);
    })
    .then(() => {
      res.redirect(`/cart`);
    })
    .catch((err) => {
      res.redirect(`/500`);
    });
};

exports.getCheckout = (req, res, next) => {
  let products;
  let total = 0;
  req.user
    .populate(`cart.items.productId`)
    .execPopulate()
    .then((user) => {
      products = user.cart.items;
      total = 0;
      products.forEach((p) => {
        total += p.quantity * p.productId.price;
      });

      return stripe.checkout.sessions.create({
        payment_method_types: [`card`],
        line_items: products.map((p) => {
          return {
            name: p.productId.title,
            description: p.productId.description,
            amount: p.productId.price * 100,
            currency: `usd`,
            quantity: p.quantity,
          };
        }),
        success_url:
          req.protocol + `://` + req.get(`host`) + `/checkout/success`,
        cancel_url: req.protocol + `://` + req.get(`host`) + `/checkout/cancel`,
      });
    })
    .then((session) => {
      res.render(`shop/checkout`, {
        path: `/checkout`,
        pageTitle: `Checkout`,
        products: products,
        totalValue: total,
        isAuthenticated: req.session.isLoggedIn,
        sessionId: session.id,
      });
    })
    .catch((err) => {
      res.redirect(`/500`);
    });
};

exports.deleteProductFromCart = (req, res, next) => {
  const productId = req.body.productId;
  req.user
    .deleteFromCart(productId)
    .then(() => res.redirect(`/cart`))
    .catch((err) => {
      res.redirect(`/500`);
    });
};

exports.postOrder = (req, res, next) => {
  req.user
    .populate(`cart.items.productId`)
    .execPopulate()
    .then((user) => {
      const products = user.cart.items.map((item) => {
        return { quantity: item.quantity, product: { ...item.productId } };
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user,
        },
        products: products,
      });
      return order.save();
    })
    .then(() => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect(`/orders`);
    })
    .catch((err) => {
      res.redirect(`/500`);
    });
};

exports.getOrders = (req, res, next) => {
  Order.find({ "user.userId": req.user._id })
    .then((orders) => {
      res.render(`shop/orders`, {
        path: `/orders`,
        pageTitle: `Your Orders`,
        orders: orders,
        isAuthenticated: req.session.isLoggedIn,
      });
    })
    .catch((err) => {
      res.redirect(`/500`);
    });
};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;
  Order.findById(orderId)
    .then((order) => {
      if (!order) {
        return next(new Error(`no order found`));
      }
      if (order.user.userId.toString() !== req.user._id.toString()) {
        return next(new Error(`unauthorized access`));
      }
      const invoiceName = orderId + `.pdf`;
      const invoicePath = path.join(`Data`, `invoices`, invoiceName);

      const doc = new PDFkit();
      res.setHeader(`Content-Type`, `application/pdf`);
      res.setHeader(
        `Content-Disposition`,
        `inline; filename="` + invoiceName + `"`
      );
      doc.pipe(fs.createWriteStream(invoicePath));
      doc.fontSize(26).text(`Invoice`, {
        underline: true,
      });
      doc.text(`--------------------------`);
      let totalPrice = 0;
      order.products.forEach((prod) => {
        totalPrice += prod.quantity * prod.product.price;
        doc
          .fontSize(15)
          .text(
            prod.product.title +
              `-` +
              prod.quantity +
              `x` +
              `$` +
              prod.product.price
          );
      });
      doc.text(`Subtotal = $` + totalPrice);
      doc.pipe(res);
      doc.end();

      // fs.readFile(invoicePath, (err, data) => {
      //   if (err) {
      //     return next(err);
      //   }
      //   res.setHeader(`Content-Type`, `application/pdf`);
      //   res.setHeader(
      //     `Content-Disposition`,
      //     `attachment; filename="` + invoiceName + `"`
      //   );
      //   res.send(data);
      // });
      // const file = fs.createReadStream(invoicePath);

      // file.pipe(res);
    })
    .catch((err) => next(err));
};
