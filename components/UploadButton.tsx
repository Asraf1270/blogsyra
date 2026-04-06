'use client'

import { useDropzone } from '@uploadthing/react'
import { generateClientDropzoneAccept } from 'uploadthing/client'
import { useUploadThing } from '@/lib/uploadthing.client' // Changed to client version
import { Button } from '@/components/ui/button'
import { Loader2, Upload, X } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'

interface UploadButtonProps {
  onUploadComplete: (url: string) => void
  endpoint: 'coverImage' | 'postImage' | 'avatarImage' | 'adminImage'
  maxFiles?: number
  existingImage?: string
}

export function UploadButton({ 
  onUploadComplete, 
  endpoint, 
  maxFiles = 1,
  existingImage 
}: UploadButtonProps) {
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>(existingImage ? [existingImage] : [])
  
  const { startUpload, isUploading, permittedFileInfo } = useUploadThing(endpoint, {
    onClientUploadComplete: (res) => {
      res?.forEach((file) => {
        onUploadComplete(file.url)
      })
      setFiles([])
      setPreviews(res?.map(file => file.url) || [])
    },
    onUploadError: (error) => {
      console.error('Upload error:', error)
      alert('Upload failed. Please try again.')
    },
  })

  const { getRootProps, getInputProps } = useDropzone({
    onDrop: (acceptedFiles) => {
      setFiles(acceptedFiles)
      const newPreviews = acceptedFiles.map(file => URL.createObjectURL(file))
      setPreviews(prev => [...prev, ...newPreviews])
      startUpload(acceptedFiles)
    },
    accept: permittedFileInfo?.config ? generateClientDropzoneAccept(permittedFileInfo.config) : undefined,
    maxFiles,
  })

  const removeImage = (index: number) => {
    setPreviews(prev => prev.filter((_, i) => i !== index))
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          Drag & drop or click to upload
        </p>
        <p className="text-xs text-muted-foreground">
          {permittedFileInfo?.config?.image?.maxFileSize} max file size
        </p>
      </div>

      {isUploading && (
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Uploading...</span>
        </div>
      )}

      {previews.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mt-4">
          {previews.map((preview, index) => (
            <div key={index} className="relative group">
              <Image
                src={preview}
                alt={`Preview ${index + 1}`}
                width={200}
                height={200}
                className="rounded-lg object-cover"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeImage(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}