const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true, required: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['Admin','Reception','Manager','Tech'], default: 'Reception' },
  name: String,
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
