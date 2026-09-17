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

export async function logFilm(formData: FormData) {
  try {
    const { account } = await createSessionClient()
    const { tables } = await createAdminClient()
    const user = await account.get()

    const tmdbId = parseInt(formData.get('tmdbId') as string)
    const seasonNumber = formData.get('seasonNumber') ? parseInt(formData.get('seasonNumber') as string) : null
    const episodeNumber = formData.get('episodeNumber') ? parseInt(formData.get('episodeNumber') as string) : null
    const rating = formData.get('rating') ? parseInt(formData.get('rating') as string) : null
    const thought = formData.get('thought') as string
    const watchedAtStr = formData.get('watchedAt') as string
    
    let watchedAt = new Date().toISOString()
    if (watchedAtStr) {
      watchedAt = new Date(watchedAtStr).toISOString()
    }
    
    const isRewatch = formData.get('isRewatch') === 'on'

    await ensureMovieInCache(tables, tmdbId)

    const documentData: any = {
      profile: user.$id,
      movie: tmdbId.toString(),
      watched_at: watchedAt,
      rating: rating,
      thought: thought,
      is_rewatch: isRewatch,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    if (seasonNumber !== null) documentData.season_number = seasonNumber
    if (episodeNumber !== null) documentData.episode_number = episodeNumber

    const collectionName = episodeNumber !== null ? 'episode_entries' : 'diary_entries'

    await tables.createRow(DB_ID, collectionName, ID.unique(), documentData)

    try {
      const wResult = await tables.listRows(DB_ID, 'watchlist', [
        Query.equal('profile', user.$id),
        Query.equal('movie', tmdbId.toString())
      ])
      if (wResult.total > 0) {
        await tables.deleteRow(DB_ID, 'watchlist', wResult.rows[0].$id)
      }
    } catch (e) {}

    revalidatePath(`/title/${tmdbId}`)
    if (seasonNumber !== null) {
      revalidatePath(`/title/${tmdbId}/season/${seasonNumber}`)
    }
    revalidatePath('/diary')
    revalidatePath('/watchlist')
    return { success: true }
  } catch (error: any) {
    console.error('Log film error:', error)
    return { error: error.message || 'Failed to log film.' }
  }
}

export async function getMovieDiaryEntries(tmdbId: number, seasonNumber?: number, episodeNumber?: number) {
  try {
    const { account } = await createSessionClient()
    const { tables } = await createAdminClient()
    const user = await account.get()

    const queries = [
      Query.equal('profile', user.$id),
      Query.equal('movie', tmdbId.toString()),
      Query.orderDesc('watched_at')
    ]

    if (seasonNumber !== undefined) {
      queries.push(Query.equal('season_number', seasonNumber))
    } else {
      queries.push(Query.isNull('season_number'))
    }

    if (episodeNumber !== undefined) {
      queries.push(Query.equal('episode_number', episodeNumber))
    } else {
      queries.push(Query.isNull('episode_number'))
    }

    const collectionName = episodeNumber !== undefined ? 'episode_entries' : 'diary_entries'
    const result = await tables.listRows(DB_ID, collectionName, queries)
    
    return JSON.parse(JSON.stringify(result.rows))
  } catch (error) {
    return []
  }
}

export async function getSeasonDiaryEntries(tmdbId: number, seasonNumber: number) {
  try {
    const { account } = await createSessionClient()
    const { tables } = await createAdminClient()
    const user = await account.get()

    const result = await tables.listRows(DB_ID, 'episode_entries', [
      Query.equal('profile', user.$id),
      Query.equal('movie', tmdbId.toString()),
      Query.equal('season_number', seasonNumber),
      Query.isNotNull('episode_number')
    ])
    
    return JSON.parse(JSON.stringify(result.rows))
  } catch (error) {
    return []
  }
}

export async function updateDiaryEntry(entryId: string, formData: FormData, isEpisode: boolean = false) {
  try {
    const { account } = await createSessionClient()
    const { tables } = await createAdminClient()
    const user = await account.get()

    const collectionName = isEpisode ? 'episode_entries' : 'diary_entries'
    const entry = await tables.getRow(DB_ID, collectionName, entryId)
    if (!entry) throw new Error('Entry not found')
    if (entry.profile.$id !== user.$id) throw new Error('Unauthorized')

    const rating = formData.get('rating') ? parseInt(formData.get('rating') as string) : null
    const thought = formData.get('thought') as string
    const watchedAtStr = formData.get('watchedAt') as string
    const tmdbId = parseInt(formData.get('tmdbId') as string)
    
    let watchedAt = entry.watched_at
    if (watchedAtStr) {
      watchedAt = new Date(watchedAtStr).toISOString()
    }
    
    const isRewatch = formData.get('isRewatch') === 'on'

    await tables.updateRow(DB_ID, collectionName, entryId, {
      watched_at: watchedAt,
      rating: rating,
      thought: thought,
      is_rewatch: isRewatch,
      updated_at: new Date().toISOString()
    })

    revalidatePath(`/title/${tmdbId}`)
    revalidatePath('/diary')
    revalidatePath('/')
    return { success: true }
  } catch (error: any) {
    console.error('Update film error:', error)
    return { error: error.message || 'Failed to update diary entry.' }
  }
}

export async function deleteDiaryEntry(entryId: string, tmdbId: number, isEpisode: boolean = false) {
  try {
    const { account } = await createSessionClient()
    const { tables } = await createAdminClient()
    const user = await account.get()

    const collectionName = isEpisode ? 'episode_entries' : 'diary_entries'
    const entry = await tables.getRow(DB_ID, collectionName, entryId)
    if (!entry) throw new Error('Entry not found')
    if (entry.profile.$id !== user.$id) throw new Error('Unauthorized')

    await tables.deleteRow(DB_ID, collectionName, entryId)

    revalidatePath(`/title/${tmdbId}`)
    if (entry.season_number) {
      revalidatePath(`/title/${tmdbId}/season/${entry.season_number}`)
    }
    revalidatePath('/diary')
    revalidatePath('/')
    return { success: true }
  } catch (error: any) {
    console.error('Delete film error:', error)
    return { error: error.message || 'Failed to delete diary entry.' }
  }
}

export async function getDiaryStats() {
  try {
    const { account } = await createSessionClient()
    const { tables } = await createAdminClient()
    const user = await account.get()

    const diaryResult = await tables.listRows(DB_ID, 'diary_entries', [
      Query.equal('profile', user.$id),
      Query.limit(5000)
    ])

    const episodeResult = await tables.listRows(DB_ID, 'episode_entries', [
      Query.equal('profile', user.$id),
      Query.limit(5000)
    ])

    const entries = [...diaryResult.rows, ...episodeResult.rows]
    
    const uniqueTitles = new Set(entries.map((e: any) => e.movie ? e.movie.tmdb_id : e.tmdb_id))
    
    const episodes = entries.filter((e: any) => e.episode_number !== null)

    const ratingsMap: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    entries.forEach((e: any) => {
      if (e.rating) {
        ratingsMap[e.rating] = (ratingsMap[e.rating] || 0) + 1
      }
    })

    const activityMap: Record<string, number> = {}
    
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthKey = d.toLocaleString('default', { month: 'short' })
      activityMap[monthKey] = 0
    }

    entries.forEach((e: any) => {
      if (e.watched_at) {
        const d = new Date(e.watched_at)
        const diffMonths = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth())
        if (diffMonths >= 0 && diffMonths <= 5) {
          const monthKey = d.toLocaleString('default', { month: 'short' })
          if (activityMap[monthKey] !== undefined) {
            activityMap[monthKey] += 1
          }
        }
      }
    })

    const monthlyActivity = Object.keys(activityMap).map(key => ({
      month: key,
      count: activityMap[key]
    }))

    return {
      totalLogs: entries.length,
      uniqueTitles: uniqueTitles.size,
      episodesWatched: episodes.length,
      ratingsDistribution: Object.values(ratingsMap),
      monthlyActivity
    }
  } catch (error) {
    console.error('Error fetching diary stats:', error)
    return {
      totalLogs: 0,
      uniqueTitles: 0,
      episodesWatched: 0,
      ratingsDistribution: [0, 0, 0, 0, 0],
      monthlyActivity: []
    }
  }
}
