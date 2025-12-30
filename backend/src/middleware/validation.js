const { validationResult } = require('express-validator');

// Handle validation errors
exports.validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      message: 'Validation failed',
      errors: errors.array() 
    });
  }
  
  next();
};

// Common validation rules
exports.rules = {
  // Email validation
  email: {
    isEmail: {
      errorMessage: 'Invalid email address',
    },
    normalizeEmail: true,
  },
  
  // Required field
  required: {
    notEmpty: {
      errorMessage: 'This field is required',
    },
  },
  
  // Phone number
  phone: {
    matches: {
      options: [/^[0-9]{10}$/],
      errorMessage: 'Invalid phone number',
    },
  },
  
  // Password strength
  password: {
    isLength: {
      options: { min: 6 },
      errorMessage: 'Password must be at least 6 characters',
    },
  },
};