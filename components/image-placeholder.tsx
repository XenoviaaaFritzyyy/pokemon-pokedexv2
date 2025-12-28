import { ImageOff } from "lucide-react"

interface ImagePlaceholderProps {
  text?: string
  className?: string
}

export function ImagePlaceholder({ text = "Image not yet available", className = "" }: ImagePlaceholderProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 rounded-lg ${className}`}
    >
      <ImageOff className="w-8 h-8 text-gray-400 dark:text-gray-600 mb-2" />
      <p className="text-xs text-center text-gray-500 dark:text-gray-400 px-2">{text}</p>
    </div>
  )
}
