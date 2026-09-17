'use server'

import { getPublicProfile } from '@/app/actions/profile'
import { GoogleGenAI } from '@google/genai'

import { createSessionClient, createAdminClient } from '@/utils/appwrite/server'
import { Query } from 'node-appwrite'
import { hydrateMovies } from '@/utils/appwrite/hydration'

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
})

export async function generateRoast(username?: string) {
  if (!process.env.GEMINI_API_KEY) {
    return {
      success: false,
      error: 'GEMINI_API_KEY is not configured in .env.local'
    }
  }

  try {
    let recentLogs: any[] = []

    if (username) {
      const profileRes = await getPublicProfile(username)
      if (!profileRes.success || !profileRes.data) {
        return { success: false, error: 'Could not fetch profile data for roast.' }
      }
      recentLogs = profileRes.data.recentLogs
    } else {
      const { account } = await createSessionClient()
      const { tables } = await createAdminClient()
      const user = await account.get()

      const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!

      const diaryResult = await tables.listRows(DB_ID, 'diary_entries', [
        Query.equal('profile', user.$id),
        Query.limit(10),
        Query.orderDesc('watched_at')
      ])
      recentLogs = await hydrateMovies(diaryResult.rows)
    }

    if (recentLogs.length < 3) {
      return {
        success: false,
        error: 'You need to log at least 3 movies before I can accurately roast your taste.'
      }
    }

    // Format logs for the prompt
    const watchHistory = recentLogs.map((log: any) => {
      let title = log.movie?.title || 'Unknown Title'
      if (log.season_number && log.episode_number) {
        title += ` (S${log.season_number}E${log.episode_number})`
      }
      return `- ${title} (${log.rating ? log.rating + '/5 stars' : 'No rating'})`
    }).join('\n')

    const { functions } = await createAdminClient()
    const watchHistoryString = watchHistory

    const execution = await functions.createExecution({
      functionId: '6aaba708001f9e4b2d5a',
      body: watchHistoryString,
      async: false // async: false so it waits for the result
    })

    let roastText = "I'm speechless. Your taste is so bad it broke my language model."

    if (execution.status === 'completed') {
      try {
        const result = JSON.parse(execution.responseBody)
        if (result.success && result.data) {
          roastText = result.data
        }
      } catch (e) {
        console.error('Failed to parse function response:', execution.responseBody)
      }
    } else {
      console.error('Appwrite function failed:', execution.errors)
    }

    return { success: true, data: roastText }
  } catch (error: any) {
    console.error('Error generating roast:', error)
    return { success: false, error: 'Failed to generate roast.' }
  }
}
