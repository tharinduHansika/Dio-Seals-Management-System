const app = require('./src/app');
const db = require('./src/config/database');

const PORT = process.env.PORT || 5000;

// Test database connection
db.query('SELECT NOW()')
  .then((result) => {
    console.log('✅ Database connection verified');
    console.log(`   Current time: ${result.rows[0].now}`);
    
    // Start server
    const server = app.listen(PORT, () => {
      console.log('');
      console.log('╔════════════════════════════════════════════════╗');
      console.log('║                                                ║');
      console.log('║        🚀 DIO SEALS API SERVER RUNNING        ║');
      console.log('║                                                ║');
      console.log('╚════════════════════════════════════════════════╝');
      console.log('');
      console.log(`   📍 Server URL:     http://localhost:${PORT}`);
      console.log(`   📊 Health Check:   http://localhost:${PORT}/health`);
      console.log(`   🔧 Environment:    ${process.env.NODE_ENV}`);
      console.log(`   📅 Started at:     ${new Date().toLocaleString()}`);
      console.log('');
      console.log('   Available endpoints:');
      console.log('   • POST   /api/auth/login');
      console.log('   • POST   /api/auth/register');
      console.log('   • GET    /api/customers');
      console.log('   • GET    /api/products');
      console.log('   • GET    /api/stock');
      console.log('');
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully...');
      server.close(() => {
        console.log('Server closed');
        db.pool.end();
        process.exit(0);
      });
    });
  })
  .catch((err) => {
    console.error('');
    console.error('╔════════════════════════════════════════════════╗');
    console.error('║                                                ║');
    console.error('║        ❌ DATABASE CONNECTION FAILED           ║');
    console.error('║                                                ║');
    console.error('╚════════════════════════════════════════════════╝');
    console.error('');
    console.error('Error details:', err.message);
    console.error('');
    console.error('Please check:');
    console.error('  1. PostgreSQL is running');
    console.error('  2. Database credentials in .env are correct');
    console.error('  3. Database "dio_seals" exists');
    console.error('');
    process.exit(1);
  });

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});