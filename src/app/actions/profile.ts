'use server'

import { createSessionClient, createAdminClient } from '@/utils/appwrite/server'
import { ID, Query } from 'node-appwrite'
import { revalidatePath } from 'next/cache'
import { hydrateMovies } from '@/utils/appwrite/hydration'

const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!
const COLLECTION = 'profiles'

export async function getProfile() {
  try {
    const { account } = await createSessionClient()
    const { tables } = await createAdminClient()
    const user = await account.get()

    try {
      const profile = await tables.listRows(DB_ID, COLLECTION, [Query.equal('$id', user.$id)])
      if (profile.total > 0) {
        return JSON.parse(JSON.stringify(profile.rows[0]))
      }
      return null
    } catch {
      return null
    }
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
      username: username || user.name || 'Cinephile',
      bio: bio || '',
      avatar_url: avatar_url
    }

    try {
      const existing = await tables.listRows(DB_ID, COLLECTION, [Query.equal('$id', user.$id)])
      if (existing.total > 0) {
        await tables.updateRow(DB_ID, COLLECTION, user.$id, profileData)
      } else {
        await tables.createRow(DB_ID, COLLECTION, user.$id, profileData)
      }
    } catch (e: any) {
      throw e
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

    if (result.total === 0) return { success: false, data: null }
    const profile = result.rows[0]

    const diaryResult = await tables.listRows(DB_ID, 'diary_entries', [
      Query.equal('profile', profile.$id),
      Query.limit(5000)
    ])

    const episodeResult = await tables.listRows(DB_ID, 'episode_entries', [
      Query.equal('profile', profile.$id),
      Query.limit(5000)
    ])

    const entries = [...diaryResult.rows, ...episodeResult.rows]
    const uniqueTitles = new Set(entries.map((e: any) => typeof e.movie === 'string' ? e.movie : (e.movie ? e.movie.tmdb_id : e.tmdb_id)))
    const episodes = entries.filter((e: any) => e.episode_number !== undefined && e.episode_number !== null)

    const stats = {
      totalLogs: entries.length,
      uniqueTitles: uniqueTitles.size,
      episodesWatched: episodes.length
    }

    const sortedDiary = [...diaryResult.rows].sort((a, b) => 
      new Date(b.watched_at).getTime() - new Date(a.watched_at).getTime()
    )
    const recentLogsRaw = sortedDiary.slice(0, 10)
    const recentLogs = await hydrateMovies(recentLogsRaw)

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
