const Product = require(`../models/product`);
const { validationResult } = require(`express-validator`);
const fileHelper = require(`../util/file`);

exports.getAddProducts = (req, res, next) => {
  res.render("admin/edit-product", {
    pageTitle: "Add Product",
    path: "/admin/add-product",
    edit: false,
    hasError: false,
    errMessage: null,
    validationErrors: [],
    isAuthenticated: req.session.isLoggedIn,
  });
};

exports.postAddProducts = (req, res, next) => {
  const title = req.body.title;
  //const imgUrl = req.body.imgUrl;
  const img = req.file;
  const price = req.body.price;
  const description = req.body.description;

  if (!img) {
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Add Product",
      path: "/admin/add-product",
      edit: false,
      hasError: true,
      product: {
        title: title,
        price: price,
        description: description,
      },
      errMessage: `invalid image file`,
      validationErrors: [],
      isAuthenticated: req.session.isLoggedIn,
    });
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Add Product",
      path: "/admin/add-product",
      edit: false,
      hasError: true,
      product: {
        title: title,
        price: price,
        //imgUrl: imgUrl,
        description: description,
      },
      errMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
      isAuthenticated: req.session.isLoggedIn,
    });
  }

  const imgUrl = "\\" + img.path;

  const product = new Product({
    title: title,
    price: price,
    imgUrl: imgUrl,
    description: description,
    userId: req.user._id,
  });
  product
    .save()
    .then(() => {
      res.redirect(`/admin/products`);
    })
    .catch((err) => {
      res.redirect(`/500`);
    });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  const productId = req.params.productId;

  Product.findById(productId)
    .then((product) => {
      if (!product) {
        return res.redirect(`/`);
      }
      res.render("admin/edit-product", {
        pageTitle: "Edit Product",
        path: "/admin/edit-product",
        edit: editMode,
        hasError: false,
        product: product,
        errMessage: null,
        validationErrors: [],
        isAuthenticated: req.session.isLoggedIn,
      });
    })
    .catch((err) => {
      res.redirect(`/500`);
    });
};

exports.getProducts = (req, res, next) => {
  Product.find({ userId: req.user._id })
    .then((products) => {
      res.render("admin/products", {
        prods: products,
        pageTitle: "Admin Products",
        path: "admin/products",
        isAuthenticated: req.session.isLoggedIn,
      });
    })
    .catch((err) => {
      res.redirect(`/500`);
    });
};

exports.postEditProduct = (req, res, next) => {
  const productId = req.body.productId;
  const updatedTitle = req.body.title;
  const img = req.file;
  const updatedPrice = req.body.price;
  const updatedDesc = req.body.description;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Edit Product",
      path: "/admin/edit-product",
      edit: true,
      hasError: true,
      product: {
        title: updatedTitle,
        price: updatedPrice,
        imgUrl: img.path,
        description: updatedDesc,
        _id: productId,
      },
      errMessage: errors.array()[0].msg,
      validationErrors: errors.array(),
      isAuthenticated: req.session.isLoggedIn,
    });
  }

  Product.findById(productId)
    .then((product) => {
      if (product.userId.toString() !== req.user._id.toString()) {
        return res.redirect(`/`);
      }
      product.title = updatedTitle;
      product.price = updatedPrice;
      if (img) {
        fileHelper.deleteFile(product.imgUrl);
        product.imgUrl = `\\` + img.path;
      }
      product.description = updatedDesc;

      return product.save().then(() => {
        res.redirect(`/admin/products`);
      });
    })
    .catch((err) => {
      res.redirect(`/500`);
    });
};

exports.deleteProduct = (req, res, next) => {
  const productId = req.params.productId;
  Product.findById(productId)
    .then((product) => {
      if (!product) {
        return next(new Error(`no product found`));
      }
      fileHelper.deleteFile(product.imgUrl);
      return Product.deleteOne({ _id: productId, userId: req.user._id });
    })
    .then(() => {
      req.user.deleteFromCart(productId);
      res.status(200).json({ message: `success` });
    })
    .catch((err) => {
      res.status(500).json({ message: `failed` });
    });
};
