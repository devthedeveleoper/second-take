import { createSessionClient, createAdminClient } from '@/utils/appwrite/server'
import { Query } from 'node-appwrite'
import { getImageUrl } from '@/utils/tmdb'
import Link from 'next/link'
import Image from 'next/image'
import { Star } from 'lucide-react'

export default async function DiaryPage() {
  const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!
  
  let diaryEntries: any[] = []
  let errorMsg = ''
  let user
  
  try {
    const { account } = await createSessionClient()
    const { tables } = await createAdminClient()
    user = await account.get()
    
    // Fetch user's diary
    const diaryResult = await tables.listRows(DB_ID, 'diary_entries', [
      Query.equal('user_id', user.$id),
      Query.orderDesc('watched_at')
    ])
    
    if (diaryResult.total > 0) {
      const tmdbIds = diaryResult.rows.map((row: any) => row.tmdb_id)
      
      // Fetch movie details from cached_movies
      const cachedResult = await tables.listRows(DB_ID, 'cached_movies', [
        Query.equal('tmdb_id', tmdbIds)
      ])
      
      // Map them together
      diaryEntries = diaryResult.rows.map((entry: any) => {
        const movieData = cachedResult.rows.find((m: any) => m.tmdb_id === entry.tmdb_id)
        return {
          ...entry,
          movie: movieData || { title: 'Unknown Movie', poster_path: null, release_year: '' }
        }
      })
    }
    
  } catch (err: any) {
    if (err.message === 'No session') {
      errorMsg = 'Please log in to view your Diary.'
    } else {
      errorMsg = 'Failed to load diary.'
      console.error(err)
    }
  }

  // Group entries by month/year for a chronological feed feel
  const groupedEntries: { [key: string]: any[] } = {}
  
  diaryEntries.forEach(entry => {
    const date = new Date(entry.watched_at)
    const key = date.toLocaleString('default', { month: 'long', year: 'numeric' })
    if (!groupedEntries[key]) {
      groupedEntries[key] = []
    }
    groupedEntries[key].push(entry)
  })

  return (
    <div className="flex flex-col gap-12 py-8 animate-in fade-in duration-500 max-w-4xl mx-auto w-full">
      <div className="flex flex-col gap-2 border-b border-border pb-8">
        <h1 className="text-3xl font-serif">Diary</h1>
        <p className="text-muted-foreground text-sm">Your history with cinema.</p>
      </div>

      {errorMsg ? (
        <div className="py-12 text-center text-muted-foreground">
          {errorMsg}
        </div>
      ) : diaryEntries.length === 0 ? (
        <div className="py-24 text-center text-muted-foreground flex flex-col items-center gap-4 border border-dashed border-border rounded-xl">
          <p>Your diary is empty.</p>
          <Link href="/search" className="text-accent hover:underline">
            Log a film to start your journal
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-16">
          {Object.entries(groupedEntries).map(([monthYear, entries]) => (
            <div key={monthYear} className="flex flex-col gap-6">
              <h2 className="text-2xl font-serif sticky top-0 bg-background/90 backdrop-blur z-10 py-2 border-b border-border/50">
                {monthYear}
              </h2>
              
              <div className="flex flex-col gap-8">
                {entries.map((entry) => (
                  <div key={entry.$id} className="flex flex-col md:flex-row gap-6 p-4 md:p-6 bg-surface border border-border rounded-xl shadow-sm">
                    {/* Poster */}
                    <Link 
                      href={entry.season_number && entry.episode_number ? `/title/${entry.tmdb_id}/season/${entry.season_number}/episode/${entry.episode_number}` : `/title/${entry.tmdb_id}`} 
                      className="shrink-0 group"
                    >
                      <div className="w-24 md:w-32 aspect-[2/3] relative rounded-md overflow-hidden bg-surface-hover border border-border">
                        {entry.movie.poster_path ? (
                          <Image
                            src={getImageUrl(entry.movie.poster_path, 'w500') || ''}
                            alt={entry.movie.title}
                            fill
                            sizes="(max-width: 768px) 96px, 128px"
                            className="object-cover group-hover:scale-105 subtle-transition"
                          />
                        ) : (
                          <div className="absolute inset-0 flex items-center justify-center text-[10px] text-muted-foreground">
                            No Poster
                          </div>
                        )}
                      </div>
                    </Link>

                    {/* Entry Details */}
                    <div className="flex-1 flex flex-col gap-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-start gap-4">
                          <Link 
                            href={entry.season_number && entry.episode_number ? `/title/${entry.tmdb_id}/season/${entry.season_number}/episode/${entry.episode_number}` : `/title/${entry.tmdb_id}`} 
                            className="hover:text-accent subtle-transition"
                          >
                            <h3 className="font-serif text-xl md:text-2xl font-medium leading-tight">
                              {entry.movie.title}
                              {entry.season_number && entry.episode_number && (
                                <span className="text-muted-foreground font-mono font-normal text-sm ml-2 bg-surface-hover px-2 py-0.5 rounded border border-border">
                                  S{entry.season_number}E{entry.episode_number}
                                </span>
                              )}
                              {!entry.season_number && (
                                <span className="text-muted-foreground font-sans font-normal text-sm ml-2">
                                  {entry.movie.release_year}
                                </span>
                              )}
                            </h3>
                          </Link>
                          
                          {/* Rating */}
                          {entry.rating && (
                            <div className="flex gap-0.5 shrink-0">
                              {[...Array(entry.rating)].map((_, i) => (
                                <Star key={i} className="w-4 h-4 md:w-5 md:h-5 fill-accent text-accent" />
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <span>
                            {new Date(entry.watched_at).toLocaleDateString(undefined, {
                              weekday: 'long', day: 'numeric'
                            })}
                          </span>
                          {entry.is_rewatch && (
                            <span className="border border-border px-1.5 py-0.5 rounded-sm">
                              Rewatch
                            </span>
                          )}
                        </div>
                      </div>

                      {entry.thought && (
                        <p className="text-foreground/90 leading-relaxed font-serif text-sm md:text-base mt-2 whitespace-pre-wrap">
                          "{entry.thought}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
