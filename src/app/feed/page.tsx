export const dynamic = 'force-dynamic';
import { getFeed, getSuggestedUsers } from '@/app/actions/social'
import FeedEntryCard from '@/components/FeedEntryCard'
import { Users, Camera, User as UserIcon } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default async function FeedPage() {
  const [feedResult, suggestionsResult] = await Promise.all([
    getFeed(),
    getSuggestedUsers()
  ])
  
  const entries = feedResult.success ? feedResult.data : []
  const suggestions = suggestionsResult.success ? suggestionsResult.data : []

  return (
    <div className="flex flex-col gap-8 py-8 animate-in fade-in duration-500 max-w-3xl mx-auto w-full">
      
      <div className="flex flex-col gap-2 border-b border-border pb-8">
        <h1 className="text-3xl font-serif">Journal Feed</h1>
        <p className="text-muted-foreground text-sm">
          Chronological logs from the cinephiles you follow.
        </p>
      </div>

      {entries.length === 0 ? (
        <div className="flex flex-col gap-12">
          <div className="py-24 flex flex-col items-center justify-center text-center gap-4 text-muted-foreground border border-dashed border-border rounded-xl bg-surface/50">
            <Users className="w-12 h-12 opacity-20" />
            <p className="max-w-md">Your feed is empty. Follow some users to see their cinema journal here.</p>
            <Link 
              href="/search" 
              className="flex items-center gap-2 mt-4 px-6 py-2 bg-foreground text-background hover:bg-accent rounded-lg subtle-transition font-medium text-sm shadow-sm"
            >
              <Camera className="w-4 h-4" />
              Discover Titles
            </Link>
          </div>

          {suggestions.length > 0 && (
            <div className="flex flex-col gap-6">
              <h2 className="text-2xl font-serif">Suggested Cinephiles</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {suggestions.map((user: any) => (
                  <Link 
                    key={user.$id} 
                    href={`/u/${user.username}`}
                    className="flex items-center gap-4 p-4 bg-surface border border-border rounded-xl hover:border-accent subtle-transition group"
                  >
                    <div className="w-12 h-12 rounded-full bg-background border border-border flex items-center justify-center shrink-0 overflow-hidden relative">
                      {user.avatar_url ? (
                        <Image 
                          src={user.avatar_url} 
                          alt={user.username} 
                          fill 
                          className="object-cover"
                          sizes="48px"
                          unoptimized
                        />
                      ) : (
                        <UserIcon className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium group-hover:text-accent subtle-transition">{user.username}</span>
                      {user.bio && (
                        <span className="text-xs text-muted-foreground line-clamp-1">{user.bio}</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {suggestions.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-serif mb-4">Discover More Cinephiles</h2>
              <div className="flex overflow-x-auto pb-4 gap-4 scrollbar-hide">
                {suggestions.map((user: any) => (
                  <Link 
                    key={user.$id} 
                    href={`/u/${user.username}`}
                    className="flex items-center gap-3 p-3 min-w-[200px] bg-surface border border-border rounded-xl hover:border-accent subtle-transition group"
                  >
                    <div className="w-10 h-10 rounded-full bg-background border border-border flex items-center justify-center shrink-0 overflow-hidden relative">
                      {user.avatar_url ? (
                        <Image 
                          src={user.avatar_url} 
                          alt={user.username} 
                          fill 
                          className="object-cover"
                          sizes="40px"
                          unoptimized
                        />
                      ) : (
                        <UserIcon className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <span className="font-medium text-sm group-hover:text-accent subtle-transition truncate">{user.username}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
          
          {entries.map((entry: any) => (
            <FeedEntryCard key={entry.$id} entry={entry} />
          ))}
        </div>
      )}

    </div>
  )
}
