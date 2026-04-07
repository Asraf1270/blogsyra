'use client'

import { FieldError, UseFormRegisterReturn } from 'react-hook-form'
import { TiptapEditor } from './TiptapEditor'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface EditorFieldProps {
  label?: string
  value: any
  onChange: (value: any) => void
  error?: FieldError
  placeholder?: string
  editable?: boolean
  required?: boolean
  className?: string
}

export function EditorField({
  label,
  value,
  onChange,
  error,
  placeholder,
  editable = true,
  required = false,
  className,
}: EditorFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className={cn(error && "text-destructive")}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      <TiptapEditor
        content={value}
        onChange={onChange}
        placeholder={placeholder}
        editable={editable}
      />
      {error && (
        <p className="text-sm text-destructive">{error.message}</p>
      )}
    </div>
  )
}