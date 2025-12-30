// Generate unique number
exports.generateUniqueNumber = (prefix = '') => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `${prefix}${timestamp}${random}`;
};

// Format date
exports.formatDate = (date) => {
  return new Date(date).toISOString().split('T')[0];
};

// Calculate days difference
exports.daysDifference = (date1, date2) => {
  const diffTime = Math.abs(new Date(date2) - new Date(date1));
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// Pagination helper
exports.paginate = (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  return { limit, offset };
};

// Response formatter
exports.successResponse = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

exports.errorResponse = (res, message = 'Error', statusCode = 500, errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(errors && { errors }),
  });
};