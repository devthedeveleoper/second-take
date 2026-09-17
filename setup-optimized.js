import { Client, Databases, Storage, Permission, Role } from 'node-appwrite';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);

const databases = new Databases(client);

const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
const delay = (ms) => new Promise((res) => setTimeout(res, ms));

async function setup() {
  console.log('--- Bootstrapping OPTIMIZED Appwrite Schema ---');

  const collectionsToDrop = ['follows', 'list_items', 'custom_lists', 'episode_entries', 'diary_entries', 'watchlist', 'cached_movies', 'profiles'];
  for (const name of collectionsToDrop) {
    try {
      await databases.deleteCollection(DB_ID, name);
      console.log(`🗑️ Deleted collection ${name}`);
    } catch (e) {
      if (e.code !== 404) console.error(`Failed to delete ${name}:`, e.message);
    }
  }

  await delay(2000);

  // 1. Profiles (Doc ID = Appwrite Auth user.$id)
  await databases.createCollection(DB_ID, 'profiles', 'profiles');
  await delay(1000);
  await databases.createStringAttribute(DB_ID, 'profiles', 'username', 255, false, '');
  await delay(1000);
  await databases.createStringAttribute(DB_ID, 'profiles', 'bio', 1000, false, '');
  await delay(1000);
  await databases.createUrlAttribute(DB_ID, 'profiles', 'avatar_url', false, null);
  await delay(1000);
  console.log('✅ Created profiles attributes.');

  // 2. Cached Movies (Doc ID = tmdb_id.toString())
  await databases.createCollection(DB_ID, 'cached_movies', 'cached_movies');
  await delay(1000);
  await databases.createIntegerAttribute(DB_ID, 'cached_movies', 'tmdb_id', true);
  await delay(1000);
  await databases.createStringAttribute(DB_ID, 'cached_movies', 'title', 500, true);
  await delay(1000);
  await databases.createStringAttribute(DB_ID, 'cached_movies', 'poster_path', 2048, false);
  await delay(1000);
  await databases.createStringAttribute(DB_ID, 'cached_movies', 'release_year', 10, false);
  await delay(1000);
  console.log('✅ Created cached_movies attributes.');

  // 3. Diary Entries
  await databases.createCollection(DB_ID, 'diary_entries', 'diary_entries');
  await delay(1000);
  await databases.createRelationshipAttribute(DB_ID, 'diary_entries', 'profiles', 'manyToOne', false, 'profile', 'diary_entries_profile', 'cascade');
  await delay(1000);
  await databases.createRelationshipAttribute(DB_ID, 'diary_entries', 'cached_movies', 'manyToOne', false, 'movie', 'diary_entries_movie', 'cascade');
  await delay(1000);
  await databases.createDatetimeAttribute(DB_ID, 'diary_entries', 'watched_at', true);
  await delay(1000);
  await databases.createIntegerAttribute(DB_ID, 'diary_entries', 'rating', false);
  await delay(1000);
  await databases.createStringAttribute(DB_ID, 'diary_entries', 'thought', 5000, false);
  await delay(1000);
  await databases.createBooleanAttribute(DB_ID, 'diary_entries', 'is_rewatch', false);
  await delay(1000);
  await databases.createDatetimeAttribute(DB_ID, 'diary_entries', 'created_at', false);
  await delay(1000);
  await databases.createDatetimeAttribute(DB_ID, 'diary_entries', 'updated_at', false);
  await delay(1000);
  await delay(1000);
  await databases.createIndex(DB_ID, 'diary_entries', 'idx_watched', 'key', ['watched_at']);
  console.log('✅ Created diary_entries attributes & indexes.');

  // 4. Episode Entries
  await databases.createCollection(DB_ID, 'episode_entries', 'episode_entries');
  await delay(1000);
  await databases.createRelationshipAttribute(DB_ID, 'episode_entries', 'profiles', 'manyToOne', false, 'profile', 'episode_entries_profile', 'cascade');
  await delay(1000);
  await databases.createRelationshipAttribute(DB_ID, 'episode_entries', 'cached_movies', 'manyToOne', false, 'movie', 'episode_entries_movie', 'cascade');
  await delay(1000);
  await databases.createDatetimeAttribute(DB_ID, 'episode_entries', 'watched_at', true);
  await delay(1000);
  await databases.createIntegerAttribute(DB_ID, 'episode_entries', 'rating', false);
  await delay(1000);
  await databases.createStringAttribute(DB_ID, 'episode_entries', 'thought', 5000, false);
  await delay(1000);
  await databases.createBooleanAttribute(DB_ID, 'episode_entries', 'is_rewatch', false);
  await delay(1000);
  await databases.createIntegerAttribute(DB_ID, 'episode_entries', 'season_number', true);
  await delay(1000);
  await databases.createIntegerAttribute(DB_ID, 'episode_entries', 'episode_number', true);
  await delay(1000);
  await databases.createDatetimeAttribute(DB_ID, 'episode_entries', 'created_at', false);
  await delay(1000);
  console.log('✅ Created episode_entries attributes & indexes.');

  // 5. Watchlist
  await databases.createCollection(DB_ID, 'watchlist', 'watchlist');
  await delay(1000);
  await databases.createRelationshipAttribute(DB_ID, 'watchlist', 'profiles', 'manyToOne', false, 'profile', 'watchlist_profile', 'cascade');
  await delay(1000);
  await databases.createRelationshipAttribute(DB_ID, 'watchlist', 'cached_movies', 'manyToOne', false, 'movie', 'watchlist_movie', 'cascade');
  await delay(1000);
  await databases.createDatetimeAttribute(DB_ID, 'watchlist', 'created_at', false);
  await delay(1000);
  console.log('✅ Created watchlist attributes & indexes.');

  // 6. Custom Lists
  await databases.createCollection(DB_ID, 'custom_lists', 'custom_lists');
  await delay(1000);
  await databases.createRelationshipAttribute(DB_ID, 'custom_lists', 'profiles', 'manyToOne', false, 'profile', 'custom_lists_profile', 'cascade');
  await delay(1000);
  await databases.createStringAttribute(DB_ID, 'custom_lists', 'title', 255, true);
  await delay(1000);
  await databases.createStringAttribute(DB_ID, 'custom_lists', 'description', 1000, false);
  await delay(1000);
  await databases.createBooleanAttribute(DB_ID, 'custom_lists', 'is_public', false, true);
  await delay(1000);
  await databases.createDatetimeAttribute(DB_ID, 'custom_lists', 'created_at', false);
  await delay(1000);
  console.log('✅ Created custom_lists attributes & indexes.');

  // 7. List Items
  await databases.createCollection(DB_ID, 'list_items', 'list_items');
  await delay(1000);
  await databases.createRelationshipAttribute(DB_ID, 'list_items', 'custom_lists', 'manyToOne', false, 'list', 'list_items_list', 'cascade');
  await delay(1000);
  await databases.createRelationshipAttribute(DB_ID, 'list_items', 'cached_movies', 'manyToOne', false, 'movie', 'list_items_movie', 'cascade');
  await delay(1000);
  await databases.createDatetimeAttribute(DB_ID, 'list_items', 'added_at', false);
  await delay(1000);
  console.log('✅ Created list_items attributes & indexes.');

  // 8. Follows
  await databases.createCollection(DB_ID, 'follows', 'follows');
  await delay(1000);
  await databases.createRelationshipAttribute(DB_ID, 'follows', 'profiles', 'manyToOne', false, 'follower', 'follows_follower', 'cascade');
  await delay(1000);
  await databases.createRelationshipAttribute(DB_ID, 'follows', 'profiles', 'manyToOne', false, 'following', 'follows_following', 'cascade');
  await delay(1000);
  await databases.createDatetimeAttribute(DB_ID, 'follows', 'created_at', false);
  await delay(1000);
  await delay(1000);
  console.log('✅ Created follows attributes & indexes.');

  console.log('--- OPTIMIZED Appwrite Setup Complete! ---');
}

setup();
