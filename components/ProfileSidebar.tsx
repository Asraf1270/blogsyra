'use client'

import { format } from 'date-fns'
import { Calendar, FileText, Heart, MessageCircle, UserPlus, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth } from '@clerk/nextjs'
import { useToast } from '@/components/ui/use-toast'
import { followUser, unfollowUser, checkFollowStatus } from '@/lib/actions/follow-actions'
import { useEffect, useState } from 'react'

interface ProfileSidebarProps {
  profile: {
    id: string
    name: string
    bio: string | null
    avatarUrl: string | null
    createdAt: Date
    clerkId: string
    _count?: {
      followers: number
      following: number
    }
  }
  totalPosts: number
  isOwner: boolean
}

export function ProfileSidebar({ profile, totalPosts, isOwner }: ProfileSidebarProps) {
  const { userId } = useAuth()
  const { toast } = useToast()
  const [isFollowing, setIsFollowing] = useState(false)
  const [followersCount, setFollowersCount] = useState(profile._count?.followers || 0)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!userId || isOwner) return

    const checkFollow = async () => {
      const result = await checkFollowStatus(profile.clerkId)
      if (result.success) {
        setIsFollowing(result.data.isFollowing)
      }
    }
    checkFollow()
  }, [userId, profile.clerkId, isOwner])

  const handleFollowToggle = async () => {
    if (!userId) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to follow users',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)
    
    if (isFollowing) {
      const result = await unfollowUser(profile.clerkId)
      if (result.success) {
        setIsFollowing(false)
        setFollowersCount(prev => prev - 1)
        toast({
          title: 'Unfollowed',
          description: `You are no longer following ${profile.name}`,
        })
      } else {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        })
      }
    } else {
      const result = await followUser(profile.clerkId)
      if (result.success) {
        setIsFollowing(true)
        setFollowersCount(prev => prev + 1)
        toast({
          title: 'Following',
          description: `You are now following ${profile.name}`,
        })
      } else {
        toast({
          title: 'Error',
          description: result.error,
          variant: 'destructive',
        })
      }
    }
    
    setIsLoading(false)
  }

  const joinDate = format(new Date(profile.createdAt), 'MMMM yyyy')

  return (
    <div className="space-y-6">
      {/* Stats Card */}
      <Card>
        <CardHeader>
          <CardTitle>Statistics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span className="text-sm">Total Posts</span>
            </div>
            <span className="font-semibold">{totalPosts}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span className="text-sm">Followers</span>
            </div>
            <span className="font-semibold">{followersCount}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <UserPlus className="h-4 w-4" />
              <span className="text-sm">Following</span>
            </div>
            <span className="font-semibold">{profile._count?.following || 0}</span>
          </div>
        </CardContent>
      </Card>
      
      {/* Join Date Card */}
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">Joined {joinDate}</span>
          </div>
        </CardContent>
      </Card>
      
      {/* Follow Button (if not owner) */}
      {!isOwner && userId && (
        <Button
          onClick={handleFollowToggle}
          disabled={isLoading}
          variant={isFollowing ? 'outline' : 'default'}
          className="w-full"
        >
          {isFollowing ? 'Unfollow' : 'Follow'}
        </Button>
      )}
    </div>
  )
}