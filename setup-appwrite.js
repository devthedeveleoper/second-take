import { Client, Databases, Storage, Permission, Role } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);
const storage = new Storage(client);

const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

async function setup() {
  console.log('--- Bootstrapping Appwrite ---');

  // 1. Create Database
  try {
    await databases.get(DB_ID);
    console.log(`✅ Database ${DB_ID} exists.`);
  } catch (e) {
    if (e.code === 404) {
      console.log(`Creating database ${DB_ID}...`);
      await databases.create(DB_ID, 'Second Take DB');
      console.log('✅ Database created.');
    } else {
      throw e;
    }
  }

  // 2. Setup Profiles Collection
  await setupCollection('profiles', async (collectionId) => {
    await databases.createStringAttribute(DB_ID, collectionId, 'user_id', 255, true);
    await delay(1000);
    await databases.createStringAttribute(DB_ID, collectionId, 'username', 255, false, '');
    await delay(1000);
    await databases.createStringAttribute(DB_ID, collectionId, 'bio', 1000, false, '');
    await delay(1000);
    await databases.createUrlAttribute(DB_ID, collectionId, 'avatar_url', false, null);
    await delay(1000);
    try {
      await databases.createIndex(DB_ID, collectionId, 'user_id_idx', 'unique', ['user_id']);
    } catch (e) { if (e.code !== 409) console.error(e.message); }
  });

  // 3. Setup Cached Movies Collection
  await setupCollection('cached_movies', async (collectionId) => {
    await databases.createIntegerAttribute(DB_ID, collectionId, 'tmdb_id', true);
    await delay(1000);
    await databases.createStringAttribute(DB_ID, collectionId, 'title', 500, true);
    await delay(1000);
    await databases.createStringAttribute(DB_ID, collectionId, 'poster_path', 2048, false);
    await delay(1000);
    await databases.createStringAttribute(DB_ID, collectionId, 'release_year', 10, false);
    await delay(1000);
    try {
      await databases.createIndex(DB_ID, collectionId, 'idx_tmdb_id', 'unique', ['tmdb_id']);
    } catch (e) { if (e.code !== 409) console.error(e.message); }
  });

  // 4. Setup Watchlist Collection
  await setupCollection('watchlist', async (collectionId) => {
    await databases.createStringAttribute(DB_ID, collectionId, 'user_id', 255, true);
    await delay(1000);
    await databases.createIntegerAttribute(DB_ID, collectionId, 'tmdb_id', true);
    await delay(1000);
    await databases.createDatetimeAttribute(DB_ID, collectionId, 'created_at', false);
    await delay(1000);
    try {
      await databases.createIndex(DB_ID, collectionId, 'idx_user_movie', 'unique', ['user_id', 'tmdb_id']);
    } catch (e) { if (e.code !== 409) console.error(e.message); }
  });

  // 5. Setup Diary Entries Collection
  await setupCollection('diary_entries', async (collectionId) => {
    await databases.createStringAttribute(DB_ID, collectionId, 'user_id', 255, true);
    await delay(1000);
    await databases.createIntegerAttribute(DB_ID, collectionId, 'tmdb_id', true);
    await delay(1000);
    await databases.createDatetimeAttribute(DB_ID, collectionId, 'watched_at', true);
    await delay(1000);
    await databases.createIntegerAttribute(DB_ID, collectionId, 'rating', false);
    await delay(1000);
    await databases.createStringAttribute(DB_ID, collectionId, 'thought', 5000, false);
    await delay(1000);
    await databases.createBooleanAttribute(DB_ID, collectionId, 'is_rewatch', false);
    await delay(1000);
    await databases.createIntegerAttribute(DB_ID, collectionId, 'season_number', false);
    await delay(1000);
    await databases.createIntegerAttribute(DB_ID, collectionId, 'episode_number', false);
    await delay(1000);
    await databases.createDatetimeAttribute(DB_ID, collectionId, 'created_at', false);
    await delay(1000);
    await databases.createDatetimeAttribute(DB_ID, collectionId, 'updated_at', false);
  });
  
  // 5.5 Setup Episode Entries Collection
  await setupCollection('episode_entries', async (collectionId) => {
    await databases.createStringAttribute(DB_ID, collectionId, 'user_id', 255, true);
    await delay(1000);
    await databases.createIntegerAttribute(DB_ID, collectionId, 'tmdb_id', true);
    await delay(1000);
    await databases.createDatetimeAttribute(DB_ID, collectionId, 'watched_at', true);
    await delay(1000);
    await databases.createIntegerAttribute(DB_ID, collectionId, 'rating', false);
    await delay(1000);
    await databases.createStringAttribute(DB_ID, collectionId, 'thought', 5000, false);
    await delay(1000);
    await databases.createBooleanAttribute(DB_ID, collectionId, 'is_rewatch', false);
    await delay(1000);
    await databases.createIntegerAttribute(DB_ID, collectionId, 'season_number', false);
    await delay(1000);
    await databases.createIntegerAttribute(DB_ID, collectionId, 'episode_number', false);
    await delay(1000);
    await databases.createDatetimeAttribute(DB_ID, collectionId, 'created_at', false);
    await delay(1000);
    await databases.createDatetimeAttribute(DB_ID, collectionId, 'updated_at', false);
  });

  // 6. Setup Custom Lists Collection
  await setupCollection('custom_lists', async (collectionId) => {
    await databases.createStringAttribute(DB_ID, collectionId, 'user_id', 255, true);
    await delay(1000);
    await databases.createStringAttribute(DB_ID, collectionId, 'title', 255, true);
    await delay(1000);
    await databases.createStringAttribute(DB_ID, collectionId, 'description', 1000, false);
    await delay(1000);
    await databases.createBooleanAttribute(DB_ID, collectionId, 'is_public', false, true); // default true
    await delay(1000);
    await databases.createDatetimeAttribute(DB_ID, collectionId, 'created_at', false);
  });

  // 7. Setup List Items Collection
  await setupCollection('list_items', async (collectionId) => {
    await databases.createStringAttribute(DB_ID, collectionId, 'list_id', 255, true);
    await delay(1000);
    await databases.createIntegerAttribute(DB_ID, collectionId, 'tmdb_id', true);
    await delay(1000);
    await databases.createDatetimeAttribute(DB_ID, collectionId, 'added_at', false);
    await delay(1000);
    try {
      await databases.createIndex(DB_ID, collectionId, 'idx_list_movie', 'unique', ['list_id', 'tmdb_id']);
    } catch (e) { if (e.code !== 409) console.error(e.message); }
  });
  // 8. Setup Follows Collection
  await setupCollection('follows', async (collectionId) => {
    await databases.createStringAttribute(DB_ID, collectionId, 'follower_id', 255, true);
    await delay(1000);
    await databases.createStringAttribute(DB_ID, collectionId, 'following_id', 255, true);
    await delay(1000);
    await databases.createDatetimeAttribute(DB_ID, collectionId, 'created_at', false);
    await delay(1000);
    try {
      await databases.createIndex(DB_ID, collectionId, 'idx_follow', 'unique', ['follower_id', 'following_id']);
      await delay(1000);
      await databases.createIndex(DB_ID, collectionId, 'idx_follower', 'key', ['follower_id']);
      await delay(1000);
      await databases.createIndex(DB_ID, collectionId, 'idx_following', 'key', ['following_id']);
    } catch (e) { if (e.code !== 409) console.error(e.message); }
  });

  // 9. Setup Avatars Storage Bucket
  const BUCKET_ID = 'avatars';
  try {
    await storage.createBucket(
      BUCKET_ID,
      BUCKET_ID,
      [
        Permission.read(Role.any()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users()),
      ],
      false,
      true,
      5 * 1024 * 1024,
      ['jpg', 'jpeg', 'png', 'gif', 'webp']
    );
    console.log(`✅ Bucket ${BUCKET_ID} created successfully.`);
  } catch (e) {
    if (e.code === 409) {
      console.log(`✅ Bucket ${BUCKET_ID} already exists.`);
    } else {
      console.error(`❌ Error creating bucket ${BUCKET_ID}:`, e.message);
    }
  }

  console.log('--- Appwrite Setup Complete! ---');
}

// Helper to idempotently setup a collection and its attributes
async function setupCollection(name, attributesCallback) {
  let created = false;
  try {
    await databases.createCollection(DB_ID, name, name);
    console.log(`✅ Collection ${name} created.`);
    created = true;
  } catch (e) {
    if (e.code === 409) {
      console.log(`✅ Collection ${name} exists.`);
      // Proceed to try creating attributes anyway (Appwrite throws 409 if attribute exists)
      created = true; 
    } else {
      console.error(`❌ Error creating collection ${name}:`, e.message);
    }
  }

  if (created) {
    try {
      await attributesCallback(name);
      console.log(`✅ Attributes checked/created for ${name}.`);
    } catch (attrErr) {
      console.error(`❌ Error setting up attributes for ${name}:`, attrErr.message);
    }
  }
}

setup();
