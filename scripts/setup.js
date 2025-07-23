#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

console.log('🚀 Setting up HomeThrive SST Serverless App...\n')

// Check if Node.js is installed
try {
  const nodeVersion = process.version
  console.log(`✅ Node.js version: ${nodeVersion}`)
} catch (error) {
  console.error('❌ Node.js is not installed. Please install Node.js first.')
  process.exit(1)
}

// Install root dependencies
console.log('\n📦 Installing root dependencies...')
try {
  execSync('npm install', { stdio: 'inherit' })
  console.log('✅ Root dependencies installed')
} catch (error) {
  console.error('❌ Failed to install root dependencies')
  process.exit(1)
}

// Install function dependencies
console.log('\n📦 Installing function dependencies...')
try {
  execSync('cd packages/functions && npm install', { stdio: 'inherit' })
  console.log('✅ Function dependencies installed')
} catch (error) {
  console.error('❌ Failed to install function dependencies')
  process.exit(1)
}

// Check if AWS CLI is configured
console.log('\n🔍 Checking AWS configuration...')
try {
  execSync('aws sts get-caller-identity', { stdio: 'pipe' })
  console.log('✅ AWS CLI is configured')
} catch (error) {
  console.log(
    '⚠️  AWS CLI is not configured. Please run "aws configure" before deploying.',
  )
}

console.log('\n🎉 Setup complete!')
console.log('\nNext steps:')
console.log('1. Configure AWS credentials: aws configure')
console.log('2. Start development: npm run dev')
console.log('3. Deploy to AWS: npm run deploy')
console.log('\nFor more information, see README.md')
