const { execSync } = require('child_process');

function runWithRetry(script) {
  let success = false;
  let attempts = 0;
  while (!success && attempts < 10) {
    attempts++;
    console.log(`Running ${script} (Attempt ${attempts})...`);
    try {
      execSync(`node ${script}`, { stdio: 'inherit' });
      success = true;
    } catch (e) {
      console.log(`Failed. Retrying in 10 seconds...`);
      // Windows alternative to sleep
      execSync('powershell -command "Start-Sleep -Seconds 10"');
    }
  }
}

runWithRetry('seed_biology.js');
runWithRetry('seed_math.js');
runWithRetry('seed_new_books.js');
