export const dynamic = 'force-dynamic';
import { createSessionClient, createAdminClient } from '@/utils/appwrite/server'
import { Query } from 'node-appwrite'
import { getImageUrl } from '@/utils/tmdb'
import Link from 'next/link'
import Image from 'next/image'
import WatchlistRemoveButton from '@/components/WatchlistRemoveButton'

export default async function WatchlistPage() {
  const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!
  
  let watchlistItems: any[] = []
  let errorMsg = ''
  let user
  
  try {
    const { account } = await createSessionClient()
    const { tables } = await createAdminClient()
    user = await account.get()
    
    const watchlistResult = await tables.listRows(DB_ID, 'watchlist', [
      Query.equal('user_id', user.$id),
      Query.orderDesc('created_at')
    ])
    
    if (watchlistResult.total > 0) {
      const tmdbIds = watchlistResult.rows.map((row: any) => row.tmdb_id)
      
      const cachedResult = await tables.listRows(DB_ID, 'cached_movies', [
        Query.equal('tmdb_id', tmdbIds)
      ])
      
      watchlistItems = watchlistResult.rows.map((item: any) => {
        const movieData = cachedResult.rows.find((m: any) => m.tmdb_id === item.tmdb_id)
        return {
          ...item,
          movie: movieData || { title: 'Unknown Movie', poster_path: null }
        }
      })
    }
    
  } catch (err: any) {
    if (err.message === 'No session') {
      errorMsg = 'Please log in to view your Watchlist.'
    } else {
      errorMsg = 'Failed to load watchlist.'
      console.error(err)
    }
  }

  return (
    <div className="flex flex-col gap-12 py-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2 border-b border-border pb-8">
        <h1 className="text-3xl font-serif">Watchlist</h1>
        <p className="text-muted-foreground text-sm">Films you want to see.</p>
      </div>

      {errorMsg ? (
        <div className="py-12 text-center text-muted-foreground">
          {errorMsg}
        </div>
      ) : watchlistItems.length === 0 ? (
        <div className="py-24 text-center text-muted-foreground flex flex-col items-center gap-4 border border-dashed border-border rounded-xl">
          <p>Your vault is empty.</p>
          <Link href="/search" className="text-accent hover:underline">
            Search for films to add
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {watchlistItems.map((item) => (
            <Link key={item.$id} href={`/title/${item.tmdb_id}`} className="group flex flex-col gap-3">
              <div className="aspect-[2/3] relative rounded-lg overflow-hidden bg-surface-hover border border-border shadow-sm">
                {item.movie.poster_path ? (
                  <Image
                    src={getImageUrl(item.movie.poster_path, 'w500') || ''}
                    alt={item.movie.title}
                    fill
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                    className="object-cover group-hover:scale-105 subtle-transition"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm text-center p-4">
                    No Poster
                  </div>
                )}
                
                {/* Remove Button */}
                <WatchlistRemoveButton tmdbId={item.tmdb_id} />
              </div>
              <div className="flex flex-col">
                <h3 className="font-medium text-sm leading-tight group-hover:text-accent subtle-transition truncate">
                  {item.movie.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
