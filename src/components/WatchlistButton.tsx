'use client'

import { useState, useTransition } from 'react'
import { Bookmark, Loader2, Check } from 'lucide-react'
import { addToWatchlist, removeFromWatchlist } from '@/app/actions/watchlist'

export default function WatchlistButton({ tmdbId, initialState }: { tmdbId: number, initialState: boolean }) {
  const [inWatchlist, setInWatchlist] = useState(initialState)
  const [isPending, startTransition] = useTransition()

  const handleToggle = () => {
    startTransition(async () => {
      setInWatchlist(!inWatchlist)
      
      let res
      if (inWatchlist) {
        res = await removeFromWatchlist(tmdbId)
      } else {
        res = await addToWatchlist(tmdbId)
      }
      
      if (res.error) {
        setInWatchlist(inWatchlist)
        alert(res.error)
      }
    })
  }

  return (
    <button 
      onClick={handleToggle}
      disabled={isPending}
      className={`flex-1 flex items-center justify-center gap-2 border rounded-lg py-3 subtle-transition font-medium disabled:opacity-70 ${
        inWatchlist 
          ? 'bg-green-500/10 border-green-500 text-green-600 hover:bg-green-500/20' 
          : 'border-border hover:bg-surface-hover text-foreground'
      }`}
    >
      {isPending ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : inWatchlist ? (
        <Check className="w-5 h-5" />
      ) : (
        <Bookmark className="w-5 h-5" />
      )}
      
      {inWatchlist ? 'In Watchlist' : 'Add to Watchlist'}
    </button>
  )
}
