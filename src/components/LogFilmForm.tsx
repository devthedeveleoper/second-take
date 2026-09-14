'use client'

import { useState, useTransition } from 'react'
import { BookOpen, Star, Loader2, Calendar } from 'lucide-react'
import { logFilm } from '@/app/actions/diary'

export default function LogFilmForm({ tmdbId, existingEntries, seasonNumber, episodeNumber }: { tmdbId: number, existingEntries: any[], seasonNumber?: number, episodeNumber?: number }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMsg('')
    const formData = new FormData(e.currentTarget)
    
    // Ensure rating is injected if set visually
    if (rating > 0) {
      formData.set('rating', rating.toString())
    }

    startTransition(async () => {
      const res = await logFilm(formData)
      if (res.error) {
        setErrorMsg(res.error)
      } else {
        setIsOpen(false)
        setRating(0)
        // Revalidation happens on server, page will reflect new entry
      }
    })
  }

  // Calculate today's date formatted for HTML date input
  const today = new Date().toISOString().split('T')[0]
  const hasLogged = existingEntries.length > 0
  const isEpisode = seasonNumber !== undefined && episodeNumber !== undefined

  if (!isOpen) {
    return (
      <div className="flex-1 flex flex-col gap-2">
        <button 
          onClick={() => setIsOpen(true)}
          className={`w-full flex items-center justify-center gap-2 rounded-lg py-3 subtle-transition font-medium ${
            hasLogged 
            ? 'bg-surface border border-border hover:bg-surface-hover text-foreground' 
            : 'bg-foreground text-background hover:bg-neutral-800'
          }`}
        >
          <BookOpen className="w-5 h-5" />
          {hasLogged ? 'Log it again' : (isEpisode ? 'Log this episode' : 'Log this film')}
        </button>
        {hasLogged && (
          <p className="text-xs text-muted-foreground text-center">
            You've logged this {existingEntries.length} time{existingEntries.length > 1 ? 's' : ''}.
          </p>
        )}
      </div>
    )
  }

  return (
    <div className="flex-1 bg-surface-hover border border-border rounded-xl p-4 md:p-6 animate-in fade-in zoom-in-95 duration-200">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-serif text-xl">Diary Entry</h3>
        <button 
          onClick={() => setIsOpen(false)}
          className="text-muted-foreground hover:text-foreground text-sm"
        >
          Cancel
        </button>
      </div>

      {errorMsg && (
        <div className="mb-4 text-sm text-red-500 p-3 bg-red-500/10 border border-red-500/20 rounded-md">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input type="hidden" name="tmdbId" value={tmdbId} />
        {seasonNumber !== undefined && <input type="hidden" name="seasonNumber" value={seasonNumber} />}
        {episodeNumber !== undefined && <input type="hidden" name="episodeNumber" value={episodeNumber} />}
        
        {/* Date & Rewatch */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2 border border-border rounded-md px-3 py-2 bg-surface flex-1 min-w-[200px]">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <input 
              type="date" 
              name="watchedAt" 
              defaultValue={today}
              max={today}
              className="bg-transparent border-none text-sm outline-none text-foreground w-full"
            />
          </div>
          
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" name="isRewatch" className="accent-accent w-4 h-4" defaultChecked={hasLogged} />
            I've seen this before
          </label>
        </div>

        {/* Rating */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-muted-foreground">Rating</label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(rating === star ? 0 : star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1 focus:outline-none"
              >
                <Star 
                  className={`w-7 h-7 subtle-transition ${
                    (hoverRating || rating) >= star 
                    ? 'fill-accent text-accent' 
                    : 'text-muted-foreground hover:text-accent'
                  }`} 
                />
              </button>
            ))}
          </div>
        </div>

        {/* Thought / Review */}
        <div className="flex flex-col gap-1">
          <label className="text-sm text-muted-foreground">Thoughts (optional)</label>
          <textarea 
            name="thought" 
            rows={4}
            placeholder="Add your thoughts..."
            className="w-full bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent subtle-transition resize-none"
          />
        </div>

        <button 
          type="submit" 
          disabled={isPending}
          className="w-full bg-foreground text-background font-medium py-3 rounded-lg hover:bg-neutral-800 subtle-transition flex justify-center items-center gap-2 disabled:opacity-70 mt-2"
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          Save Entry
        </button>
      </form>
    </div>
  )
}
