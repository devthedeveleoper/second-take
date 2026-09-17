'use client'

import { useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { getImageUrl, TMDBMovie } from '@/utils/tmdb'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function RecommendationsCarousel({ recommendations }: { recommendations: TMDBMovie[] }) {
  const scrollRef = useRef<HTMLDivElement>(null)

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -300 : 300
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  if (!recommendations || recommendations.length === 0) return null

  return (
    <div className="relative group">

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
        {recommendations.map((item: TMDBMovie) => (
          <Link 
            key={item.id} 
            href={`/title/${item.id}`}
            className="flex flex-col gap-2 shrink-0 w-[120px] sm:w-[140px] snap-start"
          >
            <div className="aspect-[2/3] relative rounded-md overflow-hidden bg-surface-hover shadow-sm border border-border group/rec">
              {item.poster_path ? (
                <Image
                  src={getImageUrl(item.poster_path, 'w185') || ''}
                  alt={item.title}
                  fill
                  sizes="150px"
                  className="object-cover group-hover/rec:scale-105 subtle-transition"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs text-center p-2">
                  No Poster
                </div>
              )}
            </div>
            <div>
              <p className="font-medium text-sm leading-tight truncate hover:text-accent subtle-transition">{item.title}</p>
              <p className="text-xs text-muted-foreground truncate">
                {item.release_date ? new Date(item.release_date).getFullYear() : ''}
              </p>
            </div>
          </Link>
        ))}
      </div>

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
