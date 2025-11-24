import React from 'react'

export function PostsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-slate-800 rounded-xl p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-700" />
            <div className="flex-1">
              <div className="h-4 bg-slate-700 rounded w-32 mb-2" />
              <div className="h-3 bg-slate-700 rounded w-24" />
            </div>
          </div>
          
          {/* Content */}
          <div className="space-y-2 mb-4">
            <div className="h-4 bg-slate-700 rounded w-full" />
            <div className="h-4 bg-slate-700 rounded w-5/6" />
            <div className="h-4 bg-slate-700 rounded w-4/6" />
          </div>
          
          {/* Image placeholder */}
          <div className="h-64 bg-slate-700 rounded-lg mb-4" />
          
          {/* Footer */}
          <div className="flex gap-4">
            <div className="h-8 bg-slate-700 rounded w-20" />
            <div className="h-8 bg-slate-700 rounded w-20" />
            <div className="h-8 bg-slate-700 rounded w-20" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function CommunityHeaderSkeleton() {
  return (
    <div className="bg-slate-800 rounded-xl p-6 animate-pulse">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-full bg-slate-700" />
        <div className="flex-1">
          <div className="h-6 bg-slate-700 rounded w-48 mb-2" />
          <div className="h-4 bg-slate-700 rounded w-64" />
        </div>
        <div className="h-10 bg-slate-700 rounded w-32" />
      </div>
      
      <div className="flex gap-6 mt-4 pt-4 border-t border-slate-700">
        <div className="h-4 bg-slate-700 rounded w-24" />
        <div className="h-4 bg-slate-700 rounded w-24" />
        <div className="h-4 bg-slate-700 rounded w-24" />
      </div>
    </div>
  )
}

export function MembersSidebarSkeleton() {
  return (
    <div className="bg-slate-800 rounded-xl p-6 animate-pulse">
      <div className="h-5 bg-slate-700 rounded w-32 mb-4" />
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-700" />
            <div className="flex-1">
              <div className="h-3 bg-slate-700 rounded w-24 mb-1" />
              <div className="h-2 bg-slate-700 rounded w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function CommunityStatsSkeleton() {
  return (
    <div className="bg-slate-800 rounded-xl p-6 animate-pulse">
      <div className="h-5 bg-slate-700 rounded w-32 mb-4" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex justify-between items-center">
            <div className="h-3 bg-slate-700 rounded w-24" />
            <div className="h-4 bg-slate-700 rounded w-12" />
          </div>
        ))}
      </div>
    </div>
  )
}
