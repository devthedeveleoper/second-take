export const dynamic = 'force-dynamic';
import { createSessionClient, createAdminClient } from '@/utils/appwrite/server'
import { Query } from 'node-appwrite'
import { getImageUrl } from '@/utils/tmdb'
import Link from 'next/link'
import Image from 'next/image'
import { Star, Film, Bookmark } from 'lucide-react'

export default async function Home() {
  const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!
  
  let recentDiary: any[] = []
  let recentWatchlist: any[] = []
  let totalDiary = 0
  let totalWatchlist = 0
  let user = null
  let errorMsg = ''

  try {
    const { account } = await createSessionClient()
    const { tables } = await createAdminClient()
    user = await account.get()

    const diaryResult = await tables.listRows(DB_ID, 'diary_entries', [
      Query.equal('profile', user.$id),
      Query.orderDesc('watched_at'),
      Query.limit(4)
    ])
    totalDiary = diaryResult.total

    const watchlistResult = await tables.listRows(DB_ID, 'watchlist', [
      Query.equal('profile', user.$id),
      Query.orderDesc('created_at'),
      Query.limit(6)
    ])
    totalWatchlist = watchlistResult.total

    recentDiary = diaryResult.rows.map((entry: any) => ({
      ...entry, 
      movie: entry.movie || { title: 'Unknown', poster_path: null }
    }))

    recentWatchlist = watchlistResult.rows.map((entry: any) => ({
      ...entry, 
      movie: entry.movie || { title: 'Unknown', poster_path: null }
    }))

  } catch (err: any) {
    if (err.code === 401 || err.message === 'No session') {
      return (
        <div className="relative -mx-4 md:-mx-8 -mt-8 flex flex-col items-center justify-center min-h-[calc(100vh-64px)] overflow-hidden">
          {/* Cinematic Background */}
          <div className="absolute inset-0 z-0">
            <Image
              src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=2070&auto=format&fit=crop"
              alt="Cinematic Theater Background"
              fill
              className="object-cover opacity-30 mix-blend-luminosity scale-105 animate-[pulse_15s_ease-in-out_infinite_alternate]"
              priority
            />
            {/* Vignette & Gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-background opacity-80" />
            
            {/* Film Grain Overlay (CSS trick) */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-overlay" 
                 style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}>
            </div>
          </div>

          {/* Hero Content */}
          <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-8">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
              <span className="text-xs font-medium tracking-wider text-white/80 uppercase">The Anti-IMDb</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif font-medium leading-[1.1] tracking-tight mb-6 text-white drop-shadow-2xl">
              Don't just remember what you watched.
            </h1>
            
            <p className="text-xl md:text-2xl text-white/70 font-serif italic mb-12 max-w-xl leading-relaxed">
              Remember what you <span className="text-white">saw</span>. A quiet, personal space for your life in film.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link 
                href="/login" 
                className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-black rounded-full font-medium text-lg overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_8px_rgba(255,255,255,0.2)]"
              >
                <span className="relative z-10">Start your journal</span>
                <div className="absolute inset-0 bg-gradient-to-r from-accent/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </Link>
            </div>
          </div>

          {/* Scrolling decorative film strip */}
          <div className="absolute bottom-0 left-0 w-full overflow-hidden whitespace-nowrap opacity-20 pointer-events-none pb-8">
            <div className="inline-block animate-[spin_120s_linear_infinite] [animation-direction:reverse] text-[150px] font-serif tracking-tighter leading-none text-white/10 select-none">
              CINEMA &bull; JOURNAL &bull; VAULT &bull; DIARY &bull; CINEMA &bull; JOURNAL &bull; VAULT &bull; DIARY &bull;
            </div>
          </div>
        </div>
      )
    }
    console.error(err)
    errorMsg = 'Failed to load dashboard data.'
  }

  return (
    <div className="flex flex-col gap-12 py-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col gap-2 border-b border-border pb-8">
        <h1 className="text-3xl font-serif">Welcome back{user?.name ? `, ${user.name}` : ''}</h1>
        <p className="text-muted-foreground">Here is a glimpse of your cinema.</p>
      </div>

      {errorMsg && (
        <div className="text-red-500 bg-red-500/10 p-4 rounded-md text-sm">{errorMsg}</div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 md:gap-6">
        <Link href="/diary" className="bg-surface border border-border rounded-xl p-6 flex flex-col gap-2 hover:border-accent subtle-transition group">
          <div className="flex items-center gap-2 text-muted-foreground group-hover:text-accent subtle-transition">
            <Film className="w-5 h-5" />
            <span className="font-medium">Films Logged</span>
          </div>
          <span className="text-4xl font-serif">{totalDiary}</span>
        </Link>
        
        <Link href="/watchlist" className="bg-surface border border-border rounded-xl p-6 flex flex-col gap-2 hover:border-accent subtle-transition group">
          <div className="flex items-center gap-2 text-muted-foreground group-hover:text-accent subtle-transition">
            <Bookmark className="w-5 h-5" />
            <span className="font-medium">Watchlist</span>
          </div>
          <span className="text-4xl font-serif">{totalWatchlist}</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        
        {/* Recent Diary */}
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-end">
            <h2 className="text-2xl font-serif">Recent Logs</h2>
            <Link href="/diary" className="text-sm text-accent hover:underline">View all</Link>
          </div>
          
          {recentDiary.length === 0 ? (
            <div className="bg-surface border border-dashed border-border rounded-xl p-8 text-center text-muted-foreground text-sm">
              No films logged yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {recentDiary.map((entry) => (
                <Link 
                  key={entry.$id} 
                  href={entry.season_number && entry.episode_number ? `/title/${entry.tmdb_id}/season/${entry.season_number}/episode/${entry.episode_number}` : `/title/${entry.tmdb_id}`} 
                  className="group flex flex-col gap-2"
                >
                  <div className="aspect-[2/3] relative rounded-md overflow-hidden bg-surface-hover border border-border">
                    {entry.movie.poster_path ? (
                      <Image
                        src={getImageUrl(entry.movie.poster_path, 'w342') || ''}
                        alt={entry.movie.title}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-cover group-hover:scale-105 subtle-transition"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-[10px] text-muted-foreground text-center">
                        No Poster
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm truncate group-hover:text-accent subtle-transition">
                      {entry.movie.title} {entry.season_number && entry.episode_number ? `(S${entry.season_number}E${entry.episode_number})` : ''}
                    </span>
                    {entry.rating && (
                      <div className="flex gap-0.5 mt-1">
                        {[...Array(entry.rating)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-accent text-accent" />
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Watchlist */}
        <div className="flex flex-col gap-6">
          <div className="flex justify-between items-end">
            <h2 className="text-2xl font-serif">From the Vault</h2>
            <Link href="/watchlist" className="text-sm text-accent hover:underline">View all</Link>
          </div>
          
          {recentWatchlist.length === 0 ? (
            <div className="bg-surface border border-dashed border-border rounded-xl p-8 text-center text-muted-foreground text-sm">
              Watchlist is empty.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {recentWatchlist.map((entry) => (
                <Link key={entry.$id} href={`/title/${entry.tmdb_id}`} className="group flex flex-col gap-2">
                  <div className="aspect-[2/3] relative rounded-md overflow-hidden bg-surface-hover border border-border">
                    {entry.movie.poster_path ? (
                      <Image
                        src={getImageUrl(entry.movie.poster_path, 'w342') || ''}
                        alt={entry.movie.title}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-cover group-hover:scale-105 subtle-transition"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-[10px] text-muted-foreground text-center">
                        No Poster
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm truncate group-hover:text-accent subtle-transition">{entry.movie.title}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
