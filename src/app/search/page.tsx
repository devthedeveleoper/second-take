import { searchMovies } from '@/utils/tmdb'
import { Search as SearchIcon } from 'lucide-react'
import InfiniteSearchGrid from '@/components/InfiniteSearchGrid'

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const q = typeof params.q === 'string' ? params.q : ''
  
  let results: any[] = []
  let totalPages = 0
  let errorMsg = ''
  
  try {
    if (q) {
      const data = await searchMovies(q)
      results = data.results
      totalPages = data.total_pages
    }
  } catch (err: any) {
    errorMsg = err?.message || String(err)
  }

  return (
    <div className="flex flex-col gap-8 py-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2 border-b border-border pb-8">
        <h1 className="text-3xl font-serif">Search</h1>
        <p className="text-muted-foreground text-sm">Find films to add to your cinema.</p>
      </div>

      <form className="relative flex items-center" method="GET" action="/search">
        <SearchIcon className="absolute left-3 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Titles, directors, keywords..."
          className="w-full bg-surface-hover border border-border rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:border-accent subtle-transition text-foreground placeholder:text-muted-foreground"
          autoFocus
        />
      </form>

      {errorMsg && (
        <div className="py-6 text-center text-red-500 border border-red-500/20 bg-red-500/10 rounded-lg">
          {errorMsg}
        </div>
      )}

      {q && !errorMsg && results.length === 0 && (
        <div className="py-12 text-center text-muted-foreground">
          No films found for "{q}".
        </div>
      )}

      {results.length > 0 && (
        <InfiniteSearchGrid 
          key={q}
          query={q} 
          initialResults={results} 
          initialTotalPages={totalPages} 
        />
      )}
    </div>
  )
}
