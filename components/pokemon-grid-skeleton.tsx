"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function PokemonGridSkeleton({ count = 20 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="overflow-hidden border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-700 dark:to-gray-800">
          <CardContent className="p-4">
            <div className="space-y-4">
              {/* Image skeleton */}
              <Skeleton className="w-full h-32 rounded-lg" />

              {/* Name skeleton */}
              <Skeleton className="h-4 w-3/4" />

              {/* ID skeleton */}
              <Skeleton className="h-3 w-1/4" />

              {/* Type badges skeleton */}
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>

              {/* Stats skeleton */}
              <div className="space-y-2">
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-2 w-5/6" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
