class Formatters {
  static formatCurrency(amount, currency = 'LKR') {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }

  static formatDate(date, format = 'short') {
    const options = format === 'long' 
      ? { year: 'numeric', month: 'long', day: 'numeric' }
      : { year: 'numeric', month: '2-digit', day: '2-digit' };
    
    return new Intl.DateTimeFormat('en-LK', options).format(new Date(date));
  }

  static formatDateTime(date) {
    return new Intl.DateTimeFormat('en-LK', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  }

  static formatPercentage(value, decimals = 2) {
    return `${parseFloat(value).toFixed(decimals)}%`;
  }

  static formatNumber(number, decimals = 2) {
    return parseFloat(number).toFixed(decimals);
  }

  static sanitizeString(str) {
    if (!str) return '';
    return str.trim().replace(/[<>]/g, '');
  }

  static capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  static formatPhoneNumber(phone) {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  }
}

module.exports = Formatters;