'use client'

import { useState, useTransition } from 'react'
import { logFilm, deleteDiaryEntry } from '@/app/actions/diary'
import { CheckCircle2, Circle, Loader2 } from 'lucide-react'

export default function QuickLogEpisodeButton({ 
  tmdbId, 
  seasonNumber, 
  episodeNumber, 
  existingEntries 
}: { 
  tmdbId: number, 
  seasonNumber: number, 
  episodeNumber: number, 
  existingEntries: any[] 
}) {
  const [isPending, startTransition] = useTransition()
  const isWatched = existingEntries.length > 0

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    
    startTransition(async () => {
      if (isWatched) {
        const entry = existingEntries[0]
        await deleteDiaryEntry(entry.$id, tmdbId)
      } else {
        const formData = new FormData()
        formData.set('tmdbId', tmdbId.toString())
        formData.set('seasonNumber', seasonNumber.toString())
        formData.set('episodeNumber', episodeNumber.toString())
        await logFilm(formData)
      }
    })
  }

  return (
    <button 
      onClick={handleToggle}
      disabled={isPending}
      className={`p-2 rounded-full subtle-transition focus:outline-none focus:ring-2 focus:ring-accent ${
        isWatched 
          ? 'text-green-500 hover:text-green-600 bg-green-500/10 hover:bg-green-500/20' 
          : 'text-muted-foreground hover:text-foreground bg-surface hover:bg-surface-hover border border-border'
      }`}
      title={isWatched ? 'Mark as unwatched' : 'Mark as watched'}
    >
      {isPending ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : isWatched ? (
        <CheckCircle2 className="w-5 h-5 fill-current" />
      ) : (
        <Circle className="w-5 h-5" />
      )}
    </button>
  )
}
