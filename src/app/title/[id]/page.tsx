import { getMovieDetails, getImageUrl } from '@/utils/tmdb'
import Image from 'next/image'
import { Clock, Calendar, Star } from 'lucide-react'
import { notFound } from 'next/navigation'
import WatchlistButton from '@/components/WatchlistButton'
import { checkWatchlist } from '@/app/actions/watchlist'
import LogFilmForm from '@/components/LogFilmForm'
import DiaryEntryCard from '@/components/DiaryEntryCard'
import { getMovieDiaryEntries } from '@/app/actions/diary'
import CastCarousel from '@/components/CastCarousel'
import SeasonCarousel from '@/components/SeasonCarousel'
import RecommendationsCarousel from '@/components/RecommendationsCarousel'
import WatchProviders from '@/components/WatchProviders'

export default async function MoviePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  if (!id) {
    notFound()
  }

  let movie
  let networkError = false
  try {
    movie = await getMovieDetails(parseInt(id))
  } catch (error: any) {
    if (error.message?.includes('Timeout') || error.message?.includes('fetch failed')) {
      networkError = true
    } else {
      notFound()
    }
  }

  if (networkError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <h2 className="text-2xl font-serif mb-4 text-red-500">Network Error</h2>
        <p className="text-muted-foreground max-w-md">
          Could not reach TMDB to load movie details. If you are in a region where TMDB is blocked (e.g. some Indian ISPs), please use a VPN or custom DNS.
        </p>
      </div>
    )
  }

  if (!movie) {
    notFound()
  }

  const director = movie.credits.crew.find((c) => c.job === 'Director')?.name || 'Unknown Director'
  const mainCast = movie.credits.cast.slice(0, 15)
  const isWatchlisted = await checkWatchlist(movie.id)
  const diaryEntries = await getMovieDiaryEntries(movie.id)

  return (
    <div className="flex flex-col animate-in fade-in duration-500 pb-16">
      
      {/* Cinematic Header */}
      <div className="relative w-full aspect-[21/9] md:aspect-[3/1] bg-surface-hover rounded-xl overflow-hidden mb-8 border border-border">
        {movie.backdrop_path ? (
          <>
            <Image
              src={getImageUrl(movie.backdrop_path, 'original') || ''}
              alt={`${movie.title} Backdrop`}
              fill
              className="object-cover opacity-60 mix-blend-overlay"
              priority
            />
            {/* Gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-surface flex items-center justify-center text-muted-foreground">
            No Backdrop
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-8 px-4 md:px-0 -mt-16 md:-mt-24 z-10">
        
        {/* Poster */}
        <div className="w-1/3 md:w-1/4 max-w-[200px] shrink-0">
          <div className="aspect-[2/3] relative rounded-lg overflow-hidden shadow-2xl border border-border bg-surface">
            {movie.poster_path ? (
              <Image
                src={getImageUrl(movie.poster_path, 'w500') || ''}
                alt={movie.title}
                fill
                sizes="200px"
                className="object-cover"
                priority
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs text-center p-2">
                No Poster
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 flex flex-col justify-end pt-8 md:pt-16 gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl md:text-5xl font-serif font-medium leading-tight">
              {movie.title}
            </h1>
            {movie.original_title && movie.original_title !== movie.title && (
              <p className="text-muted-foreground italic text-lg">
                {movie.original_title}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-4 text-sm font-medium text-muted-foreground items-center">
            <span className="text-foreground">{director}</span>
            <span>&bull;</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {movie.release_date ? movie.release_date.split('-')[0] : 'Unknown'}
            </span>
            <span>&bull;</span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {movie.runtime} min
            </span>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {movie.genres.map((g: any) => (
              <span key={g.id} className="px-3 py-1 rounded-full border border-border text-xs text-muted-foreground">
                {g.name}
              </span>
            ))}
          </div>
          
          <div className="mt-2">
            <WatchProviders providers={movie.watch_providers} />
          </div>
        </div>
      </div>

      <hr className="my-10 border-border" />

      {/* Relationship Module */}
      <div className="bg-surface border border-border rounded-xl p-6 md:p-8 flex flex-col gap-6 shadow-sm">
        <div className="flex justify-between items-center">
          <h2 className="font-serif text-2xl">Your Cinema</h2>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <LogFilmForm tmdbId={movie.id} existingEntries={diaryEntries} />
          
          {!diaryEntries.length && (
            <div className="w-full sm:w-auto sm:min-w-[200px]">
              <WatchlistButton tmdbId={movie.id} initialState={isWatchlisted} />
            </div>
          )}
        </div>
      </div>
      
      {/* Past Diary Entries */}
      {diaryEntries.length > 0 && (
        <div className="mt-8 flex flex-col gap-4">
          <h3 className="font-serif text-xl border-b border-border pb-2">Past Logs</h3>
          <div className="flex flex-col gap-4">
            {diaryEntries.map((entry: any) => (
              <DiaryEntryCard key={entry.$id} entry={entry} tmdbId={movie.id} />
            ))}
          </div>
        </div>
      )}

      {/* Synopsis & Cast */}
      <div className="mt-16 flex flex-col gap-8">
        <div>
          <h3 className="text-xl font-serif mb-4">Synopsis</h3>
          <p className="text-muted-foreground leading-relaxed max-w-3xl">
            {movie.overview || 'No synopsis available.'}
          </p>
        </div>

        {movie.seasons && movie.seasons.length > 0 && (
          <div>
            <h3 className="text-xl font-serif mb-4">Seasons</h3>
            <SeasonCarousel seasons={movie.seasons} seriesId={movie.id} />
          </div>
        )}

        <div>
          <h3 className="text-xl font-serif mb-4">Top Cast</h3>
          <CastCarousel cast={mainCast} />
        </div>

        {movie.recommendations && movie.recommendations.results.length > 0 && (
          <div className="mt-8">
            <h3 className="text-xl font-serif mb-4">Recommended</h3>
            <RecommendationsCarousel recommendations={movie.recommendations.results} />
          </div>
        )}
      </div>
    </div>
  )
}
