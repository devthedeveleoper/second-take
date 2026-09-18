import { getPublicProfile } from '@/app/actions/profile'
import { checkFollowStatus } from '@/app/actions/social'
import { createSessionClient } from '@/utils/appwrite/server'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { User as UserIcon, Film, Tv, BookHeart } from 'lucide-react'
import DiaryEntryCard from '@/components/DiaryEntryCard'
import FollowButton from '@/components/FollowButton'
import RoastModal from '@/components/RoastModal'

export default async function PublicProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params
  
  const result = await getPublicProfile(username)
  if (!result.success || !result.data) {
    notFound()
  }

  const { profile, stats, recentLogs } = result.data

  let isSelf = false
  let isFollowing = false

  try {
    const { account } = await createSessionClient()
    const currentUser = await account.get()
    isSelf = currentUser.$id === profile.$id
    
    if (!isSelf) {
      const followRes = await checkFollowStatus(profile.$id)
      isFollowing = followRes.success ? followRes.data : false
    }
  } catch (e) {
  }

  const displayName = profile.username
  const displayBio = profile.bio || 'No bio provided.'

  return (
    <div className="flex flex-col gap-12 py-8 animate-in fade-in duration-500 max-w-4xl mx-auto w-full px-4 md:px-0">

      <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
        <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
          <div className="w-32 h-32 rounded-full bg-surface border border-border flex items-center justify-center shrink-0 overflow-hidden relative shadow-lg">
            {profile.avatar_url ? (
              <Image 
                src={profile.avatar_url} 
                alt={displayName} 
                fill 
                className="object-cover"
                sizes="128px"
                unoptimized
              />
            ) : (
              <UserIcon className="w-12 h-12 text-muted-foreground" />
            )}
          </div>
          
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-serif">{displayName}</h1>
            <p className="text-muted-foreground text-sm max-w-xl leading-relaxed">
              {displayBio}
            </p>
            <div className="text-xs text-muted-foreground mt-2">
              Joined {new Date(profile.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>

        <div className="shrink-0 w-full md:w-auto flex items-center gap-3">
          <RoastModal username={username} />
          <FollowButton 
            followingId={profile.$id} 
            initialStatus={isFollowing} 
            isSelf={isSelf} 
          />
        </div>
      </div>

      <hr className="border-border" />

      <div className="flex flex-col gap-6">
        <h2 className="text-2xl font-serif">Lifetime Cinema</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-surface border border-border rounded-xl p-6 shadow-sm flex flex-col gap-2">
            <BookHeart className="w-6 h-6 text-accent mb-2" />
            <p className="text-3xl font-medium">{stats.totalLogs}</p>
            <p className="text-sm text-muted-foreground">Total Logs</p>
          </div>
          
          <div className="bg-surface border border-border rounded-xl p-6 shadow-sm flex flex-col gap-2">
            <Film className="w-6 h-6 text-accent mb-2" />
            <p className="text-3xl font-medium">{stats.uniqueTitles}</p>
            <p className="text-sm text-muted-foreground">Unique Titles</p>
          </div>

          <div className="bg-surface border border-border rounded-xl p-6 shadow-sm flex flex-col gap-2">
            <Tv className="w-6 h-6 text-accent mb-2" />
            <p className="text-3xl font-medium">{stats.episodesWatched}</p>
            <p className="text-sm text-muted-foreground">Episodes Watched</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <h2 className="text-2xl font-serif border-b border-border pb-4">Recent Logs</h2>
        
        {recentLogs.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground border border-dashed border-border rounded-xl bg-surface/50">
            {displayName} hasn't logged any films yet.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {recentLogs.map((entry: any) => (
              <DiaryEntryCard key={entry.$id} entry={entry} tmdbId={entry.movie.$id} />
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
