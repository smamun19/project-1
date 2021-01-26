const mongoose = require(`mongoose`);

const Schema = mongoose.Schema;

const productSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  imgUrl: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },

  userId: {
    type: mongoose.Types.ObjectId,
    ref: `User`,
    required: true,
  },
});

module.exports = mongoose.model(`Product`, productSchema);

// class Product {
//   constructor(title, price, description, imgUrl, _id, userId) {
//     this.title = title;
//     this.price = price;
//     this.description = description;
//     this.imgUrl = imgUrl;
//     this._id = mongoDb.ObjectId(_id);
//     this.userId = userId;
//   }

//   save() {
//     const db = getDb();
//     return db
//       .collection(`products`)
//       .insertOne(this)
//       .then((result) => console.log(result))
//       .catch((err) => console.log(err));
//   }

//   update() {
//     const db = getDb();
//     return db
//       .collection(`products`)
//       .updateOne({ _id: this._id }, { $set: this })
//       .then((result) => console.log(result))
//       .catch((err) => console.log(err));
//   }

//   static fetchAll() {
//     const db = getDb();
//     return db
//       .collection(`products`)
//       .find()
//       .toArray()
//       .then((products) => {
//         console.log(products);
//         return products;
//       })
//       .catch((err) => console.log(err));
//   }

//   static findById(productId) {
//     const db = getDb();
//     return db
//       .collection(`products`)
//       .find({ _id: mongoDb.ObjectId(productId) })
//       .next()
//       .then((product) => product)
//       .catch((err) => console.log(err));
//   }

//   static deleteById(productId) {
//     const db = getDb();
//     return db
//       .collection(`products`)
//       .deleteOne({ _id: mongoDb.ObjectId(productId) })
//       .then((result) => console.log(result))
//       .catch((err) => console.log(err));
//   }
// }

// module.exports = Product;
