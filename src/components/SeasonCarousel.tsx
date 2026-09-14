'use client'

import { useRef } from 'react'
import Image from 'next/image'
import { getImageUrl } from '@/utils/tmdb'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

export default function SeasonCarousel({ seasons, seriesId }: { seasons: any[], seriesId: number }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  if (!seasons || seasons.length === 0) return null

  return (
    <div className="relative group">
      {/* Left Gradient Fade & Button */}
      <div className="absolute left-0 top-0 bottom-6 w-16 bg-gradient-to-r from-background to-transparent z-10 flex items-center justify-start opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <button
          onClick={() => scroll('left')}
          className="w-8 h-8 rounded-full bg-surface/80 border border-border flex items-center justify-center text-foreground hover:bg-surface pointer-events-auto ml-1 shadow-md"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-6 snap-x snap-mandatory scroll-smooth hide-scrollbar"
      >
        {seasons.map((season: any) => (
          <Link
            key={season.id}
            href={`/title/${seriesId}/season/${season.season_number}`}
            className="flex flex-col gap-2 shrink-0 w-[120px] sm:w-[140px] snap-start"
          >
            <div className="aspect-[2/3] relative rounded-md overflow-hidden bg-surface-hover shadow-sm border border-border group/season">
              {season.poster_path ? (
                <Image
                  src={getImageUrl(season.poster_path, 'w185') || ''}
                  alt={season.name}
                  fill
                  sizes="150px"
                  className="object-cover group-hover/season:scale-105 subtle-transition"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs text-center p-2">
                  No Poster
                </div>
              )}
            </div>
            <div>
              <p className="font-medium text-sm leading-tight truncate hover:text-accent subtle-transition">{season.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {season.episode_count} Episode{season.episode_count !== 1 ? 's' : ''}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* Right Gradient Fade & Button */}
      <div className="absolute right-0 top-0 bottom-6 w-16 bg-gradient-to-l from-background to-transparent z-10 flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <button
          onClick={() => scroll('right')}
          className="w-8 h-8 rounded-full bg-surface/80 border border-border flex items-center justify-center text-foreground hover:bg-surface pointer-events-auto mr-1 shadow-md"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
