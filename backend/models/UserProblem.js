const mongoose = require('mongoose');

const userProblemSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  problemId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Problem', 
    required: true 
  },
  completed: { 
    type: Boolean, 
    default: false 
  },
  completedAt: { 
    type: Date 
  }
});

// Compound index to ensure a user can only have one entry per problem
userProblemSchema.index({ userId: 1, problemId: 1 }, { unique: true });

module.exports = mongoose.model('UserProblem', userProblemSchema);