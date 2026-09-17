require('dotenv').config({ path: '.env.local' });
const { Client, Account, TablesDB } = require('node-appwrite');

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const tables = new TablesDB(client);
const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

async function test() {
    try {
        console.log("Fetching diary_entries with listRows...");
        const result = await tables.listRows(DB_ID, 'diary_entries');
        console.log("Success! Total:", result.total);
        console.log("Rows length:", result.rows.length);
        console.log("Sample Row:", JSON.stringify(result.rows[0], null, 2));
    } catch (e) {
        console.error("Error fetching diary_entries:", e.message);
    }
}
test();
