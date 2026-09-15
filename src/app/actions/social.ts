'use server'

import { createSessionClient, createAdminClient } from '@/utils/appwrite/server'
import { ID, Query } from 'node-appwrite'
import { revalidatePath } from 'next/cache'

const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!

export async function followUser(followingId: string) {
  try {
    const { account } = await createSessionClient()
    const { tables } = await createAdminClient()
    const user = await account.get()

    if (user.$id === followingId) {
      return { success: false, error: "You cannot follow yourself." }
    }

    await tables.createRow(DB_ID, 'follows', ID.unique(), {
      follower_id: user.$id,
      following_id: followingId,
      created_at: new Date().toISOString()
    })

    revalidatePath(`/u/${followingId}`)
    revalidatePath('/feed')
    return { success: true }
  } catch (error: any) {
    if (error.code === 409) return { success: true }
    console.error('Error following user:', error)
    return { success: false, error: error.message }
  }
}

export async function unfollowUser(followingId: string) {
  try {
    const { account } = await createSessionClient()
    const { tables } = await createAdminClient()
    const user = await account.get()

    const result = await tables.listRows(DB_ID, 'follows', [
      Query.equal('follower_id', user.$id),
      Query.equal('following_id', followingId)
    ])

    if (result.total > 0) {
      await tables.deleteRow(DB_ID, 'follows', result.rows[0].$id)
    }

    revalidatePath(`/u/${followingId}`)
    revalidatePath('/feed')
    return { success: true }
  } catch (error: any) {
    console.error('Error unfollowing user:', error)
    return { success: false, error: error.message }
  }
}

export async function checkFollowStatus(followingId: string) {
  try {
    const { account } = await createSessionClient()
    const { tables } = await createAdminClient()
    
    // Auth check
    const user = await account.get()

    if (user.$id === followingId) return { success: true, data: false }

    const result = await tables.listRows(DB_ID, 'follows', [
      Query.equal('follower_id', user.$id),
      Query.equal('following_id', followingId)
    ])

    return { success: true, data: result.total > 0 }
  } catch (error: any) {
    return { success: false, data: false }
  }
}

// Get timeline feed of people the user follows
export async function getFeed(page = 1, limit = 20) {
  try {
    const { account } = await createSessionClient()
    const { tables } = await createAdminClient()
    const user = await account.get()

    // 1. Get all users I am following
    const follows = await tables.listRows(DB_ID, 'follows', [
      Query.equal('follower_id', user.$id),
      Query.limit(500)
    ])

    if (follows.total === 0) {
      return { success: true, data: [] }
    }

    const followingIds = follows.rows.map((f: any) => f.following_id)

    // 2. Get their most recent diary entries
    // Note: Appwrite doesn't support 'IN' queries with more than 100 items usually, 
    // but we can query using multiple queries or chunk it.
    // For simplicity, we chunk up to 100 following IDs.
    const chunks = []
    for (let i = 0; i < followingIds.length; i += 100) {
      chunks.push(followingIds.slice(i, i + 100))
    }

    let allEntries: any[] = []
    
    // Fetch logs from following chunk (simplifying to just taking the first 100 for this prototype)
    const activeChunk = chunks[0] || []
    
    if (activeChunk.length > 0) {
      const logs = await tables.listRows(DB_ID, 'diary_entries', [
        Query.equal('user_id', activeChunk),
        Query.orderDesc('watched_at'),
        Query.limit(limit),
        Query.offset((page - 1) * limit)
      ])
      allEntries = logs.rows
    }

    // 3. Hydrate with profiles and TMDB data
    if (allEntries.length > 0) {
      const uids = Array.from(new Set(allEntries.map(e => e.user_id)))
      const profiles = await tables.listRows(DB_ID, 'profiles', [
        Query.equal('user_id', uids)
      ])
      
      const profileMap = profiles.rows.reduce((acc: any, p: any) => {
        acc[p.user_id] = p
        return acc
      }, {})

      const { getMovieDetails } = await import('@/utils/tmdb')

      allEntries = await Promise.all(allEntries.map(async (entry) => {
        let movie = null
        try {
          movie = await getMovieDetails(entry.tmdb_id)
        } catch (e) {}

        return {
          ...entry,
          profile: profileMap[entry.user_id] || { username: 'Unknown User' },
          movie
        }
      }))
    }

    return { success: true, data: JSON.parse(JSON.stringify(allEntries)) }
  } catch (error: any) {
    console.error('Error fetching feed:', error)
    return { success: false, data: [] }
  }
}
