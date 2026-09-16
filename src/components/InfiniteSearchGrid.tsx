'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { getImageUrl, TMDBMovie } from '@/utils/tmdb'
import { fetchNextSearchPage } from '@/app/actions/search'
import { Loader2 } from 'lucide-react'

interface Props {
  query: string
  initialResults: TMDBMovie[]
  initialTotalPages: number
}

export default function InfiniteSearchGrid({ query, initialResults, initialTotalPages }: Props) {
  const [results, setResults] = useState<TMDBMovie[]>(initialResults)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(initialTotalPages)
  const [isLoading, setIsLoading] = useState(false)
  
  const loadMoreRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setResults(initialResults)
    setPage(1)
    setTotalPages(initialTotalPages)
  }, [query, initialResults, initialTotalPages])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && page < totalPages) {
          loadMore()
        }
      },
      { rootMargin: '400px' }
    )

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current)
    }

    return () => observer.disconnect()
  }, [isLoading, page, totalPages, query])

  const loadMore = async () => {
    setIsLoading(true)
    const nextPage = page + 1
    
    const res = await fetchNextSearchPage(query, nextPage)
    if (res.success && res.data) {
      setResults((prev) => [...prev, ...res.data!.results])
      setPage(nextPage)
      setTotalPages(res.data.total_pages)
    }
    
    setIsLoading(false)
  }

  if (results.length === 0) return null

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
        {results.map((movie, index) => (
          <Link 
            key={`${movie.id}-${index}`}
            href={`/title/${movie.id}`}
            className="flex flex-col gap-2 group cursor-pointer animate-in fade-in zoom-in-95 duration-500 fill-mode-both"
            style={{ animationDelay: `${(index % 20) * 20}ms` }}
          >
            <div className="relative aspect-[2/3] rounded-md overflow-hidden bg-surface-hover border border-border shadow-sm">
              {movie.poster_path ? (
                <Image
                  src={getImageUrl(movie.poster_path, 'w500') || ''}
                  alt={movie.title}
                  fill
                  sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 20vw"
                  className="object-cover group-hover:scale-105 subtle-transition"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs p-4 text-center">
                  No Poster
                </div>
              )}
            </div>
            <div>
              <h3 className="font-medium text-sm leading-tight group-hover:text-accent subtle-transition truncate">
                {movie.title}
              </h3>
              <p className="text-muted-foreground text-xs">
                {movie.release_date ? movie.release_date.split('-')[0] : 'Unknown'}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {page < totalPages && (
        <div ref={loadMoreRef} className="py-8 flex justify-center items-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  )
}
