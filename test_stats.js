require('dotenv').config({ path: '.env.local' });
const { Client, Account, TablesDB, Query } = require('node-appwrite');

const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

const tables = new TablesDB(client);
const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const user_id = "6aaa8fe000259281c15d"; // From the previous test script output

async function testStats() {
    try {
        const diaryResult = await tables.listRows(DB_ID, 'diary_entries', [
            Query.equal('profile', user_id),
            Query.limit(5000)
        ]);

        const episodeResult = await tables.listRows(DB_ID, 'episode_entries', [
            Query.equal('profile', user_id),
            Query.limit(5000)
        ]);

        const entries = [...diaryResult.rows, ...episodeResult.rows];
        console.log("Entries count:", entries.length);

        const ratingsMap = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        entries.forEach((e) => {
            if (e.rating) {
                ratingsMap[e.rating] = (ratingsMap[e.rating] || 0) + 1;
            }
        });
        console.log("Ratings:", ratingsMap);

        const activityMap = {};
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = d.toLocaleString('default', { month: 'short' });
            activityMap[monthKey] = 0;
        }

        entries.forEach((e) => {
            if (e.watched_at) {
                const d = new Date(e.watched_at);
                const diffMonths = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
                if (diffMonths >= 0 && diffMonths <= 5) {
                    const monthKey = d.toLocaleString('default', { month: 'short' });
                    if (activityMap[monthKey] !== undefined) {
                        activityMap[monthKey] += 1;
                    }
                }
            }
        });
        console.log("Activity:", activityMap);

    } catch (e) {
        console.error("Error:", e.message);
    }
}
testStats();
