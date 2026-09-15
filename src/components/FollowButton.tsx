'use client'

import { useState } from 'react'
import { followUser, unfollowUser } from '@/app/actions/social'
import { UserPlus, UserMinus, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface FollowButtonProps {
  followingId: string
  initialStatus: boolean
  isSelf: boolean
}

export default function FollowButton({ followingId, initialStatus, isSelf }: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialStatus)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  if (isSelf) {
    return (
      <button 
        onClick={() => router.push('/profile')}
        className="px-6 py-2 bg-surface hover:bg-surface-hover border border-border rounded-lg subtle-transition font-medium text-sm"
      >
        Edit Profile
      </button>
    )
  }

  const toggleFollow = async () => {
    setIsLoading(true)
    const newStatus = !isFollowing
    
    // Optimistic UI
    setIsFollowing(newStatus)
    
    try {
      if (newStatus) {
        await followUser(followingId)
      } else {
        await unfollowUser(followingId)
      }
    } catch (error) {
      // Revert on failure
      setIsFollowing(!newStatus)
      alert("Failed to follow/unfollow user.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <button
      onClick={toggleFollow}
      disabled={isLoading}
      className={`flex items-center justify-center gap-2 px-6 py-2 rounded-lg subtle-transition font-medium text-sm disabled:opacity-70 ${
        isFollowing 
          ? 'bg-surface hover:bg-surface-hover border border-border text-foreground'
          : 'bg-foreground text-background hover:bg-accent hover:border-accent border border-transparent'
      }`}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isFollowing ? (
        <>
          <UserMinus className="w-4 h-4" />
          Unfollow
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4" />
          Follow
        </>
      )}
    </button>
  )
}
