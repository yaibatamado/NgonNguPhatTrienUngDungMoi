const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    default: ""
  },
  isDeleted: {               // 👈 thêm dòng này
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model("Role", roleSchema);