var express = require("express");
var router = express.Router();

let mongoose = require("mongoose");
let { checkLogin } = require("../utils/authHandler");
let reservationModel = require("../schemas/reservations");
let cartModel = require("../schemas/carts");
let inventoryModel = require("../schemas/inventories");
let productModel = require("../schemas/products");

// get all reservations of current user
router.get("/", checkLogin, async function (req, res, next) {
  try {
    let reservations = await reservationModel
      .find({ user: req.userId })
      .populate("items.product")
      .sort({ createdAt: -1 });
    res.send(reservations);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// get single reservation of current user
router.get("/:id", checkLogin, async function (req, res, next) {
  try {
    let reservation = await reservationModel
      .findOne({ _id: req.params.id, user: req.userId })
      .populate("items.product");
    if (!reservation) {
      return res.status(404).send({ message: "reservation not found" });
    }
    res.send(reservation);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

// reserve items from current cart
router.post("/reserveACart", checkLogin, async function (req, res, next) {
  let session = await mongoose.startSession();
  session.startTransaction();
  try {
    let currentCart = await cartModel
      .findOne({ user: req.userId })
      .session(session);
    if (!currentCart || currentCart.cartItems.length === 0) {
      throw new Error("cart is empty");
    }

    let items = [];
    let totalAmount = 0;

    for (const cartItem of currentCart.cartItems) {
      let inventory = await inventoryModel
        .findOne({ product: cartItem.product })
        .session(session);
      if (!inventory) {
        throw new Error("inventory not found for product");
      }

      let available =
        inventory.stock - inventory.reserved - inventory.soldCount;
      if (available < cartItem.quantity) {
        throw new Error("not enough stock for product");
      }

      let product = await productModel
        .findById(cartItem.product)
        .session(session);
      if (!product) {
        throw new Error("product not found");
      }

      let subtotal = product.price * cartItem.quantity;
      totalAmount += subtotal;

      items.push({
        product: cartItem.product,
        quantity: cartItem.quantity,
        title: product.title,
        price: product.price,
        subtotal: subtotal,
      });

      inventory.stock -= cartItem.quantity;
      inventory.reserved += cartItem.quantity;
      await inventory.save({ session });
    }

    let expiredIn = new Date(Date.now() + 15 * 60 * 1000);
    let reservation = new reservationModel({
      user: req.userId,
      items: items,
      amount: totalAmount,
      expiredIn: expiredIn,
    });
    reservation = await reservation.save({ session });

    await session.commitTransaction();
    session.endSession();

    let populated = await reservationModel
      .findById(reservation._id)
      .populate("items.product");
    res.send(populated);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).send({ message: err.message });
  }
});

// reserve items directly from body: { items: [{ product, quantity }] }
router.post("/reserveItems", checkLogin, async function (req, res, next) {
  let session = await mongoose.startSession();
  session.startTransaction();
  try {
    let bodyItems = req.body.items || [];
    if (!Array.isArray(bodyItems) || bodyItems.length === 0) {
      throw new Error("items is required");
    }

    let items = [];
    let totalAmount = 0;

    for (const bodyItem of bodyItems) {
      let { product, quantity } = bodyItem;
      if (!product || !quantity || quantity <= 0) {
        throw new Error("invalid product or quantity");
      }

      let inventory = await inventoryModel
        .findOne({ product: product })
        .session(session);
      if (!inventory) {
        throw new Error("inventory not found for product");
      }

      let available =
        inventory.stock - inventory.reserved - inventory.soldCount;
      if (available < quantity) {
        throw new Error("not enough stock for product");
      }

      let productDoc = await productModel.findById(product).session(session);
      if (!productDoc) {
        throw new Error("product not found");
      }

      let subtotal = productDoc.price * quantity;
      totalAmount += subtotal;

      items.push({
        product: product,
        quantity: quantity,
        title: productDoc.title,
        price: productDoc.price,
        subtotal: subtotal,
      });

      inventory.stock -= quantity;
      inventory.reserved += quantity;
      await inventory.save({ session });
    }

    let expiredIn = new Date(Date.now() + 15 * 60 * 1000);
    let reservation = new reservationModel({
      user: req.userId,
      items: items,
      amount: totalAmount,
      expiredIn: expiredIn,
    });
    reservation = await reservation.save({ session });

    await session.commitTransaction();
    session.endSession();

    let populated = await reservationModel
      .findById(reservation._id)
      .populate("items.product");
    res.send(populated);
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.status(400).send({ message: err.message });
  }
});

// cancel a reservation of current user
router.post("/cancelReserve/:id", checkLogin, async function (req, res, next) {
  try {
    let reservation = await reservationModel.findOne({
      _id: req.params.id,
      user: req.userId,
    });
    if (!reservation) {
      return res.status(404).send({ message: "reservation not found" });
    }
    if (reservation.status !== "actived") {
      return res
        .status(400)
        .send({ message: "reservation cannot be cancelled" });
    }

    for (const item of reservation.items) {
      let inventory = await inventoryModel.findOne({ product: item.product });
      if (!inventory) {
        continue;
      }
      inventory.stock += item.quantity;
      inventory.reserved = Math.max(
        0,
        inventory.reserved - item.quantity
      );
      await inventory.save();
    }

    reservation.status = "cancelled";
    await reservation.save();

    let populated = await reservationModel
      .findById(reservation._id)
      .populate("items.product");
    res.send(populated);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});

module.exports = router;

