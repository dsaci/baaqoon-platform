const fs = require('fs');
let env = fs.readFileSync('.env', 'utf8');
env = env.replace(':6543/postgres?pgbouncer=true"', ':5432/postgres"');
fs.writeFileSync('.env', env);
