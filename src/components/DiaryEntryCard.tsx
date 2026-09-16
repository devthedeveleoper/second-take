'use client'

import { useState, useTransition } from 'react'
import { Star, MoreVertical, Edit2, Trash2, Calendar, Loader2 } from 'lucide-react'
import { updateDiaryEntry, deleteDiaryEntry } from '@/app/actions/diary'

export default function DiaryEntryCard({ entry, tmdbId }: { entry: any, tmdbId: number }) {
  const [isEditing, setIsEditing] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState('')
  
  const [rating, setRating] = useState(entry.rating || 0)
  const [hoverRating, setHoverRating] = useState(0)

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrorMsg('')
    const formData = new FormData(e.currentTarget)
    
    if (rating > 0) {
      formData.set('rating', rating.toString())
    }

    startTransition(async () => {
      const isEpisode = entry.episode_number != null
      const res = await updateDiaryEntry(entry.$id, formData, isEpisode)
      if (res.error) {
        setErrorMsg(res.error)
      } else {
        setIsEditing(false)
      }
    })
  }

  const handleDelete = () => {
    if (!confirm('Are you sure you want to delete this diary entry?')) return
    
    startTransition(async () => {
      const isEpisode = entry.episode_number != null
      const res = await deleteDiaryEntry(entry.$id, tmdbId, isEpisode)
      if (res.error) {
        alert(res.error)
      }
    })
  }

  if (isEditing) {
    const defaultDate = entry.watched_at ? new Date(entry.watched_at).toISOString().split('T')[0] : ''
    const today = new Date().toISOString().split('T')[0]
    
    return (
      <div className="p-4 border border-accent/50 rounded-lg bg-surface-hover animate-in fade-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-serif font-medium">Edit Log</h4>
          <button 
            onClick={() => {
              setIsEditing(false)
              setRating(entry.rating || 0)
            }}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Cancel
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 text-sm text-red-500 p-2 bg-red-500/10 border border-red-500/20 rounded-md">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleUpdate} className="flex flex-col gap-4">
          <input type="hidden" name="tmdbId" value={tmdbId} />
          
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2 border border-border rounded-md px-3 py-2 bg-background flex-1 min-w-[200px]">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <input 
                type="date" 
                name="watchedAt" 
                defaultValue={defaultDate}
                max={today}
                className="bg-transparent border-none text-sm outline-none text-foreground w-full"
              />
            </div>
            
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" name="isRewatch" className="accent-accent w-4 h-4" defaultChecked={entry.is_rewatch} />
              I've seen this before
            </label>
          </div>

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
                    className={`w-6 h-6 subtle-transition ${
                      (hoverRating || rating) >= star 
                      ? 'fill-accent text-accent' 
                      : 'text-muted-foreground hover:text-accent'
                    }`} 
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-muted-foreground">Thoughts</label>
            <textarea 
              name="thought" 
              defaultValue={entry.thought}
              rows={3}
              className="w-full bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent subtle-transition resize-none"
            />
          </div>

          <button 
            type="submit" 
            disabled={isPending}
            className="w-full bg-foreground text-background font-medium py-2 rounded-md hover:bg-neutral-800 subtle-transition flex justify-center items-center gap-2 disabled:opacity-70 mt-2"
          >
            {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Changes
          </button>
        </form>
      </div>
    )
  }

  return (
    <div className={`p-4 border border-border rounded-lg bg-surface relative group ${isPending ? 'opacity-50' : ''}`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex flex-col">
          <span className="text-sm font-medium">
            {new Date(entry.watched_at).toLocaleDateString(undefined, {
              year: 'numeric', month: 'long', day: 'numeric'
            })}
            {entry.is_rewatch && <span className="text-muted-foreground ml-2 text-xs border border-border rounded-full px-2 py-0.5">Rewatch</span>}
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          {entry.rating && (
            <div className="flex items-center gap-0.5 text-accent">
              {[...Array(entry.rating)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-current" />
              ))}
            </div>
          )}
          
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              onBlur={() => setTimeout(() => setShowMenu(false), 200)}
              className="p-1 text-muted-foreground hover:text-foreground rounded-md opacity-0 group-hover:opacity-100 focus:opacity-100 subtle-transition"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-32 bg-background border border-border rounded-md shadow-lg overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-100">
                <button 
                  onClick={() => setIsEditing(true)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-surface flex items-center gap-2"
                >
                  <Edit2 className="w-3 h-3" />
                  Edit
                </button>
                <button 
                  onClick={handleDelete}
                  className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 flex items-center gap-2"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {entry.thought && (
        <p className="text-sm text-foreground/90 whitespace-pre-wrap mt-3 font-serif leading-relaxed">
          "{entry.thought}"
        </p>
      )}
    </div>
  )
}
