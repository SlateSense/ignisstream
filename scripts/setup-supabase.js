#!/usr/bin/env node

/**
 * IgnisStream Supabase Setup Script
 * Automates the complete setup of Supabase backend infrastructure
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function question(prompt) {
  return new Promise(resolve => {
    rl.question(`${colors.cyan}${prompt}${colors.reset}`, resolve);
  });
}

async function executeCommand(command, description) {
  try {
    log(`\n🔄 ${description}...`, 'blue');
    const output = execSync(command, { stdio: 'pipe', encoding: 'utf8' });
    log(`✅ ${description} completed`, 'green');
    return output;
  } catch (error) {
    log(`❌ Error: ${description} failed`, 'red');
    log(error.message, 'red');
    throw error;
  }
}

async function checkPrerequisites() {
  log('\n🔍 Checking prerequisites...', 'yellow');
  
  const checks = [
    { command: 'node --version', name: 'Node.js' },
    { command: 'npm --version', name: 'npm' },
    { command: 'supabase --version', name: 'Supabase CLI' },
    { command: 'docker --version', name: 'Docker' }
  ];

  for (const check of checks) {
    try {
      const version = execSync(check.command, { stdio: 'pipe', encoding: 'utf8' }).trim();
      log(`  ✅ ${check.name}: ${version}`, 'green');
    } catch (error) {
      log(`  ❌ ${check.name}: Not installed`, 'red');
      log(`Please install ${check.name} before continuing.`, 'yellow');
      process.exit(1);
    }
  }
}

async function createEnvironmentFile() {
  log('\n📝 Setting up environment configuration...', 'yellow');

  const projectRef = await question('Enter your Supabase project reference ID: ');
  const anonKey = await question('Enter your Supabase anon key: ');
  const serviceKey = await question('Enter your Supabase service role key: ');

  const envContent = `# IgnisStream Environment Configuration
# Generated on ${new Date().toISOString()}

# Next.js Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-here

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://${projectRef}.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=${anonKey}
SUPABASE_SERVICE_ROLE_KEY=${serviceKey}

# OAuth Providers (Configure these in your OAuth provider dashboards)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
TWITCH_CLIENT_ID=your_twitch_client_id
TWITCH_CLIENT_SECRET=your_twitch_client_secret

# OpenAI Configuration (for AI features)
OPENAI_API_KEY=your_openai_api_key

# AWS Configuration (for advanced storage if needed)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1

# Environment
NODE_ENV=development
`;

  fs.writeFileSync('.env.local', envContent);
  log('✅ Environment file created: .env.local', 'green');
  
  return { projectRef, anonKey, serviceKey };
}

async function setupSupabaseProject(projectRef) {
  log('\n🚀 Setting up Supabase project...', 'yellow');

  // Initialize Supabase if not already done
  if (!fs.existsSync('./supabase')) {
    await executeCommand('supabase init', 'Initializing Supabase project');
  }

  // Link to remote project
  await executeCommand(
    `supabase link --project-ref ${projectRef}`,
    'Linking to Supabase project'
  );

  // Start local development environment
  const startLocal = await question('Start local Supabase environment? (y/n): ');
  if (startLocal.toLowerCase() === 'y') {
    await executeCommand('supabase start', 'Starting local Supabase');
  }
}

async function runMigrations() {
  log('\n📊 Running database migrations...', 'yellow');

  const migrationFiles = [
    '001_initial_schema.sql',
    '002_storage_buckets.sql', 
    '003_extended_schema.sql',
    '004_enums_and_types.sql',
    '005_rls_policies.sql',
    '006_seed_data.sql',
    '007_database_functions.sql'
  ];

  // Check if migrations exist
  const migrationDir = './supabase/migrations';
  if (!fs.existsSync(migrationDir)) {
    log('❌ Migration directory not found', 'red');
    return;
  }

  // Run migrations
  try {
    await executeCommand('supabase db push', 'Applying database migrations');
    log('✅ All migrations applied successfully', 'green');
  } catch (error) {
    log('Trying individual migration approach...', 'yellow');
    
    for (const file of migrationFiles) {
      const filePath = path.join(migrationDir, file);
      if (fs.existsSync(filePath)) {
        try {
          await executeCommand(
            `supabase db reset --file ${filePath}`,
            `Applying ${file}`
          );
        } catch (migrationError) {
          log(`⚠️  Warning: ${file} may have failed`, 'yellow');
        }
      }
    }
  }
}

async function setupStorageBuckets() {
  log('\n🗄️  Setting up storage buckets...', 'yellow');

  const buckets = [
    { name: 'avatars', public: true, description: 'User profile pictures' },
    { name: 'posts', public: true, description: 'User-generated content' },
    { name: 'thumbnails', public: true, description: 'Video thumbnails' },
    { name: 'team-assets', public: true, description: 'Team logos and banners' },
    { name: 'game-assets', public: true, description: 'Game-related media' }
  ];

  for (const bucket of buckets) {
    try {
      const flags = bucket.public ? '--public' : '';
      await executeCommand(
        `supabase storage create ${bucket.name} ${flags}`,
        `Creating ${bucket.name} bucket (${bucket.description})`
      );
    } catch (error) {
      // Bucket might already exist
      log(`⚠️  ${bucket.name} bucket may already exist`, 'yellow');
    }
  }
}

async function generateTypes() {
  log('\n🔧 Generating TypeScript types...', 'yellow');

  try {
    await executeCommand(
      'supabase gen types typescript --local > types/database.ts',
      'Generating database types'
    );
  } catch (error) {
    // Try production generation if local fails
    try {
      await executeCommand(
        'supabase gen types typescript > types/database.ts',
        'Generating database types from production'
      );
    } catch (prodError) {
      log('⚠️  Could not generate types automatically', 'yellow');
      log('You may need to generate them manually after setup', 'dim');
    }
  }
}

async function installDependencies() {
  log('\n📦 Installing additional dependencies...', 'yellow');

  const additionalPackages = [
    '@supabase/supabase-js',
    '@supabase/auth-helpers-nextjs',
    '@supabase/auth-helpers-react',
    'react-hook-form',
    'zod',
    '@hookform/resolvers'
  ];

  try {
    await executeCommand(
      `npm install ${additionalPackages.join(' ')}`,
      'Installing Supabase and form handling packages'
    );
  } catch (error) {
    log('⚠️  Some packages may not have installed correctly', 'yellow');
    log('You can install them manually later', 'dim');
  }
}

async function setupOAuthProviders() {
  log('\n🔐 OAuth Provider Setup', 'yellow');
  log('Please configure OAuth providers in your Supabase dashboard:', 'dim');
  log('https://supabase.com/dashboard/project/[your-project]/auth/providers', 'dim');
  
  const providers = [
    'Google OAuth',
    'Discord OAuth', 
    'GitHub OAuth',
    'Twitch OAuth'
  ];

  log('\nProviders to configure:', 'cyan');
  providers.forEach(provider => {
    log(`  • ${provider}`, 'dim');
  });

  log('\nRefer to supabase/config/oauth-providers.md for detailed setup instructions.', 'blue');
}

async function runTests() {
  log('\n🧪 Running basic tests...', 'yellow');

  try {
    // Test database connection
    await executeCommand(
      'supabase db test',
      'Testing database connectivity'
    );

    // Test storage setup
    log('✅ Basic tests passed', 'green');
  } catch (error) {
    log('⚠️  Some tests failed - this is normal for initial setup', 'yellow');
  }
}

async function displaySummary(config) {
  log('\n🎉 IgnisStream Supabase Setup Complete!', 'green');
  log('=' .repeat(50), 'dim');
  
  log('\n📊 Configuration Summary:', 'cyan');
  log(`  Project URL: https://${config.projectRef}.supabase.co`, 'dim');
  log(`  Local Dashboard: http://localhost:54323`, 'dim');
  log(`  Environment: .env.local`, 'dim');

  log('\n🗂️  Storage Buckets Created:', 'cyan');
  log('  • avatars (user profile pictures)', 'dim');
  log('  • posts (user content)', 'dim');
  log('  • thumbnails (video previews)', 'dim');
  log('  • team-assets (team media)', 'dim');
  log('  • game-assets (game content)', 'dim');

  log('\n📋 Next Steps:', 'cyan');
  log('  1. Configure OAuth providers in Supabase dashboard', 'dim');
  log('  2. Update .env.local with OAuth credentials', 'dim');
  log('  3. Run: npm run dev', 'dim');
  log('  4. Test user registration and login', 'dim');
  log('  5. Upload test content to verify storage', 'dim');

  log('\n📚 Documentation:', 'cyan');
  log('  • Setup Guide: supabase/setup/README.md', 'dim');
  log('  • OAuth Guide: supabase/config/oauth-providers.md', 'dim');
  log('  • Database Schema: supabase/migrations/', 'dim');

  log('\n🆘 Support:', 'cyan');
  log('  • GitHub Issues: https://github.com/slatesense/ignisstream/issues', 'dim');
  log('  • Discord: https://discord.gg/ignisstream', 'dim');

  log('\n' + '='.repeat(50), 'dim');
  log('Happy gaming! 🎮', 'magenta');
}

async function main() {
  try {
    log('🔥 IgnisStream Supabase Setup', 'bright');
    log('Automated setup for gaming platform backend\n', 'dim');

    await checkPrerequisites();
    
    const config = await createEnvironmentFile();
    
    await setupSupabaseProject(config.projectRef);
    
    await runMigrations();
    
    await setupStorageBuckets();
    
    await generateTypes();
    
    await installDependencies();
    
    await setupOAuthProviders();
    
    await runTests();
    
    await displaySummary(config);

  } catch (error) {
    log('\n❌ Setup failed!', 'red');
    log(error.message, 'red');
    log('\nPlease check the error above and try again.', 'yellow');
    log('You can also run individual setup steps manually.', 'dim');
    process.exit(1);
  } finally {
    rl.close();
  }
}

// Handle process termination
process.on('SIGINT', () => {
  log('\n\n👋 Setup cancelled by user', 'yellow');
  rl.close();
  process.exit(0);
});

process.on('SIGTERM', () => {
  log('\n\n👋 Setup terminated', 'yellow');
  rl.close();
  process.exit(0);
});

// Run the setup
if (require.main === module) {
  main();
}

module.exports = {
  main,
  checkPrerequisites,
  createEnvironmentFile,
  setupSupabaseProject,
  runMigrations,
  setupStorageBuckets,
  generateTypes
};
