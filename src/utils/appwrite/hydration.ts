import { createAdminClient } from '@/utils/appwrite/server'
import { Query } from 'node-appwrite'

const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!

export async function hydrateMovies(items: any[]) {
  if (!items || items.length === 0) return items;
  
  const movieIds = new Set(items.map(item => item.movie).filter(id => typeof id === 'string'));
  if (movieIds.size === 0) return items;
  
  const { tables } = await createAdminClient();
  const movies: any[] = [];
  
  const idArray = Array.from(movieIds);
  for (let i = 0; i < idArray.length; i += 100) {
    const chunk = idArray.slice(i, i + 100);
    const result = await tables.listRows(DB_ID, 'cached_movies', [
      Query.equal('$id', chunk)
    ]);
    movies.push(...result.rows);
  }
  
  const movieMap = new Map(movies.map(m => [m.$id, m]));
  
  return items.map(item => {
    if (typeof item.movie === 'string') {
      return { ...item, movie: movieMap.get(item.movie) || { title: 'Unknown Movie', poster_path: null } };
    }
    return item;
  });
}

export async function hydrateProfiles(items: any[]) {
  if (!items || items.length === 0) return items;
  
  const profileIds = new Set(items.map(item => item.profile).filter(id => typeof id === 'string'));
  if (profileIds.size === 0) return items;
  
  const { tables } = await createAdminClient();
  const profiles: any[] = [];
  
  const idArray = Array.from(profileIds);
  for (let i = 0; i < idArray.length; i += 100) {
    const chunk = idArray.slice(i, i + 100);
    const result = await tables.listRows(DB_ID, 'profiles', [
      Query.equal('$id', chunk)
    ]);
    profiles.push(...result.rows);
  }
  
  const profileMap = new Map(profiles.map(p => [p.$id, p]));
  
  return items.map(item => {
    if (typeof item.profile === 'string') {
      return { ...item, profile: profileMap.get(item.profile) || { username: 'Unknown' } };
    }
    return item;
  });
}
