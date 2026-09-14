'use client'

import { useState } from 'react'
import { createList } from '@/app/actions/lists'
import { Plus, X, Loader2 } from 'lucide-react'

export default function CreateListButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isPublic, setIsPublic] = useState(true)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setIsLoading(true)
    const res = await createList(title, description, isPublic)
    setIsLoading(false)

    if (res.success) {
      setIsOpen(false)
      setTitle('')
      setDescription('')
      setIsPublic(true)
    } else {
      alert(res.error || 'Failed to create list')
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2 bg-foreground text-background hover:bg-accent rounded-lg subtle-transition font-medium text-sm shadow-sm"
      >
        <Plus className="w-4 h-4" />
        Create List
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface border border-border w-full max-w-md rounded-xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-serif text-lg font-medium">Create a New List</h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full hover:bg-surface-hover text-muted-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">List Title</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. A24 Masterpieces"
                  className="w-full bg-surface-hover border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent subtle-transition"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Description (Optional)</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What is this list about?"
                  rows={3}
                  className="w-full bg-surface-hover border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent subtle-transition resize-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="is_public"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="rounded border-border text-accent focus:ring-accent"
                />
                <label htmlFor="is_public" className="text-sm cursor-pointer">
                  Make this list public
                </label>
              </div>

              <div className="flex justify-end gap-3 mt-4">
                <button 
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 text-sm font-medium rounded-lg hover:bg-surface-hover subtle-transition"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isLoading || !title.trim()}
                  className="flex items-center justify-center min-w-[100px] px-4 py-2 bg-foreground text-background hover:bg-accent rounded-lg subtle-transition text-sm font-medium disabled:opacity-50"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
