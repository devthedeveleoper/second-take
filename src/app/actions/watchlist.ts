'use server'

import { createSessionClient, createAdminClient } from '@/utils/appwrite/server'
import { getMovieDetails } from '@/utils/tmdb'
import { ID, Query, Permission, Role } from 'node-appwrite'
import { revalidatePath } from 'next/cache'

const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!

async function ensureMovieInCache(tables: any, tmdbId: number) {
  try {
    const existing = await tables.getRow(DB_ID, 'cached_movies', tmdbId.toString())
    if (existing) return
  } catch (err) {}

  const movie = await getMovieDetails(tmdbId)
  
  try {
    await tables.createRow(DB_ID, 'cached_movies', tmdbId.toString(), {
      tmdb_id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
      release_year: movie.release_date ? movie.release_date.split('-')[0] : null
    })
  } catch (err: any) {
    if (err.code !== 409) console.error('Error caching movie:', err)
  }
}

export async function addToWatchlist(tmdbId: number) {
  try {
    const { account } = await createSessionClient()
    const { tables } = await createAdminClient()
    const user = await account.get()

    await ensureMovieInCache(tables, tmdbId)

    await tables.createRow(DB_ID, 'watchlist', ID.unique(), {
      profile: user.$id,
      movie: tmdbId.toString(),
      created_at: new Date().toISOString()
    })

    revalidatePath(`/title/${tmdbId}`)
    revalidatePath('/watchlist')
    return { success: true }
  } catch (error: any) {
    console.error('Add to watchlist error:', error)
    if (error.code === 409) return { success: true }
    return { error: 'Failed to add to watchlist.' }
  }
}

export async function removeFromWatchlist(tmdbId: number) {
  try {
    const { account } = await createSessionClient()
    const { tables } = await createAdminClient()
    const user = await account.get()

    const result = await tables.listRows(DB_ID, 'watchlist', [
        Query.equal('profile', user.$id),
        Query.equal('movie', tmdbId.toString())
    ])
    
    if (result.total > 0) {
      await tables.deleteRow(DB_ID, 'watchlist', result.rows[0].$id)
    }
    
    revalidatePath(`/title/${tmdbId}`)
    revalidatePath('/watchlist')
    return { success: true }
  } catch (error: any) {
    console.error('Remove from watchlist error:', error)
    return { error: 'Failed to remove from watchlist.' }
  }
}

export async function checkWatchlist(tmdbId: number): Promise<boolean> {
  try {
    const { account } = await createSessionClient()
    const { tables } = await createAdminClient()
    const user = await account.get()

    const result = await tables.listRows(DB_ID, 'watchlist', [
        Query.equal('profile', user.$id),
        Query.equal('movie', tmdbId.toString())
    ])
    
    return result.total > 0
  } catch (error) {
    return false
  }
}
