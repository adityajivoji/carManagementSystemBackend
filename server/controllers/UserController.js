const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// User Signup
const signup = async (req, res) => {
  const { username, password } = req.body;

  try {
    // Check if the user already exists
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    // Create new user with hashed password
    const user = new User({ username, password });
    await user.save();

    res.status(201).json({message: "Signup Completed" });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};


// User Login remains the same
const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(433).send('Invalid credentials');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(432).send('Invalid credentials');

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    console.log(token)
    res.status(200).json({token });
  } catch (err) {
    res.status(500).send('Server error');
  }
};

module.exports = { signup, login };
