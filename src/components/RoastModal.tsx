'use client'

import { useState, useTransition } from 'react'
import { generateRoast } from '@/app/actions/ai'
import { X, Sparkles, Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

export default function RoastModal({ username }: { username?: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const [roast, setRoast] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleRoast = () => {
    setIsOpen(true)
    if (roast) return // Already roasted
    
    setError(null)
    startTransition(async () => {
      const res = await generateRoast(username)
      if (res.success) {
        setRoast(res.data || null)
      } else {
        setError(res.error || 'Failed to generate roast.')
      }
    })
  }

  return (
    <>
      <button 
        onClick={handleRoast}
        className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground font-medium rounded-full text-sm hover:opacity-90 subtle-transition shadow-lg shadow-accent/20"
      >
        <Sparkles className="w-4 h-4" />
        Roast My Taste
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface border border-border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-serif text-xl flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" />
                The Verdict
              </h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-surface-hover rounded-full subtle-transition text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {isPending ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4 text-muted-foreground">
                  <Loader2 className="w-8 h-8 animate-spin text-accent" />
                  <p className="animate-pulse">Judging your life choices...</p>
                </div>
              ) : error ? (
                <div className="text-red-500 text-center py-8">
                  {error}
                </div>
              ) : roast ? (
                <div className="prose prose-invert prose-p:leading-relaxed prose-a:text-accent prose-headings:font-serif max-w-none">
                  <ReactMarkdown>{roast}</ReactMarkdown>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
