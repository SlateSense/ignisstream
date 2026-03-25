#!/usr/bin/env node

/**
 * Install Missing React Native Dependencies
 * Run this script to install the required packages for gesture handling and haptics
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Installing missing React Native dependencies for IgnisStream...\n');

const dependencies = [
  'react-native-gesture-handler',
  'expo-haptics'
];

// Check if package.json exists
const packageJsonPath = path.join(__dirname, 'package.json');
if (!fs.existsSync(packageJsonPath)) {
  console.error('❌ package.json not found. Please run this script from the mobile directory.');
  process.exit(1);
}

try {
  // Install dependencies
  console.log('📦 Installing dependencies:');
  dependencies.forEach(dep => {
    console.log(`   - ${dep}`);
  });
  
  const installCommand = `npm install ${dependencies.join(' ')}`;
  console.log(`\n🚀 Running: ${installCommand}\n`);
  
  execSync(installCommand, { stdio: 'inherit', cwd: __dirname });
  
  console.log('\n✅ Dependencies installed successfully!');
  console.log('\n📝 Next steps:');
  console.log('1. For iOS: cd ios && pod install');
  console.log('2. Restart your Metro bundler');
  console.log('3. The gesture handling and haptics should now work properly');
  
} catch (error) {
  console.error('❌ Error installing dependencies:', error.message);
  console.log('\n🔧 Manual installation:');
  console.log('Run these commands manually:');
  dependencies.forEach(dep => {
    console.log(`   npm install ${dep}`);
  });
  process.exit(1);
}
