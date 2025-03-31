const mongoose = require('mongoose');

const streakSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  currentStreak: { 
    type: Number, 
    default: 0 
  },
  lastUpdateDate: { 
    type: Date, 
    default: null 
  }
});

module.exports = mongoose.model('Streak', streakSchema);