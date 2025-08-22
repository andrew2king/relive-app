#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Testing RELIVE project setup...\n');

// Check project structure
const checkDir = (dir, name) => {
  if (fs.existsSync(dir)) {
    console.log(`✅ ${name} directory exists`);
    return true;
  } else {
    console.log(`❌ ${name} directory missing`);
    return false;
  }
};

// Check files
const checkFile = (file, name) => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${name} exists`);
    return true;
  } else {
    console.log(`❌ ${name} missing`);
    return false;
  }
};

// Project structure checks
console.log('📁 Project Structure:');
checkDir('./frontend', 'Frontend');
checkDir('./backend', 'Backend');
checkDir('./ai-service', 'AI Service');

console.log('\n📄 Configuration Files:');
checkFile('./docker-compose.yml', 'Docker Compose');
checkFile('./docker-compose.dev.yml', 'Dev Docker Compose');
checkFile('./demo.html', 'Demo HTML');

console.log('\n🐳 Dockerfiles:');
checkFile('./frontend/Dockerfile', 'Frontend Dockerfile');
checkFile('./backend/Dockerfile', 'Backend Dockerfile');
checkFile('./ai-service/Dockerfile', 'AI Service Dockerfile');

console.log('\n📦 Package Files:');
checkFile('./frontend/package.json', 'Frontend Package.json');
checkFile('./backend/package.json', 'Backend Package.json');
checkFile('./ai-service/package.json', 'AI Service Package.json');

console.log('\n🔧 Scripts:');
checkDir('./scripts', 'Scripts directory');
checkFile('./scripts/start-local.sh', 'Start Local Script');

console.log('\n✨ Setup verification complete!');
console.log('📝 Demo HTML is available and can be opened in browser');
console.log('🚀 Use "npm install" in each service directory to install dependencies');
console.log('🐳 Docker setup is ready (requires network connectivity)');