import { getEpisodeDetails, getMovieDetails, getImageUrl } from '@/utils/tmdb'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Calendar } from 'lucide-react'
import LogFilmForm from '@/components/LogFilmForm'
import { getMovieDiaryEntries } from '@/app/actions/diary'
import DiaryEntryCard from '@/components/DiaryEntryCard'
import WatchProviders from '@/components/WatchProviders'

export default async function EpisodePage({ params }: { params: Promise<{ id: string, season_number: string, episode_number: string }> }) {
  const { id, season_number, episode_number } = await params
  
  if (!id || !season_number || !episode_number) notFound()

  let episode
  let series
  try {
    series = await getMovieDetails(parseInt(id))
    episode = await getEpisodeDetails(parseInt(id), parseInt(season_number), parseInt(episode_number))
  } catch (error) {
    notFound()
  }

  if (!episode) notFound()

  const diaryEntries = await getMovieDiaryEntries(parseInt(id), parseInt(season_number), parseInt(episode_number))

  return (
    <div className="flex flex-col gap-12 py-8 animate-in fade-in duration-500 max-w-5xl mx-auto w-full px-4 md:px-0 pb-16">

      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="w-full md:w-1/2 aspect-video relative rounded-lg overflow-hidden shadow-xl border border-border bg-surface shrink-0">
          {episode.still_path ? (
            <Image
              src={getImageUrl(episode.still_path, 'original') || ''}
              alt={episode.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              priority
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
              No Image
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4 w-full">
          <div className="flex flex-col gap-1">
            <Link href={`/title/${id}/season/${season_number}`} className="text-muted-foreground hover:text-accent subtle-transition font-medium">
              &larr; Back to Season {season_number}
            </Link>
            <h1 className="text-3xl md:text-4xl font-serif font-medium leading-tight mt-2">
              <span className="text-muted-foreground font-sans font-normal text-xl block mb-1">
                Episode {episode.episode_number}
              </span>
              {episode.name}
            </h1>
          </div>

          <div className="flex items-center gap-1 text-sm text-muted-foreground font-medium">
            <Calendar className="w-4 h-4" />
            {episode.air_date ? new Date(episode.air_date).toLocaleDateString(undefined, {
              year: 'numeric', month: 'long', day: 'numeric'
            }) : 'Unknown Air Date'}
          </div>

          {episode.overview && (
            <p className="text-foreground/90 leading-relaxed mt-2">
              {episode.overview}
            </p>
          )}

          <div className="mt-4">
            <WatchProviders providers={episode.watch_providers} />
          </div>
        </div>
      </div>

      <hr className="border-border" />

      <div className="bg-surface border border-border rounded-xl p-6 md:p-8 flex flex-col gap-6 shadow-sm">
        <div className="flex justify-between items-center">
          <h2 className="font-serif text-2xl">Your Journal</h2>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 items-start">
          <LogFilmForm 
            tmdbId={series.id} 
            seasonNumber={parseInt(season_number)}
            episodeNumber={parseInt(episode_number)}
            existingEntries={diaryEntries} 
          />
        </div>
      </div>

      {diaryEntries.length > 0 && (
        <div className="mt-4 flex flex-col gap-4">
          <h3 className="font-serif text-xl border-b border-border pb-2">Past Logs</h3>
          <div className="flex flex-col gap-4">
            {diaryEntries.map((entry: any) => (
              <DiaryEntryCard key={entry.$id} entry={entry} tmdbId={series.id} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
