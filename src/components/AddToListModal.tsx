'use client'

import { useState } from 'react'
import { addToList, removeFromList } from '@/app/actions/lists'
import { ListPlus, X, Loader2, Check } from 'lucide-react'

interface AddToListModalProps {
  tmdbId: number
  allLists: any[]
  activeListIds: string[]
}

export default function AddToListModal({ tmdbId, allLists, activeListIds: initialActive }: AddToListModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeIds, setActiveIds] = useState<Set<string>>(new Set(initialActive))
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set())

  const toggleList = async (listId: string) => {
    if (loadingIds.has(listId)) return

    const isAdding = !activeIds.has(listId)
    
    const newActive = new Set(activeIds)
    if (isAdding) newActive.add(listId)
    else newActive.delete(listId)
    setActiveIds(newActive)

    const newLoading = new Set(loadingIds)
    newLoading.add(listId)
    setLoadingIds(newLoading)

    try {
      if (isAdding) {
        await addToList(listId, tmdbId)
      } else {
        await removeFromList(listId, tmdbId)
      }
    } catch (e) {
      setActiveIds(activeIds)
    } finally {
      const finalLoading = new Set(loadingIds)
      finalLoading.delete(listId)
      setLoadingIds(finalLoading)
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="w-full sm:w-auto sm:min-w-[140px] flex items-center justify-center gap-2 px-4 py-2 border border-border bg-surface hover:bg-surface-hover rounded-lg subtle-transition font-medium text-sm"
      >
        <ListPlus className="w-4 h-4" />
        Add to List
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface border border-border w-full max-w-sm rounded-xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="font-serif text-lg font-medium">Add to List</h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-full hover:bg-surface-hover text-muted-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-2 max-h-[60vh] overflow-y-auto hide-scrollbar">
              {allLists.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground text-sm">
                  You haven't created any lists yet.<br/>
                  Go to the Lists page to create one!
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {allLists.map((list) => {
                    const isActive = activeIds.has(list.$id)
                    const isLoading = loadingIds.has(list.$id)

                    return (
                      <button
                        key={list.$id}
                        onClick={() => toggleList(list.$id)}
                        disabled={isLoading}
                        className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-surface-hover subtle-transition text-left disabled:opacity-70"
                      >
                        <div className="flex flex-col gap-0.5 pr-4">
                          <span className={`text-sm font-medium ${isActive ? 'text-accent' : 'text-foreground'}`}>
                            {list.title}
                          </span>
                          {list.description && (
                            <span className="text-xs text-muted-foreground line-clamp-1">
                              {list.description}
                            </span>
                          )}
                        </div>
                        
                        <div className="shrink-0 w-5 h-5 flex items-center justify-center">
                          {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                          ) : isActive ? (
                            <Check className="w-5 h-5 text-accent" />
                          ) : null}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-border bg-surface-hover/50">
              <button 
                onClick={() => setIsOpen(false)}
                className="w-full py-2 bg-foreground text-background rounded-lg text-sm font-medium hover:bg-accent subtle-transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
