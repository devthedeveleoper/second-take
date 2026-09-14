'use client'

import { useState, useTransition } from 'react'
import { X, Loader2 } from 'lucide-react'
import { removeFromWatchlist } from '@/app/actions/watchlist'

export default function WatchlistRemoveButton({ tmdbId }: { tmdbId: number }) {
  const [isPending, startTransition] = useTransition()

  const handleRemove = (e: React.MouseEvent) => {
    e.preventDefault() // prevent navigating to movie page
    startTransition(async () => {
      const res = await removeFromWatchlist(tmdbId)
      if (res.error) alert(res.error)
    })
  }

  return (
    <button 
      onClick={handleRemove}
      disabled={isPending}
      className="absolute top-2 right-2 p-1.5 bg-background/80 backdrop-blur border border-border rounded-full text-muted-foreground hover:text-red-500 hover:border-red-500/50 hover:bg-red-500/10 subtle-transition opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-50"
      title="Remove from Watchlist"
    >
      {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
    </button>
  )
}
