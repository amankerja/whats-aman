const Database = require('better-sqlite3');
const db = new Database('./data/database.sqlite');

const check44 = db.prepare("SELECT * FROM contacts WHERE phone LIKE '%447460447557%'").all();
console.log('Check 447460447557 in contacts:', check44.length);

const check30 = db.prepare("SELECT * FROM contacts WHERE phone LIKE '%30817195667569%'").all();
console.log('Check 30817195667569 in contacts:', check30.length);

const unnamed = db.prepare("SELECT count(1) as cnt FROM contacts WHERE (name IS NULL OR TRIM(name) = '' OR TRIM(name) = '—' OR TRIM(name) = '-') AND (push_name IS NULL OR TRIM(push_name) = '' OR TRIM(push_name) = '—' OR TRIM(push_name) = '-')").get();
console.log('Unnamed contacts count in DB:', unnamed.cnt);

const sample = db.prepare("SELECT phone, name, push_name FROM contacts LIMIT 10").all();
console.log('Sample 10 contacts:', sample);

const total = db.prepare("SELECT count(1) as count FROM contacts").get();
console.log('Total contacts remaining:', total.count);

