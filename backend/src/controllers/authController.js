const User = require('../models/User');
const generateToken = require('../utils/generateToken');

const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt
});

const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({ message: 'User already exists with this email.' });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: 'student'
    });

    res.status(201).json({
      message: 'Registration successful.',
      token: generateToken(user._id),
      user: sanitizeUser(user)
    });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed.', error: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (user.role !== 'student') {
      return res.status(403).json({ message: 'Student account required for this login.' });
    }

    res.status(200).json({
      message: 'Login successful.',
      token: generateToken(user._id),
      user: sanitizeUser(user)
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed.', error: error.message });
  }
};

const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    if (user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required.' });
    }

    res.status(200).json({
      message: 'Admin login successful.',
      token: generateToken(user._id),
      user: sanitizeUser(user)
    });
  } catch (error) {
    res.status(500).json({ message: 'Admin login failed.', error: error.message });
  }
};

const getMe = async (req, res) => {
  res.status(200).json({ user: sanitizeUser(req.user) });
};

const logoutUser = (req, res) => {
  res.status(200).json({ message: 'Logged out successfully.' });
};

module.exports = {
  registerUser,
  loginUser,
  adminLogin,
  getMe,
  logoutUser
};
