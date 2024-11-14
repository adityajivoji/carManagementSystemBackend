const mongoose = require('mongoose');

const carSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  tags: [String], // Array of tags like 'car_type', 'company', etc.
  images: [String], // Array of image URLs
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference to User
});


module.exports = mongoose.model('Car', carSchema);
