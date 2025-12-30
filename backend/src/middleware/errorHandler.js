// Global error handler
exports.errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let status = err.status || 500;
  let message = err.message || 'Internal server error';

  // Database errors
  if (err.code === '23505') {
    status = 400;
    message = 'Duplicate entry - record already exists';
  }

  if (err.code === '23503') {
    status = 400;
    message = 'Foreign key constraint violation';
  }

  if (err.code === '22P02') {
    status = 400;
    message = 'Invalid input data type';
  }

  // Send error response
  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { 
      error: err.message,
      stack: err.stack 
    }),
  });
};

// Not found handler
exports.notFound = (req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
};