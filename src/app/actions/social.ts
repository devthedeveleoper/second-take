'use server'

import { createSessionClient, createAdminClient } from '@/utils/appwrite/server'
import { ID, Query } from 'node-appwrite'
import { revalidatePath } from 'next/cache'
import { hydrateMovies, hydrateProfiles } from '@/utils/appwrite/hydration'

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
      follower: user.$id,
      following: followingId,
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
      Query.equal('follower', user.$id),
      Query.equal('following', followingId)
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
    
    const user = await account.get()

    if (user.$id === followingId) return { success: true, data: false }

    const result = await tables.listRows(DB_ID, 'follows', [
      Query.equal('follower', user.$id),
      Query.equal('following', followingId)
    ])

    return { success: true, data: result.total > 0 }
  } catch (error: any) {
    return { success: false, data: false }
  }
}

export async function getFeed(page = 1, limit = 20) {
  try {
    const { account } = await createSessionClient()
    const { tables } = await createAdminClient()
    const user = await account.get()

    const follows = await tables.listRows(DB_ID, 'follows', [
      Query.equal('follower', user.$id),
      Query.limit(500)
    ])

    if (follows.total === 0) {
      return { success: true, data: [] }
    }

    const followingIds = follows.rows.map((f: any) => typeof f.following === 'object' ? f.following.$id : f.following)

    const chunks = []
    for (let i = 0; i < followingIds.length; i += 100) {
      chunks.push(followingIds.slice(i, i + 100))
    }

    let allEntries: any[] = []
    
    const activeChunk = chunks[0] || []
    
    if (activeChunk.length > 0) {
      const logs = await tables.listRows(DB_ID, 'diary_entries', [
        Query.equal('profile', activeChunk),
        Query.orderDesc('watched_at'),
        Query.limit(limit),
        Query.offset((page - 1) * limit)
      ])
      const hydratedMovies = await hydrateMovies(logs.rows)
      allEntries = await hydrateProfiles(hydratedMovies)
    }

    return { success: true, data: JSON.parse(JSON.stringify(allEntries)) }
  } catch (error: any) {
    console.error('Error fetching feed:', error)
    return { success: false, data: [] }
  }
}

export async function getSuggestedUsers() {
  try {
    const { account } = await createSessionClient()
    const { tables } = await createAdminClient()
    
    // We can safely assume the user is logged in if they are on the feed
    let currentUserId = null
    try {
      const user = await account.get()
      currentUserId = user.$id
    } catch (e) {
      // If not logged in, we can still fetch suggestions for public view if needed
    }

    let followingIds: string[] = []
    
    if (currentUserId) {
      const follows = await tables.listRows(DB_ID, 'follows', [
        Query.equal('follower', currentUserId),
        Query.limit(500)
      ])
      followingIds = follows.rows.map((f: any) => typeof f.following === 'object' ? f.following.$id : f.following)
    }

    // Get up to 10 latest registered profiles
    const profilesResult = await tables.listRows(DB_ID, 'profiles', [
      Query.orderDesc('$createdAt'),
      Query.limit(20)
    ])

    // Filter out self and already following
    const followingSet = new Set(followingIds)
    let suggestions = profilesResult.rows.filter((p: any) => 
      p.$id !== currentUserId && !followingSet.has(p.$id)
    )

    // Take top 5
    suggestions = suggestions.slice(0, 5)

    return { success: true, data: JSON.parse(JSON.stringify(suggestions)) }
  } catch (error: any) {
    console.error('Error fetching suggested users:', error)
    return { success: false, data: [] }
  }
}

