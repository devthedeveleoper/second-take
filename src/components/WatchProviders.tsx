import Image from 'next/image'
import Link from 'next/link'
import { getImageUrl, TMDBWatchProviders } from '@/utils/tmdb'

export default function WatchProviders({ providers }: { providers: Record<string, TMDBWatchProviders> | undefined }) {
  if (!providers) return null

  // Prefer IN, then just pick the first available
  const region = providers['IN'] || Object.values(providers)[0]

  if (!region) return null

  const hasStream = region.flatrate && region.flatrate.length > 0
  const hasRent = region.rent && region.rent.length > 0
  const hasBuy = region.buy && region.buy.length > 0

  if (!hasStream && !hasRent && !hasBuy) return null

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Where to Watch</h3>
        {region.link && (
          <Link 
            href={region.link} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-xs text-accent hover:underline"
          >
            Powered by JustWatch
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {hasStream && region.flatrate?.map((provider) => (
          <Link 
            key={provider.provider_id} 
            href={region.link || '#'} 
            target="_blank" 
            rel="noopener noreferrer"
            className="relative w-10 h-10 rounded-md overflow-hidden shadow-sm hover:scale-110 subtle-transition" 
            title={`Stream on ${provider.provider_name}`}
          >
            <Image 
              src={getImageUrl(provider.logo_path, 'w185') || ''} 
              alt={provider.provider_name}
              fill
              sizes="40px"
              className="object-cover"
            />
          </Link>
        ))}

        {!hasStream && hasRent && region.rent?.map((provider) => (
          <Link 
            key={provider.provider_id} 
            href={region.link || '#'} 
            target="_blank" 
            rel="noopener noreferrer"
            className="relative w-10 h-10 rounded-md overflow-hidden shadow-sm hover:scale-110 subtle-transition" 
            title={`Rent on ${provider.provider_name}`}
          >
            <Image 
              src={getImageUrl(provider.logo_path, 'w185') || ''} 
              alt={provider.provider_name}
              fill
              sizes="40px"
              className="object-cover grayscale hover:grayscale-0 transition-all duration-300"
            />
          </Link>
        ))}
        
        {!hasStream && !hasRent && hasBuy && region.buy?.map((provider) => (
          <Link 
            key={provider.provider_id} 
            href={region.link || '#'} 
            target="_blank" 
            rel="noopener noreferrer"
            className="relative w-10 h-10 rounded-md overflow-hidden shadow-sm hover:scale-110 subtle-transition" 
            title={`Buy on ${provider.provider_name}`}
          >
            <Image 
              src={getImageUrl(provider.logo_path, 'w185') || ''} 
              alt={provider.provider_name}
              fill
              sizes="40px"
              className="object-cover grayscale hover:grayscale-0 transition-all duration-300"
            />
          </Link>
        ))}
      </div>
    </div>
  )
}
