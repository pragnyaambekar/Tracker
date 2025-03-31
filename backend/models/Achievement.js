const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  threshold: { 
    type: Number, 
    required: true 
  },
  badgeText: { 
    type: String, 
    required: true 
  }
});

module.exports = mongoose.model('Achievement', achievementSchema);