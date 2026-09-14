import { Star } from 'lucide-react'

interface MonthlyActivity {
  month: string
  count: number
}

interface ProfileChartsProps {
  ratingsDistribution: number[] // [1-star, 2-star, 3-star, 4-star, 5-star]
  monthlyActivity: MonthlyActivity[]
}

export default function ProfileCharts({ ratingsDistribution, monthlyActivity }: ProfileChartsProps) {
  const maxRatingCount = Math.max(...ratingsDistribution, 1) // Prevent division by zero
  const maxActivityCount = Math.max(...monthlyActivity.map(m => m.count), 1)

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
      
      {/* Ratings Distribution */}
      <div className="bg-surface border border-border rounded-xl p-6 shadow-sm flex flex-col gap-4">
        <h3 className="font-serif text-lg">Ratings Distribution</h3>
        <div className="flex items-end justify-between h-32 gap-2 mt-auto">
          {ratingsDistribution.map((count, index) => {
            const star = index + 1
            const heightPercent = (count / maxRatingCount) * 100
            return (
              <div key={star} className="flex flex-col items-center gap-2 flex-1 group">
                <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                  {count}
                </span>
                <div className="w-full bg-surface-hover rounded-t-md relative flex items-end justify-center h-full">
                  <div 
                    className="w-full bg-accent/80 rounded-t-sm transition-all duration-700" 
                    style={{ height: `${heightPercent}%` }} 
                  />
                </div>
                <div className="flex items-center text-xs text-muted-foreground gap-0.5">
                  {star}<Star className="w-3 h-3 fill-current" />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Monthly Activity */}
      <div className="bg-surface border border-border rounded-xl p-6 shadow-sm flex flex-col gap-4">
        <h3 className="font-serif text-lg">Activity (Last 6 Months)</h3>
        <div className="flex items-end justify-between h-32 gap-2 mt-auto">
          {[...monthlyActivity].reverse().map((data) => {
            const heightPercent = (data.count / maxActivityCount) * 100
            return (
              <div key={data.month} className="flex flex-col items-center gap-2 flex-1 group">
                <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                  {data.count}
                </span>
                <div className="w-full bg-surface-hover rounded-t-md relative flex items-end justify-center h-full">
                  <div 
                    className="w-full bg-accent/60 rounded-t-sm transition-all duration-700" 
                    style={{ height: `${heightPercent}%` }} 
                  />
                </div>
                <span className="text-xs text-muted-foreground">{data.month}</span>
              </div>
            )
          })}
        </div>
      </div>

    </div>
  )
}
