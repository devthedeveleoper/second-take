export const dynamic = 'force-dynamic';
import { getFeed } from '@/app/actions/social'
import FeedEntryCard from '@/components/FeedEntryCard'
import { Users, Camera } from 'lucide-react'
import Link from 'next/link'

export default async function FeedPage() {
  const result = await getFeed()
  const entries = result.success ? result.data : []

  return (
    <div className="flex flex-col gap-8 py-8 animate-in fade-in duration-500 max-w-3xl mx-auto w-full">
      
      <div className="flex flex-col gap-2 border-b border-border pb-8">
        <h1 className="text-3xl font-serif">Journal Feed</h1>
        <p className="text-muted-foreground text-sm">
          Chronological logs from the cinephiles you follow.
        </p>
      </div>

      {entries.length === 0 ? (
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
      ) : (
        <div className="flex flex-col gap-6">
          {entries.map((entry: any) => (
            <FeedEntryCard key={entry.$id} entry={entry} />
          ))}
        </div>
      )}

    </div>
  )
}
