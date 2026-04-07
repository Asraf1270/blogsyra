'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Tag {
  id: string
  name: string
  slug: string
}

interface TagMultiSelectProps {
  value: string[]
  onChange: (values: string[]) => void
}

export function TagMultiSelect({ value, onChange }: TagMultiSelectProps) {
  const [tags, setTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTag, setSelectedTag] = useState<string>()

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await fetch('/api/tags')
        const data = await response.json()
        setTags(data)
      } catch (error) {
        console.error('Error fetching tags:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTags()
  }, [])

  const addTag = () => {
    if (selectedTag && !value.includes(selectedTag)) {
      onChange([...value, selectedTag])
      setSelectedTag(undefined)
    }
  }

  const removeTag = (tagId: string) => {
    onChange(value.filter(id => id !== tagId))
  }

  const selectedTagObjects = tags.filter(tag => value.includes(tag.id))

  if (loading) {
    return <div className="h-10 bg-muted animate-pulse rounded" />
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Select value={selectedTag} onValueChange={setSelectedTag}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select tags..." />
          </SelectTrigger>
          <SelectContent>
            {tags
              .filter(tag => !value.includes(tag.id))
              .map((tag) => (
                <SelectItem key={tag.id} value={tag.id}>
                  {tag.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <button
          type="button"
          onClick={addTag}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
        >
          Add
        </button>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {selectedTagObjects.map((tag) => (
          <Badge key={tag.id} variant="secondary" className="gap-1">
            {tag.name}
            <button
              type="button"
              onClick={() => removeTag(tag.id)}
              className="ml-1 hover:text-destructive"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  )
}