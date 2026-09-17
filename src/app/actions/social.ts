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

    const followingIds = follows.rows.map((f: any) => f.following.$id)

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
      allEntries = logs.rows
    }

    return { success: true, data: JSON.parse(JSON.stringify(allEntries)) }
  } catch (error: any) {
    console.error('Error fetching feed:', error)
    return { success: false, data: [] }
  }
}
