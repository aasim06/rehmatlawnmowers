import { execSync } from 'child_process';

const CHECK_INTERVAL_SECONDS = 30;

console.log('========================================================');
console.log('🚀 Git Auto-Push Started for aasim06/rehmatlawnmowers');
console.log(`⏱️ Checking for changes every ${CHECK_INTERVAL_SECONDS} seconds...`);
console.log('Press Ctrl + C to stop.');
console.log('========================================================\n');

function checkAndPush() {
  try {
    const status = execSync('git status --porcelain', { encoding: 'utf-8' }).trim();

    if (status.length > 0) {
      const now = new Date().toLocaleTimeString();
      console.log(`[${now}] 📝 New changes detected. Pushing to GitHub...`);
      
      execSync('git add .', { stdio: 'inherit' });
      execSync(`git commit -m "Auto update: ${new Date().toLocaleString()}"`, { stdio: 'inherit' });
      execSync('git push origin main', { stdio: 'inherit' });
      
      console.log(`[${now}] ✅ Successfully pushed to GitHub!\n`);
    }
  } catch (error) {
    console.error('❌ Auto-push error:', error.message || error);
  }
}

// Initial check
checkAndPush();

// Recurring interval
setInterval(checkAndPush, CHECK_INTERVAL_SECONDS * 1000);
