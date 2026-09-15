import Image from 'next/image'
import Link from 'next/link'
import { getImageUrl } from '@/utils/tmdb'
import { Star, User as UserIcon } from 'lucide-react'

export default function FeedEntryCard({ entry }: { entry: any }) {
  const { profile, movie } = entry
  
  if (!movie) return null

  return (
    <div className="flex flex-col md:flex-row gap-4 p-4 border border-border rounded-xl bg-surface hover:bg-surface-hover subtle-transition animate-in fade-in zoom-in-95 duration-200">
      
      {/* Poster */}
      <Link href={`/title/${movie.id}`} className="shrink-0 relative w-24 md:w-32 aspect-[2/3] rounded-md overflow-hidden bg-background">
        {movie.poster_path ? (
          <Image
            src={getImageUrl(movie.poster_path, 'w342') || ''}
            alt={movie.title}
            fill
            sizes="(max-width: 768px) 96px, 128px"
            className="object-cover hover:scale-105 subtle-transition"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground text-center p-2">
            No Poster
          </div>
        )}
      </Link>

      <div className="flex flex-col gap-2 flex-1 pt-1">
        
        {/* Header: User and Date */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <Link href={`/u/${profile.username}`} className="flex items-center gap-2 hover:text-foreground subtle-transition group">
            <div className="w-5 h-5 rounded-full overflow-hidden relative bg-background border border-border">
              {profile.avatar_url ? (
                <Image src={profile.avatar_url} alt={profile.username} fill className="object-cover" />
              ) : (
                <UserIcon className="w-full h-full p-0.5 text-muted-foreground" />
              )}
            </div>
            <span className="font-medium group-hover:text-accent subtle-transition">{profile.username}</span>
          </Link>
          
          <div className="flex items-center gap-2">
            <span>
              {new Date(entry.watched_at).toLocaleDateString(undefined, {
                month: 'short', day: 'numeric', year: 'numeric'
              })}
            </span>
            {entry.is_rewatch && (
              <span className="border border-border rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider">
                Rewatch
              </span>
            )}
          </div>
        </div>

        {/* Title and Rating */}
        <div className="flex flex-col gap-0.5 mt-1">
          <Link href={`/title/${movie.id}`}>
            <h3 className="font-serif text-lg font-medium hover:text-accent subtle-transition leading-tight">
              {movie.title} <span className="text-muted-foreground text-sm font-sans font-normal ml-1">{movie.release_date?.split('-')[0]}</span>
            </h3>
          </Link>
          
          {entry.rating > 0 && (
            <div className="flex items-center gap-0.5 text-accent mt-1">
              {[...Array(entry.rating)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-current" />
              ))}
            </div>
          )}
        </div>

        {/* Thought */}
        {entry.thought && (
          <p className="text-sm text-foreground/90 font-serif leading-relaxed mt-2 whitespace-pre-wrap line-clamp-4">
            "{entry.thought}"
          </p>
        )}

      </div>
    </div>
  )
}
