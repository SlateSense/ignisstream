#!/usr/bin/env node

/**
 * IgnisStream Setup Validation Script
 * Validates that all components are properly configured
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 IgnisStream Setup Validation');
console.log('================================\n');

let validationResults = {
  environment: false,
  database: false,
  dependencies: false,
  apis: false,
  storage: false
};

// Validate environment configuration
function validateEnvironment() {
  console.log('📋 Validating Environment Configuration...');
  
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env.local file not found');
    return false;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  const optionalVars = [
    'NEXT_PUBLIC_STEAM_API_KEY',
    'NEXT_PUBLIC_EPIC_CLIENT_ID',
    'NEXT_PUBLIC_RIOT_API_KEY',
    'SUPABASE_AUTH_EXTERNAL_DISCORD_CLIENT_ID',
    'SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID'
  ];

  let allRequired = true;
  let configuredOptional = 0;

  // Check required variables
  requiredVars.forEach(varName => {
    if (!envContent.includes(varName) || envContent.includes(`${varName}=your_`)) {
      console.log(`❌ Missing: ${varName}`);
      allRequired = false;
    } else {
      console.log(`✅ Configured: ${varName}`);
    }
  });

  // Check optional variables
  optionalVars.forEach(varName => {
    if (envContent.includes(varName) && !envContent.includes(`${varName}=your_`)) {
      console.log(`✅ Optional: ${varName}`);
      configuredOptional++;
    }
  });

  console.log(`📊 Optional APIs configured: ${configuredOptional}/${optionalVars.length}\n`);
  
  return allRequired;
}

// Validate database connection and tables
async function validateDatabase() {
  console.log('🗄️  Validating Database Setup...');
  
  try {
    // Check if we can connect to Supabase
    const { createClient } = require('@supabase/supabase-js');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.log('❌ Supabase credentials not found in environment');
      return false;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test connection by checking if profiles table exists
    const { data, error } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (error) {
      console.log('❌ Database connection failed:', error.message);
      return false;
    }

    console.log('✅ Database connection successful');

    // Check key tables exist
    const keyTables = [
      'profiles',
      'posts',
      'games',
      'user_game_accounts',
      'user_game_stats',
      'tournaments',
      'streams',
      'friends'
    ];

    let tablesExist = 0;
    for (const table of keyTables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('count')
          .limit(1);
        
        if (!error) {
          console.log(`✅ Table exists: ${table}`);
          tablesExist++;
        } else {
          console.log(`❌ Table missing: ${table}`);
        }
      } catch (err) {
        console.log(`❌ Table missing: ${table}`);
      }
    }

    console.log(`📊 Tables found: ${tablesExist}/${keyTables.length}\n`);
    
    return tablesExist >= keyTables.length * 0.8; // 80% of tables should exist
  } catch (error) {
    console.log('❌ Database validation failed:', error.message);
    return false;
  }
}

// Validate dependencies
function validateDependencies() {
  console.log('📦 Validating Dependencies...');
  
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  if (!fs.existsSync(packageJsonPath)) {
    console.log('❌ package.json not found');
    return false;
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  const keyDependencies = [
    'next',
    'react',
    'typescript',
    '@supabase/supabase-js',
    'tailwindcss',
    'framer-motion'
  ];

  let installedDeps = 0;
  keyDependencies.forEach(dep => {
    if (dependencies[dep]) {
      console.log(`✅ Installed: ${dep}@${dependencies[dep]}`);
      installedDeps++;
    } else {
      console.log(`❌ Missing: ${dep}`);
    }
  });

  // Check if node_modules exists
  const nodeModulesPath = path.join(process.cwd(), 'node_modules');
  const nodeModulesExists = fs.existsSync(nodeModulesPath);
  
  if (!nodeModulesExists) {
    console.log('❌ node_modules not found - run npm install');
    return false;
  } else {
    console.log('✅ node_modules directory exists');
  }

  console.log(`📊 Key dependencies: ${installedDeps}/${keyDependencies.length}\n`);
  
  return installedDeps === keyDependencies.length && nodeModulesExists;
}

// Validate API configurations
function validateAPIs() {
  console.log('🎮 Validating Gaming API Setup...');
  
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env.local file not found');
    return false;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  
  const apiConfigs = [
    { name: 'Steam API', key: 'NEXT_PUBLIC_STEAM_API_KEY' },
    { name: 'Epic Games', key: 'NEXT_PUBLIC_EPIC_CLIENT_ID' },
    { name: 'Riot Games', key: 'NEXT_PUBLIC_RIOT_API_KEY' },
    { name: 'Discord OAuth', key: 'SUPABASE_AUTH_EXTERNAL_DISCORD_CLIENT_ID' },
    { name: 'Google OAuth', key: 'SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID' }
  ];

  let configuredAPIs = 0;
  apiConfigs.forEach(api => {
    if (envContent.includes(api.key) && !envContent.includes(`${api.key}=your_`)) {
      console.log(`✅ Configured: ${api.name}`);
      configuredAPIs++;
    } else {
      console.log(`⚠️  Not configured: ${api.name}`);
    }
  });

  console.log(`📊 Gaming APIs configured: ${configuredAPIs}/${apiConfigs.length}\n`);
  
  return configuredAPIs > 0; // At least one API should be configured
}

// Validate build process
function validateBuild() {
  console.log('🔨 Validating Build Process...');
  
  try {
    console.log('🔄 Running build check...');
    execSync('npm run build', { stdio: 'pipe' });
    console.log('✅ Build successful');
    return true;
  } catch (error) {
    console.log('❌ Build failed');
    console.log('Error:', error.message);
    return false;
  }
}

// Generate setup report
function generateReport() {
  console.log('📋 Setup Validation Report');
  console.log('==========================\n');
  
  const results = Object.entries(validationResults);
  const passed = results.filter(([, status]) => status).length;
  const total = results.length;
  
  results.forEach(([category, status]) => {
    const icon = status ? '✅' : '❌';
    const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
    console.log(`${icon} ${categoryName}`);
  });
  
  console.log(`\n📊 Overall Score: ${passed}/${total} (${Math.round(passed/total*100)}%)\n`);
  
  if (passed === total) {
    console.log('🎉 All validations passed! Your IgnisStream platform is ready to launch!');
    console.log('\nNext steps:');
    console.log('1. Run: npm run dev');
    console.log('2. Open: http://localhost:3000');
    console.log('3. Create your first account');
  } else {
    console.log('⚠️  Some validations failed. Please check the issues above.');
    console.log('\nRecommended actions:');
    
    if (!validationResults.environment) {
      console.log('- Configure missing environment variables in .env.local');
    }
    if (!validationResults.database) {
      console.log('- Run database migrations: npm run setup:db');
    }
    if (!validationResults.dependencies) {
      console.log('- Install dependencies: npm install');
    }
    if (!validationResults.apis) {
      console.log('- Configure at least one gaming API key');
    }
  }
}

// Main validation function
async function main() {
  console.log('Starting validation...\n');

  // Load environment variables
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
  }

  // Run validations
  validationResults.environment = validateEnvironment();
  validationResults.dependencies = validateDependencies();
  validationResults.apis = validateAPIs();
  
  // Database validation requires async
  try {
    validationResults.database = await validateDatabase();
  } catch (error) {
    console.log('❌ Database validation error:', error.message);
    validationResults.database = false;
  }

  // Generate final report
  generateReport();
}

// Run the validation
main().catch(error => {
  console.error('❌ Validation failed:', error);
  process.exit(1);
});
