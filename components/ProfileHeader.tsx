'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Camera, Edit2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { updateUserProfile } from '@/lib/actions/user-actions'
import { UploadButton } from '@/components/UploadButton'

interface ProfileHeaderProps {
  profile: {
    id: string
    name: string
    bio: string | null
    avatarUrl: string | null
    createdAt: Date
    clerkId: string
  }
  isOwner: boolean
  clerkId: string
}

export function ProfileHeader({ profile, isOwner, clerkId }: ProfileHeaderProps) {
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(profile.name)
  const [bio, setBio] = useState(profile.bio || '')
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl)
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async () => {
    setIsLoading(true)
    const result = await updateUserProfile({
      name,
      bio: bio || null,
      avatarUrl: avatarUrl || null,
    })
    
    if (result.success) {
      toast({
        title: 'Profile updated',
        description: 'Your profile has been successfully updated.',
      })
      setIsEditing(false)
      window.location.reload()
    } else {
      toast({
        title: 'Error',
        description: result.error,
        variant: 'destructive',
      })
    }
    setIsLoading(false)
  }

  return (
    <div className="relative">
      {/* Cover Image */}
      <div className="h-32 md:h-48 bg-gradient-to-r from-primary/20 to-primary/5 rounded-2xl" />
      
      {/* Avatar Section */}
      <div className="flex flex-col md:flex-row items-center md:items-end gap-4 px-4 md:px-8 -mt-12 md:-mt-16">
        <div className="relative">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-background bg-background overflow-hidden">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={profile.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <span className="text-3xl md:text-4xl font-bold text-white">
                  {profile.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          
          {isOwner && isEditing && (
            <div className="absolute -bottom-2 -right-2">
              <UploadButton
                endpoint="avatarImage"
                onUploadComplete={(url) => {
                  setAvatarUrl(url)
                  toast({
                    title: 'Avatar uploaded',
                    description: 'Your new avatar has been uploaded.',
                  })
                }}
              />
            </div>
          )}
        </div>
        
        <div className="flex-1 text-center md:text-left">
          <div className="flex items-center gap-3 justify-center md:justify-start">
            <h1 className="text-2xl md:text-3xl font-bold">{profile.name}</h1>
            {isOwner && !isEditing && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsEditing(true)}
                className="h-8 w-8"
              >
                <Edit2 className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {isEditing ? (
            <div className="mt-4 space-y-3 max-w-md mx-auto md:mx-0">
              <div>
                <Label htmlFor="edit-name">Display Name</Label>
                <Input
                  id="edit-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div>
                <Label htmlFor="edit-bio">Bio</Label>
                <Textarea
                  id="edit-bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell us about yourself..."
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {bio.length}/500 characters
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button variant="ghost" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            profile.bio && (
              <p className="text-muted-foreground mt-2 max-w-md mx-auto md:mx-0">
                {profile.bio}
              </p>
            )
          )}
        </div>
      </div>
    </div>
  )
}