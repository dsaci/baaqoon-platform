const fs = require('fs');
let env = fs.readFileSync('.env', 'utf8');
env = env.replace(':5432/postgres"', ':6543/postgres?pgbouncer=true"');
fs.writeFileSync('.env', env);
