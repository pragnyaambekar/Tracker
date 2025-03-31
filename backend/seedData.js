const mongoose = require('mongoose');
const Achievement = require('./models/Achievement');
const Problem = require('./models/Problem');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/streak-tracker')
  .then(() => console.log('MongoDB connected for seeding'))
  .catch(err => console.error('MongoDB connection error:', err));

async function seedData() {
  try {
    // Check if data already exists
    const achievementsCount = await Achievement.countDocuments();
    const problemsCount = await Problem.countDocuments();
    
    // Seed achievements if none exist
    if (achievementsCount === 0) {
      console.log('Seeding achievements...');
      const achievements = [
        { name: '5-Day Streak', description: 'You\'ve maintained a 5-day streak!', threshold: 5, badgeText: '🎖️ 5-Day' },
        { name: '10-Day Streak', description: 'You\'ve maintained a 10-day streak!', threshold: 10, badgeText: '🏆 10-Day' },
        { name: '30-Day Streak', description: 'You\'ve maintained a 30-day streak!', threshold: 30, badgeText: '🔥 30-Day' },
        { name: '50-Day Streak', description: 'You\'ve maintained a 50-day streak!', threshold: 50, badgeText: '💎 50-Day' },
        { name: '100-Day Streak', description: 'You\'ve maintained a 100-day streak!', threshold: 100, badgeText: '🚀 100-Day' }
      ];
      
      await Achievement.insertMany(achievements);
      console.log('Achievements seeded successfully');
    } else {
      console.log('Achievements already exist, skipping seeding');
    }
    
    // Seed problems if none exist
    if (problemsCount === 0) {
      console.log('Seeding problems...');
      const problemData = {
        "array": ["Contains Duplicate", "Valid Anagram", "Two Sum", "Group Anagram", "Top K Frequent Elements", "Encode and Decode Strings", "Product of Array Except Self", "Longest Consecutive Sequence"],
        "twoPointers": ["Valid Palindrome", "3Sum", "Container With Most Water"],
        "slidingWindow": ["Best Time to Buy and Sell Stock", "Longest Substring Without Repeating", "Longest Repeating Character Replacement", "Minimum Window Substring"],
        "stack": ["Valid Parentheses"],
        "binarySearch": ["Find Minimum In Rotated Sorted Array", "Search In Rotated Sorted Array"],
        "linkedList": ["Reverse Linked List", "Merge Two Sorted Lists", "Reorder List", "Remove Nth Node From End of List", "Linked List Cycle"],
        "trees": ["Invert Binary Tree", "Maximum Depth of Binary Tree", "Same Tree", "Subtree of Another Tree", "Lowest Common Ancestor of a BST"]
      };
      
      const problems = [];
      
      for (const category in problemData) {
        for (const problemName of problemData[category]) {
          problems.push({
            name: problemName,
            category
          });
        }
      }
      
      await Problem.insertMany(problems);
      console.log('Problems seeded successfully');
    } else {
      console.log('Problems already exist, skipping seeding');
    }
    
    console.log('Data seeding complete');
    process.exit(0);
  } catch (error) {
    console.error('Data seeding error:', error);
    process.exit(1);
  }
}

seedData();