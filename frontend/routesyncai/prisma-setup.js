const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Ensure dev.db exists
fs.writeFileSync('dev.db', '');

// Run prisma format to fix any schema issues
try {
  console.log('Running prisma format...');
  execSync('npx prisma format', { stdio: 'inherit' });
  
  console.log('Running prisma generate...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  console.log('Prisma setup complete!');
} catch (error) {
  console.error('Error during Prisma setup:', error.message);
  process.exit(1);
} 