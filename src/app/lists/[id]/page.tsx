import { getListDetails } from '@/app/actions/lists'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { getImageUrl } from '@/utils/tmdb'
import { Film, Calendar, ArrowLeft } from 'lucide-react'

export default async function ListDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  
  const result = await getListDetails(id)
  
  if (!result.success || !result.data) {
    notFound()
  }

  const { list, items } = result.data

  return (
    <div className="flex flex-col gap-8 py-8 animate-in fade-in duration-500">
      
      <div className="flex flex-col gap-4">
        <Link href="/lists" className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1 w-fit subtle-transition">
          <ArrowLeft className="w-4 h-4" />
          Back to Lists
        </Link>
        
        <div className="flex flex-col gap-2 border-b border-border pb-8">
          <h1 className="text-4xl font-serif">{list.title}</h1>
          {list.description && (
            <p className="text-muted-foreground text-base max-w-2xl leading-relaxed">
              {list.description}
            </p>
          )}
          <div className="flex items-center gap-4 text-xs text-muted-foreground mt-4 font-medium uppercase tracking-wider">
            <span>{items.length} Titles</span>
            <span>&bull;</span>
            <span>{list.is_public ? 'Public' : 'Private'}</span>
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="py-24 flex flex-col items-center justify-center text-center gap-4 text-muted-foreground border border-dashed border-border rounded-xl bg-surface/50">
          <Film className="w-12 h-12 opacity-20" />
          <p>This list is empty. Go find some films to add!</p>
          <Link href="/search" className="text-accent hover:underline">Search for titles</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {items.map((movie: any, index: number) => (
            <Link 
              key={movie.item_id}
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
                <p className="text-muted-foreground text-xs flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3 h-3" />
                  {movie.release_date ? movie.release_date.split('-')[0] : 'Unknown'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
