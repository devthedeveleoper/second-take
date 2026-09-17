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

    const prompt = `
You are a ruthless, cynical, and extremely witty film critic. 
Your job is to roast a user's movie watching habits based on their 10 most recent logs.
Be creative, savage, yet undeniably funny. Format your response in clean markdown. 

Rules:
1. Don't hold back, but keep it PG-13 (funny insults about their taste, no actual hate speech).
2. Point out embarrassing patterns (e.g. rating bad movies highly, only watching superhero movies, etc).
3. End with a sarcastic recommendation of what they should watch next.

Here is their recent watch history:
${watchHistory}
`

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
    })

    const roastText = response.text || "I'm speechless. Your taste is so bad it broke my language model."

    return { success: true, data: roastText }
  } catch (error: any) {
    console.error('Error generating roast:', error)
    return { success: false, error: 'Failed to generate roast.' }
  }
}
