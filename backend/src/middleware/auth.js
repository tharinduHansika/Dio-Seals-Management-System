const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Verify JWT token
exports.verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user details with role
    const result = await db.query(
      `SELECT u.user_id, u.username, u.full_name, u.email, u.role_id, 
              r.role_name, r.permissions
       FROM users u
       JOIN roles r ON u.role_id = r.role_id
       WHERE u.user_id = $1 AND u.status = 'active'`,
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid token - user not found' });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(401).json({ message: 'Authentication failed' });
  }
};

// Check if user has required role
exports.checkRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Admin has access to everything
    if (req.user.role_name === 'Admin') {
      return next();
    }

    // Check if user's role is in allowed roles
    if (allowedRoles.includes(req.user.role_name)) {
      return next();
    }

    return res.status(403).json({ 
      message: 'Access denied - insufficient permissions',
      requiredRole: allowedRoles,
      userRole: req.user.role_name
    });
  };
};

// Check specific permission
exports.checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const permissions = req.user.permissions;
    
    // Admin has all permissions
    if (permissions.all === true) {
      return next();
    }

    if (permissions[permission] === true) {
      return next();
    }

    return res.status(403).json({ 
      message: 'Access denied - permission required',
      requiredPermission: permission
    });
  };
};