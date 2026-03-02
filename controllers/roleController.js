const Role = require("../models/Role");

// CREATE
exports.createRole = async (req, res) => {
  try {
    const role = await Role.create(req.body);
    res.json(role);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// GET ALL (không lấy role đã xoá mềm)
exports.getAllRoles = async (req, res) => {
  const roles = await Role.find({ isDeleted: false });
  res.json(roles);
};

// GET BY ID
exports.getRoleById = async (req, res) => {
  const role = await Role.findOne({
    _id: req.params.id,
    isDeleted: false
  });

  if (!role)
    return res.status(404).json({ message: "Role not found" });

  res.json(role);
};

// UPDATE
exports.updateRole = async (req, res) => {
  const role = await Role.findOneAndUpdate(
    { _id: req.params.id, isDeleted: false },
    req.body,
    { new: true }
  );

  if (!role)
    return res.status(404).json({ message: "Role not found" });

  res.json(role);
};

// SOFT DELETE
exports.softDeleteRole = async (req, res) => {
  const role = await Role.findByIdAndUpdate(
    req.params.id,
    { isDeleted: true },
    { new: true }
  );

  if (!role)
    return res.status(404).json({ message: "Role not found" });

  res.json({ message: "Role soft deleted" });
};