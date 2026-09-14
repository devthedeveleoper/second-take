'use server'

import { searchMovies } from '@/utils/tmdb'

export async function fetchNextSearchPage(query: string, page: number) {
  try {
    const data = await searchMovies(query, page)
    return { success: true, data }
  } catch (error: any) {
    console.error('Fetch next page error:', error)
    return { success: false, error: 'Failed to fetch next page' }
  }
}
