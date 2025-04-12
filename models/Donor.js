const mongoose = require('mongoose');

const donorSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  organ: String,
  fullName: String,
  age: Number,
  bloodType: String,
  contact: String,
  address: String
});

module.exports = mongoose.model('Donor', donorSchema);
