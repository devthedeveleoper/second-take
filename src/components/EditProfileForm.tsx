'use client'

import { useState, useTransition } from 'react'
import { updateProfile } from '@/app/actions/profile'
import { Pencil, Check, X, Loader2 } from 'lucide-react'

export default function EditProfileForm({ profile, defaultName }: { profile: any, defaultName: string }) {
  const [isEditing, setIsEditing] = useState(false)
  const [isPending, startTransition] = useTransition()

  async function handleAction(formData: FormData) {
    startTransition(async () => {
      await updateProfile(formData)
      setIsEditing(false)
    })
  }

  if (!isEditing) {
    return (
      <button 
        onClick={() => setIsEditing(true)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground subtle-transition"
      >
        <Pencil className="w-4 h-4" />
        Edit Profile
      </button>
    )
  }

  return (
    <form action={handleAction} className="flex flex-col gap-4 w-full mt-4 bg-surface-hover p-4 rounded-xl border border-border">
      <div className="flex flex-col gap-1">
        <label htmlFor="username" className="text-sm text-muted-foreground">Username</label>
        <input 
          type="text" 
          id="username" 
          name="username" 
          defaultValue={profile?.username || defaultName} 
          className="bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent"
          placeholder="Cinephile"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="bio" className="text-sm text-muted-foreground">Bio</label>
        <textarea 
          id="bio" 
          name="bio" 
          defaultValue={profile?.bio || ''} 
          className="bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent min-h-[80px] resize-y"
          placeholder="I love watching obscure 70s sci-fi..."
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="avatar_file" className="text-sm text-muted-foreground">Upload Avatar (Optional)</label>
        <input 
          type="file" 
          id="avatar_file" 
          name="avatar_file" 
          accept="image/*"
          className="bg-surface border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:border-accent file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-accent/10 file:text-accent hover:file:bg-accent/20 cursor-pointer"
        />
        <input type="hidden" name="avatar_url" value={profile?.avatar_url || ''} />
      </div>

      <div className="flex justify-end gap-2 mt-2">
        <button 
          type="button" 
          onClick={() => setIsEditing(false)}
          className="px-4 py-2 text-sm text-muted-foreground hover:bg-surface rounded-md subtle-transition"
          disabled={isPending}
        >
          Cancel
        </button>
        <button 
          type="submit" 
          disabled={isPending}
          className="flex items-center justify-center min-w-[80px] px-4 py-2 bg-accent text-background font-medium rounded-md hover:bg-accent/90 subtle-transition disabled:opacity-50"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
        </button>
      </div>
    </form>
  )
}
