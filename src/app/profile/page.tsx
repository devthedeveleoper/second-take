import { createSessionClient } from '@/utils/appwrite/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { LogOut, User as UserIcon, Film, Tv, BookHeart } from 'lucide-react'
import Image from 'next/image'
import { getProfile } from '@/app/actions/profile'
import { getDiaryStats } from '@/app/actions/diary'
import EditProfileForm from '@/components/EditProfileForm'
import ProfileCharts from '@/components/ProfileCharts'
import RoastModal from '@/components/RoastModal'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export default async function ProfilePage() {
  let user = null
  
  try {
    const { account } = await createSessionClient()
    user = await account.get()
  } catch (err) {
    redirect('/login')
  }

  const [profile, stats] = await Promise.all([
    getProfile(),
    getDiaryStats()
  ])

  const logout = async () => {
    'use server'
    try {
      const { account } = await createSessionClient()
      await account.deleteSession('current')
    } catch (e) {}
    
    const cookieStore = await cookies()
    cookieStore.delete('appwrite-session')
    redirect('/login')
  }

  const displayName = profile?.username || user.name || 'Cinephile'
  const displayBio = profile?.bio || 'No bio yet.'
  
  return (
    <div className="flex flex-col gap-12 py-8 animate-in fade-in duration-500 max-w-4xl mx-auto w-full px-4 md:px-0">

      <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
        <div className="w-32 h-32 rounded-full bg-surface border border-border flex items-center justify-center shrink-0 overflow-hidden relative shadow-lg">
          {profile?.avatar_url ? (
            <Image 
              src={profile.avatar_url} 
              alt={displayName} 
              fill 
              className="object-cover"
              sizes="128px"
            />
          ) : (
            <UserIcon className="w-12 h-12 text-muted-foreground" />
          )}
        </div>
        
        <div className="flex flex-col flex-1 gap-2">
          <h1 className="text-4xl font-serif">{displayName}</h1>
          <p className="text-muted-foreground text-sm max-w-xl leading-relaxed">
            {displayBio}
          </p>
          <div className="text-xs text-muted-foreground mt-2">
            Joined {new Date(user.$createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
          </div>
        </div>

        <div className="shrink-0 w-full md:w-auto flex items-center gap-3">
          <RoastModal username={profile?.username} />
          <form action={logout}>
            <button className="flex items-center justify-center gap-2 w-full md:w-auto px-6 py-2 border border-red-500/20 text-red-500 hover:bg-red-500/10 rounded-lg subtle-transition font-medium text-sm">
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </form>
        </div>
      </div>

      <hr className="border-border" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

        <div className="md:col-span-1 flex flex-col gap-6">
          <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
            <h3 className="font-serif text-xl mb-4">Account</h3>
            <p className="text-sm text-muted-foreground mb-1">Email</p>
            <p className="text-sm font-medium mb-4">{user.email}</p>
            
            <p className="text-sm text-muted-foreground mb-1">Account ID</p>
            <p className="text-xs font-mono mb-4 text-foreground/80 break-all">{user.$id}</p>

            <EditProfileForm profile={profile} defaultName={user.name} />
          </div>
        </div>

        <div className="md:col-span-2 flex flex-col gap-6">
          <h2 className="text-2xl font-serif">Your Lifetime Cinema</h2>
          
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

          {stats.ratingsDistribution && stats.monthlyActivity && (
            <ProfileCharts 
              ratingsDistribution={stats.ratingsDistribution} 
              monthlyActivity={stats.monthlyActivity} 
            />
          )}
        </div>

      </div>
    </div>
  )
}
