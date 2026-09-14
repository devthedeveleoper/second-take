const TMDB_BASE_URL = 'https://api.tmdb.org/3'
const API_KEY = process.env.TMDB_API_KEY

export interface TMDBMovie {
  id: number
  title: string
  original_title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  genre_ids: number[]
}

export interface TMDBProvider {
  logo_path: string
  provider_name: string
  provider_id: number
}

export interface TMDBWatchProviders {
  link: string
  flatrate?: TMDBProvider[]
  rent?: TMDBProvider[]
  buy?: TMDBProvider[]
}

export interface TMDBMovieDetails extends TMDBMovie {
  runtime: number
  genres: { id: number; name: string }[]
  credits: {
    cast: { id: number; name: string; character: string; profile_path: string | null }[]
    crew: { id: number; name: string; job: string; department: string }[]
  }
  media_type: 'movie' | 'tv'
  seasons?: {
    id: number
    name: string
    overview: string
    poster_path: string | null
    air_date: string
    episode_count: number
    season_number: number
  }[]
  recommendations?: {
    results: TMDBMovie[]
  }
  watch_providers?: Record<string, TMDBWatchProviders>
}

async function fetchFromTMDB<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  if (!API_KEY) {
    throw new Error('TMDB_API_KEY is not set')
  }

  // Construct the original TMDB URL
  const targetUrl = new URL(`https://api.themoviedb.org/3${endpoint}`)
  targetUrl.searchParams.append('api_key', API_KEY)
  
  Object.entries(params).forEach(([key, value]) => {
    targetUrl.searchParams.append(key, value)
  })

  const response = await fetch(targetUrl.toString(), {
    next: { revalidate: 86400 } // Cache for 24 hours by default
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'No response body')
    throw new Error(`TMDB API Error: ${response.status} - ${errorText}`)
  }

  return response.json()
}

const TV_OFFSET = 100000000;

export function encodeTmdbId(id: number, type: 'movie' | 'tv') {
  return type === 'tv' ? id + TV_OFFSET : id;
}

export function decodeTmdbId(encodedId: number): { id: number, type: 'movie' | 'tv' } {
  if (encodedId >= TV_OFFSET) {
    return { id: encodedId - TV_OFFSET, type: 'tv' };
  }
  return { id: encodedId, type: 'movie' };
}

export async function searchMovies(query: string, page: number = 1): Promise<{ results: TMDBMovie[], total_pages: number }> {
  if (!query) return { results: [], total_pages: 0 }
  
  const data = await fetchFromTMDB<{ results: any[], total_pages: number }>('/search/multi', {
    query,
    include_adult: 'false',
    page: page.toString()
  })
  
  // Filter out people, and map TV shows to look like movies for the UI
  const results = data.results
    .filter(item => item.media_type === 'movie' || item.media_type === 'tv')
    .map(item => ({
      id: encodeTmdbId(item.id, item.media_type), // Encode the ID so our database treats it uniquely
      title: item.title || item.name,
      original_title: item.original_title || item.original_name,
      overview: item.overview,
      poster_path: item.poster_path,
      backdrop_path: item.backdrop_path,
      release_date: item.release_date || item.first_air_date,
      genre_ids: item.genre_ids,
      media_type: item.media_type
    }))
  
  return { results, total_pages: data.total_pages }
}

export async function getMovieDetails(encodedId: number): Promise<TMDBMovieDetails> {
  const { id, type } = decodeTmdbId(encodedId)
  
  const data: any = await fetchFromTMDB(`/${type}/${id}`, {
    append_to_response: 'credits,recommendations,watch/providers'
  })
  
  return {
    id: encodedId, // Keep it encoded for the app's components
    title: data.title || data.name,
    original_title: data.original_title || data.original_name,
    overview: data.overview,
    poster_path: data.poster_path,
    backdrop_path: data.backdrop_path,
    release_date: data.release_date || data.first_air_date,
    genre_ids: data.genres ? data.genres.map((g: any) => g.id) : [],
    runtime: data.runtime || (data.episode_run_time && data.episode_run_time[0]) || 0,
    genres: data.genres || [],
    credits: data.credits || { cast: [], crew: [] },
    media_type: type,
    seasons: data.seasons || [],
    recommendations: data.recommendations ? {
      results: data.recommendations.results.map((item: any) => ({
        id: encodeTmdbId(item.id, item.media_type || type),
        title: item.title || item.name,
        original_title: item.original_title || item.original_name,
        overview: item.overview,
        poster_path: item.poster_path,
        backdrop_path: item.backdrop_path,
        release_date: item.release_date || item.first_air_date,
        genre_ids: item.genre_ids,
        media_type: item.media_type || type
      }))
    } : undefined,
    watch_providers: data['watch/providers']?.results || undefined
  } as TMDBMovieDetails
}

export function getImageUrl(path: string | null, size: 'w342' | 'w185' | 'w500' | 'w780' | 'original' = 'w500') {
  if (!path) return null
  return `https://image.tmdb.org/t/p/${size}${path}`
}

export interface TMDBEpisode {
  id: number
  name: string
  overview: string
  air_date: string
  episode_number: number
  season_number: number
  still_path: string | null
  watch_providers?: Record<string, TMDBWatchProviders>
}

export interface TMDBSeasonDetails {
  id: number
  name: string
  overview: string
  poster_path: string | null
  air_date: string
  season_number: number
  episodes: TMDBEpisode[]
  watch_providers?: Record<string, TMDBWatchProviders>
}

export async function getSeasonDetails(encodedSeriesId: number, seasonNumber: number): Promise<TMDBSeasonDetails> {
  const { id } = decodeTmdbId(encodedSeriesId)
  const data: any = await fetchFromTMDB(`/tv/${id}/season/${seasonNumber}`, {
    append_to_response: 'watch/providers'
  })
  
  return {
    ...data,
    watch_providers: data['watch/providers']?.results || undefined
  } as TMDBSeasonDetails
}

export async function getEpisodeDetails(encodedSeriesId: number, seasonNumber: number, episodeNumber: number): Promise<TMDBEpisode> {
  const { id } = decodeTmdbId(encodedSeriesId)
  const data: any = await fetchFromTMDB(`/tv/${id}/season/${seasonNumber}/episode/${episodeNumber}`, {
    append_to_response: 'watch/providers'
  })

  return {
    ...data,
    watch_providers: data['watch/providers']?.results || undefined
  } as TMDBEpisode
}
