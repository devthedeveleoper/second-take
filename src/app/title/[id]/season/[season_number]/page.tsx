import { getSeasonDetails, getMovieDetails, getImageUrl } from '@/utils/tmdb'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Calendar } from 'lucide-react'
import { getSeasonDiaryEntries } from '@/app/actions/diary'
import QuickLogEpisodeButton from '@/components/QuickLogEpisodeButton'
import WatchProviders from '@/components/WatchProviders'

export default async function SeasonPage({ params }: { params: Promise<{ id: string, season_number: string }> }) {
  const { id, season_number } = await params
  
  if (!id || !season_number) notFound()

  let season
  let series
  try {
    series = await getMovieDetails(parseInt(id))
    season = await getSeasonDetails(parseInt(id), parseInt(season_number))
  } catch (error) {
    notFound()
  }

  if (!season) notFound()

  const seasonDiaryEntries = await getSeasonDiaryEntries(parseInt(id), parseInt(season_number))

  return (
    <div className="flex flex-col gap-12 py-8 animate-in fade-in duration-500 max-w-5xl mx-auto w-full px-4 md:px-0 pb-16">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="w-1/3 md:w-1/4 max-w-[200px] shrink-0">
          <div className="aspect-[2/3] relative rounded-lg overflow-hidden shadow-xl border border-border bg-surface">
            {season.poster_path ? (
              <Image
                src={getImageUrl(season.poster_path, 'w500') || ''}
                alt={season.name}
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

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Link href={`/title/${id}`} className="text-muted-foreground hover:text-accent subtle-transition font-medium">
              &larr; Back to {series.title}
            </Link>
            <h1 className="text-4xl md:text-5xl font-serif font-medium leading-tight mt-2">
              {season.name}
            </h1>
          </div>

          <div className="flex items-center gap-1 text-sm text-muted-foreground font-medium">
            <Calendar className="w-4 h-4" />
            {season.air_date ? new Date(season.air_date).getFullYear() : 'Unknown Year'}
            <span className="mx-2">&bull;</span>
            {season.episodes.length} Episode{season.episodes.length !== 1 ? 's' : ''}
          </div>

          {season.overview && (
            <p className="text-foreground/90 leading-relaxed max-w-3xl mt-4">
              {season.overview}
            </p>
          )}

          <div className="mt-4">
            <WatchProviders providers={season.watch_providers} />
          </div>
        </div>
      </div>

      <hr className="border-border" />

      {/* Episodes List */}
      <div className="flex flex-col gap-6">
        <h2 className="text-2xl font-serif">Episodes</h2>
        
        <div className="flex flex-col gap-4">
          {season.episodes.map((episode) => {
            const episodeEntries = seasonDiaryEntries.filter((entry: any) => entry.episode_number === episode.episode_number)
            return (
              <Link 
                key={episode.id} 
                href={`/title/${id}/season/${season_number}/episode/${episode.episode_number}`}
                className="flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-border bg-surface hover:bg-surface-hover subtle-transition group relative"
              >
                <div className="w-full sm:w-48 aspect-video relative rounded-md overflow-hidden bg-surface-hover shrink-0">
                  {episode.still_path ? (
                    <Image
                      src={getImageUrl(episode.still_path, 'w500') || ''}
                      alt={episode.name}
                      fill
                      sizes="(max-width: 640px) 100vw, 200px"
                      className="object-cover group-hover:scale-105 subtle-transition"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs">
                      No Image
                    </div>
                  )}
                </div>
                
                <div className="flex flex-col gap-2 flex-1 justify-center pr-12 sm:pr-16">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-muted-foreground">
                      {episode.episode_number}
                    </span>
                    <h3 className="font-medium text-lg leading-tight group-hover:text-accent subtle-transition">
                      {episode.name}
                    </h3>
                  </div>
                  
                  {episode.air_date && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(episode.air_date).toLocaleDateString(undefined, {
                        year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </p>
                  )}

                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {episode.overview || 'No synopsis available.'}
                  </p>
                </div>

                <div className="absolute right-4 top-4 sm:top-auto sm:bottom-auto sm:my-auto sm:right-6">
                  <QuickLogEpisodeButton 
                    tmdbId={parseInt(id)} 
                    seasonNumber={parseInt(season_number)} 
                    episodeNumber={episode.episode_number} 
                    existingEntries={episodeEntries}
                  />
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
