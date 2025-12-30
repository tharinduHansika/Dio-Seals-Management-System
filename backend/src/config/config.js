module.exports = {
  app: {
    name: process.env.APP_NAME || 'Dio Seals',
    env: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 5000,
  },
  db: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  },
  jwt: {
    secret: process.env.JWT_SECRET,
    expire: process.env.JWT_EXPIRE,
  },
  frontend: {
    url: process.env.FRONTEND_URL,
  },
};