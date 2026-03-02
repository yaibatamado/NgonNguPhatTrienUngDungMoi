const User = require("../models/User");

// CREATE
exports.createUser = async (req, res) => {
  try {
    const user = await User.create(req.body);
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// GET ALL (không lấy user đã xóa mềm)
exports.getAllUsers = async (req, res) => {
  const users = await User.find({ isDeleted: false }).populate("role");
  res.json(users);
};

// GET BY ID
exports.getUserById = async (req, res) => {
  const user = await User.findById(req.params.id).populate("role");
  if (!user) return res.status(404).json({ message: "Not found" });
  res.json(user);
};

// UPDATE
exports.updateUser = async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json(user);
};

// SOFT DELETE
exports.softDeleteUser = async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, { isDeleted: true });
  res.json({ message: "User soft deleted" });
};

// ENABLE
exports.enableUser = async (req, res) => {
  const { email, username } = req.body;

  const user = await User.findOne({ email, username });

  if (!user)
    return res.status(404).json({ message: "Thông tin không đúng" });

  user.status = true;
  await user.save();

  res.json({ message: "User enabled", user });
};

// DISABLE
exports.disableUser = async (req, res) => {
  const { email, username } = req.body;

  const user = await User.findOne({ email, username });

  if (!user)
    return res.status(404).json({ message: "Thông tin không đúng" });

  user.status = false;
  await user.save();

  res.json({ message: "User disabled", user });
};