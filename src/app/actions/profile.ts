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
      // Create a native file to bypass node-appwrite input quirks if any, though Next.js File usually works.
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

    // Check if profile exists
    const existing = await tables.listRows(DB_ID, COLLECTION, [
      Query.equal('user_id', user.$id)
    ])

    if (existing.total > 0) {
      // Update
      await tables.updateRow(DB_ID, COLLECTION, existing.rows[0].$id, profileData)
    } else {
      // Create
      await tables.createRow(DB_ID, COLLECTION, ID.unique(), profileData)
    }

    revalidatePath('/profile')
    return { success: true }
  } catch (error: any) {
    console.error('Error updating profile:', error)
    return { success: false, error: error.message }
  }
}
