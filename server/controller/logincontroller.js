const jwt = require('jsonwebtoken');
require('dotenv').config({ path: '../.env' });

exports.adminLogin = (req, res) => {
  const { username, password } = req.body;

  console.log('Login attempt:', { username, password });
  console.log('Environment Variables:', {
    ADMIN_USERNAME: process.env.AdminEmail,
    ADMIN_PASSWORD: process.env.AdminPassword
  });

  if (
    username === process.env.AdminEmail &&
    password === process.env.AdminPassword
  ) {
    // ✅ Login success - Generate JWT token
    console.log('Login successful for user:', username);

    const token = jwt.sign(
      { 
        username: username,
        role: 'admin',
        userId: 'admin_user'
      },
      process.env.SECRETKEY,
      { expiresIn: '1d' } // Token expires in 1 day
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      token: token,
      user: {
        username: username,
        role: 'admin'
      }
    });
  } else {
    // ❌ Login fail
    console.log('Login failed for user:', username);

    return res.status(401).json({
      success: false,
      message: 'Invalid username or password'
    });
  }
};

// Verify JWT token middleware
exports.verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No token provided.'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRETKEY);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token.'
    });
  }
};

// Get user profile (protected route)
exports.getProfile = (req, res) => {
  res.status(200).json({
    success: true,
    user: {
      username: req.user.username,
      role: req.user.role
    }
  });
};
