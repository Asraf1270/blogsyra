'use client'

import { UploadButton } from './UploadButton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface CoverImageUploadProps {
  value?: string
  onChange: (url: string) => void
}

export function CoverImageUpload({ value, onChange }: CoverImageUploadProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Cover Image</CardTitle>
        <CardDescription>
          Upload a cover image for your post. Recommended size: 1200x630px
        </CardDescription>
      </CardHeader>
      <CardContent>
        <UploadButton
          endpoint="coverImage"
          onUploadComplete={onChange}
          existingImage={value}
        />
      </CardContent>
    </Card>
  )
}