require('dotenv').config();
const mockDir = process.env.MOCK_DIR;

if (!mockDir) {
    console.log(`\nYou must set root mock directtory in MOCK_DIR at your env file\n`);
    process.exit();
}