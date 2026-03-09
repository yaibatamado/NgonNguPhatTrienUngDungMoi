var express = require("express");
var router = express.Router();

let bcrypt = require("bcrypt");

let { userPostValidation, validateResult } =
  require("../utils/validationHandler");

let { checkLogin, checkRole } = require("../utils/authHandler");

let userController = require("../controllers/users");

let userModel = require("../schemas/users");



// ===== GET ALL USER (ADMIN) =====
router.get("/", checkLogin, checkRole("ADMIN"), async function (req, res, next) {
  let result = await userController.getAllUser();
  res.send(result);
});



// ===== GET USER BY ID (ADMIN + MODERATOR) =====
router.get(
  "/:id",
  checkLogin,
  checkRole("ADMIN", "MODERATOR"),
  async function (req, res, next) {
    try {
      let result = await userController.FindByID(req.params.id);

      if (result) {
        res.send(result);
      } else {
        res.status(404).send({ message: "id not found" });
      }
    } catch (error) {
      res.status(404).send({ message: "id not found" });
    }
  }
);



// ===== CREATE USER =====
router.post(
  "/",
  userPostValidation,
  validateResult,
  async function (req, res, next) {
    try {
      let newItem = await userController.CreateAnUser(
        req.body.username,
        req.body.password,
        req.body.email,
        req.body.role,
        "",
        "",
        false
      );

      let saved = await userController.FindByID(newItem._id);

      res.send(saved);
    } catch (err) {
      res.status(400).send({ message: err.message });
    }
  }
);



// ===== UPDATE USER =====
router.put("/:id", checkLogin, checkRole("ADMIN"), async function (req, res) {
  try {
    let id = req.params.id;

    let updatedItem = await userModel.findOne({
      _id: id,
      isDeleted: false,
    });

    if (!updatedItem) {
      return res.status(404).send({ message: "id not found" });
    }

    let keys = Object.keys(req.body);

    for (const key of keys) {
      updatedItem[key] = req.body[key];
    }

    await updatedItem.save();

    let populated = await userModel.findById(updatedItem._id);

    res.send(populated);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});



// ===== DELETE USER (SOFT DELETE) =====
router.delete("/:id", checkLogin, checkRole("ADMIN"), async function (req, res) {
  try {
    let id = req.params.id;

    let updatedItem = await userModel.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );

    if (!updatedItem) {
      return res.status(404).send({ message: "id not found" });
    }

    res.send(updatedItem);
  } catch (err) {
    res.status(400).send({ message: err.message });
  }
});



// ===== CHANGE PASSWORD =====
router.post("/change-password", checkLogin, async function (req, res) {
  try {
    let userId = req.userId;

    let { oldpassword, newpassword } = req.body;

    let user = await userController.FindByID(userId);

    if (!user) {
      return res.status(404).send({ message: "User not found" });
    }

    // kiểm tra password cũ
    let isMatch = await bcrypt.compare(oldpassword, user.password);

    if (!isMatch) {
      return res.status(400).send({
        message: "Old password không đúng",
      });
    }

    // hash password mới
    let hashPassword = await bcrypt.hash(newpassword, 10);

    user.password = hashPassword;

    await user.save();

    res.send({
      message: "Đổi mật khẩu thành công",
    });
  } catch (error) {
    res.status(400).send({
      message: error.message,
    });
  }
});



module.exports = router;