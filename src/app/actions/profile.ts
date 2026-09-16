'use server'

import { createSessionClient, createAdminClient } from '@/utils/appwrite/server'
import { ID, Query } from 'node-appwrite'
import { revalidatePath } from 'next/cache'

const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!
const COLLECTION = 'profiles'

export async function getProfile() {
  try {
    const { account } = await createSessionClient()
    const { tables } = await createAdminClient()
    const user = await account.get()

    const results = await tables.listRows(DB_ID, COLLECTION, [
      Query.equal('user_id', user.$id)
    ])

    if (results.total > 0) {
      return JSON.parse(JSON.stringify(results.rows[0]))
    }

    return null
  } catch (error) {
    console.error('Error fetching profile:', error)
    return null
  }
}

export async function updateProfile(formData: FormData) {
  try {
    const { account, storage } = await createSessionClient()
    const { tables } = await createAdminClient()
    const user = await account.get()

    const username = formData.get('username') as string
    const bio = formData.get('bio') as string
    let avatar_url = formData.get('avatar_url') as string | null
    const avatarFile = formData.get('avatar_file') as File | null
    
    if (avatarFile && avatarFile.size > 0) {
      const uploadedFile = await storage.createFile('avatars', ID.unique(), avatarFile)
      
      const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1'
      const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID
      avatar_url = `${endpoint}/storage/buckets/avatars/files/${uploadedFile.$id}/view?project=${projectId}`
    }

    if (avatar_url === '') {
        avatar_url = null
    }

    const profileData = {
      user_id: user.$id,
      username: username || user.name || 'Cinephile',
      bio: bio || '',
      avatar_url: avatar_url
    }

    const existing = await tables.listRows(DB_ID, COLLECTION, [
      Query.equal('user_id', user.$id)
    ])

    if (existing.total > 0) {
      await tables.updateRow(DB_ID, COLLECTION, existing.rows[0].$id, profileData)
    } else {
      await tables.createRow(DB_ID, COLLECTION, ID.unique(), profileData)
    }

    revalidatePath('/profile')
    return { success: true }
  } catch (error: any) {
    console.error('Error updating profile:', error)
    return { success: false, error: error.message }
  }
}

export async function getPublicProfile(username: string) {
  try {
    const { tables } = await createAdminClient()
    
    const result = await tables.listRows(DB_ID, COLLECTION, [
      Query.equal('username', username)
    ])

    if (result.total === 0) {
      return { success: false, data: null }
    }

    const profile = result.rows[0]

    const diaryResult = await tables.listRows(DB_ID, 'diary_entries', [
      Query.equal('user_id', profile.user_id),
      Query.limit(5000)
    ])

    const entries = diaryResult.rows
    const uniqueTitles = new Set(entries.map((e: any) => e.tmdb_id))
    const episodes = entries.filter((e: any) => e.episode_number !== null)

    const stats = {
      totalLogs: entries.length,
      uniqueTitles: uniqueTitles.size,
      episodesWatched: episodes.length
    }

    const recentLogsRaw = entries.slice(0, 10)
    const recentLogs = await Promise.all(
      recentLogsRaw.map(async (entry: any) => {
        try {
          const { getMovieDetails } = await import('@/utils/tmdb')
          const tmdbData = await getMovieDetails(entry.tmdb_id)
          return {
            ...entry,
            movie: tmdbData
          }
        } catch (e) {
          return entry
        }
      })
    )

    return { 
      success: true, 
      data: {
        profile: JSON.parse(JSON.stringify(profile)),
        stats,
        recentLogs: JSON.parse(JSON.stringify(recentLogs))
      }
    }
  } catch (error: any) {
    console.error('Error fetching public profile:', error)
    return { success: false, data: null }
  }
}
