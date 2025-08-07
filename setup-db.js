const { execSync } = require('child_process');

// Set environment variables
process.env.DATABASE_URL = "postgres://postgres:7q5Fc3THW88L73nd7pizr2nmmrfYsriUgFGGUvoBLdzXQUD287omXrjKzjNPc9Be@s4kcgg0kcw0c4wowoocsogk0:5432/postgres";

console.log('Running database migration...');

try {
  // Run migration
  execSync('npm run db:migrate', { stdio: 'inherit' });
  console.log('✅ Migration completed successfully!');
  
  // Run seed
  console.log('Running database seed...');
  execSync('npm run db:seed', { stdio: 'inherit' });
  console.log('✅ Seed completed successfully!');
  
} catch (error) {
  console.error('❌ Database setup failed:', error.message);
  process.exit(1);
}