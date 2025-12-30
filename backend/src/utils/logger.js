const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    this.logsDir = path.join(__dirname, '../../logs');
    
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...(data && { data })
    };

    const logString = JSON.stringify(logEntry) + '\n';

    // Console output
    const colors = {
      info: '\x1b[36m',
      warn: '\x1b[33m',
      error: '\x1b[31m',
      success: '\x1b[32m',
      reset: '\x1b[0m'
    };

    console.log(`${colors[level] || ''}[${level.toUpperCase()}] ${timestamp} - ${message}${colors.reset}`);

    // File output
    const logFile = path.join(this.logsDir, `${level}.log`);
    fs.appendFileSync(logFile, logString);

    // Combined log
    const combinedFile = path.join(this.logsDir, 'combined.log');
    fs.appendFileSync(combinedFile, logString);
  }

  info(message, data = null) {
    this.log('info', message, data);
  }

  warn(message, data = null) {
    this.log('warn', message, data);
  }

  error(message, data = null) {
    this.log('error', message, data);
  }

  success(message, data = null) {
    this.log('success', message, data);
  }
}

module.exports = new Logger();