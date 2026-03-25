#!/usr/bin/env node

/**
 * IgnisStream Database Setup Script
 * Automatically sets up Supabase database with all migrations
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 IgnisStream Database Setup');
console.log('================================\n');

// Check if Supabase CLI is installed
function checkSupabaseCLI() {
  try {
    execSync('supabase --version', { stdio: 'pipe' });
    console.log('✅ Supabase CLI found');
    return true;
  } catch (error) {
    console.log('❌ Supabase CLI not found');
    console.log('Please install it with: npm install -g supabase');
    return false;
  }
}

// Check if environment variables are set
function checkEnvironment() {
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env.local file not found');
    console.log('Please copy .env.example to .env.local and configure it');
    return false;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  const missingVars = requiredVars.filter(varName => 
    !envContent.includes(varName) || envContent.includes(`${varName}=your_`)
  );

  if (missingVars.length > 0) {
    console.log('❌ Missing or unconfigured environment variables:');
    missingVars.forEach(varName => console.log(`   - ${varName}`));
    return false;
  }

  console.log('✅ Environment variables configured');
  return true;
}

// Run database migrations
function runMigrations() {
  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
  
  if (!fs.existsSync(migrationsDir)) {
    console.log('❌ Migrations directory not found');
    return false;
  }

  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  console.log(`\n📁 Found ${migrationFiles.length} migration files`);

  try {
    console.log('🔄 Running database migrations...');
    
    // Link to Supabase project
    console.log('🔗 Linking to Supabase project...');
    execSync('supabase db push', { stdio: 'inherit' });
    
    console.log('✅ All migrations completed successfully!');
    return true;
  } catch (error) {
    console.log('❌ Migration failed:', error.message);
    return false;
  }
}

// Create storage buckets
function createStorageBuckets() {
  console.log('\n🗂️  Setting up storage buckets...');
  
  const buckets = [
    { name: 'avatars', public: true },
    { name: 'posts', public: true },
    { name: 'thumbnails', public: true },
    { name: 'streams', public: true },
    { name: 'vods', public: true }
  ];

  console.log('📝 Required storage buckets:');
  buckets.forEach(bucket => {
    console.log(`   - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
  });

  console.log('\n⚠️  Please create these buckets manually in your Supabase dashboard:');
  console.log('   1. Go to Storage in your Supabase dashboard');
  console.log('   2. Click "Create bucket" for each bucket listed above');
  console.log('   3. Set the appropriate privacy settings');
}

// Generate TypeScript types
function generateTypes() {
  console.log('\n🔧 Generating TypeScript types...');
  
  try {
    execSync('supabase gen types typescript --local > types/database.ts', { stdio: 'inherit' });
    console.log('✅ TypeScript types generated');
  } catch (error) {
    console.log('⚠️  Could not generate types automatically');
    console.log('   Run manually: supabase gen types typescript --local > types/database.ts');
  }
}

// Main setup function
async function main() {
  console.log('Starting database setup...\n');

  // Step 1: Check prerequisites
  if (!checkSupabaseCLI()) {
    process.exit(1);
  }

  if (!checkEnvironment()) {
    process.exit(1);
  }

  // Step 2: Run migrations
  if (!runMigrations()) {
    process.exit(1);
  }

  // Step 3: Setup storage
  createStorageBuckets();

  // Step 4: Generate types
  generateTypes();

  console.log('\n🎉 Database setup completed!');
  console.log('\nNext steps:');
  console.log('1. Create storage buckets in Supabase dashboard');
  console.log('2. Configure gaming API keys in .env.local');
  console.log('3. Run: npm run dev');
  console.log('\nFor detailed instructions, see SETUP_GUIDE.md');
}

// Run the setup
main().catch(error => {
  console.error('❌ Setup failed:', error);
  process.exit(1);
});
