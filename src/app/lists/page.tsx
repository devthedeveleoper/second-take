export const dynamic = 'force-dynamic';
import { getMyLists } from '@/app/actions/lists'
import Link from 'next/link'
import { Plus, List as ListIcon } from 'lucide-react'
import CreateListButton from '@/components/CreateListButton'

export default async function ListsPage() {
  const result = await getMyLists()
  const lists = result.success ? result.data : []

  return (
    <div className="flex flex-col gap-8 py-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end border-b border-border pb-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-serif">Your Lists</h1>
          <p className="text-muted-foreground text-sm max-w-xl">
            Curate your own collections of cinema. Build watchlists for friends, or catalog your favorites.
          </p>
        </div>
        <CreateListButton />
      </div>

      {(!lists || lists.length === 0) ? (
        <div className="py-24 flex flex-col items-center justify-center text-center gap-4 text-muted-foreground border border-dashed border-border rounded-xl bg-surface/50">
          <ListIcon className="w-12 h-12 opacity-20" />
          <p>You haven't created any lists yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {lists.map((list: any, index: number) => (
            <Link 
              key={list.$id} 
              href={`/lists/${list.$id}`}
              className="group bg-surface hover:bg-surface-hover border border-border rounded-xl p-6 shadow-sm subtle-transition flex flex-col gap-3 h-full animate-in fade-in zoom-in-95 duration-500 fill-mode-both"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <h2 className="font-serif text-xl font-medium group-hover:text-accent subtle-transition truncate">
                {list.title}
              </h2>
              {list.description && (
                <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed">
                  {list.description}
                </p>
              )}
              <div className="mt-auto pt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  {list.is_public ? 'Public' : 'Private'}
                </span>
                <span>
                  {new Date(list.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
