'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useInfiniteScroll } from '@/core/hooks/useIntersectionObserver'
import { OptimizedPostCard } from './OptimizedPostCard'
import { PostsSkeleton } from './CommunitySkeletons'

interface Post {
  id: string
  content: string
  created_at: string
  user?: {
    first_name?: string
    last_name?: string
    username?: string
    profile_picture_url?: string
  }
  image_url?: string
  reactions_count?: number
  comments_count?: number
}

interface InfinitePostsFeedProps {
  communitySlug: string
  initialPosts?: Post[]
}

export function InfinitePostsFeed({ communitySlug, initialPosts = [] }: InfinitePostsFeedProps) {
  const [posts, setPosts] = useState<Post[]>(initialPosts)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  const loadMorePosts = useCallback(async () => {
    if (loading) return

    setLoading(true)
    try {
      const response = await fetch(
        `/api/communities/${communitySlug}/posts?page=${page}&limit=10`,
        { credentials: 'include' }
      )
      
      if (response.ok) {
        const data = await response.json()
        const newPosts = data.posts || []
        
        if (newPosts.length === 0) {
          setHasMore(false)
        } else {
          setPosts(prev => [...prev, ...newPosts])
          setPage(prev => prev + 1)
        }
      }
    } catch (error) {
      console.error('Error loading posts:', error)
    } finally {
      setLoading(false)
    }
  }, [communitySlug, page, loading])

  const loadMoreRef = useInfiniteScroll(loadMorePosts, hasMore && !loading)

  return (
    <div className="space-y-6">
      {/* Posts list */}
      {posts.map((post) => (
        <OptimizedPostCard
          key={post.id}
          post={post}
          onReact={() => console.log('React to', post.id)}
          onComment={() => console.log('Comment on', post.id)}
          onShare={() => console.log('Share', post.id)}
        />
      ))}

      {/* Loading indicator */}
      {loading && <PostsSkeleton />}

      {/* Infinite scroll trigger */}
      {hasMore && <div ref={loadMoreRef} className="h-20" />}

      {/* End of posts */}
      {!hasMore && posts.length > 0 && (
        <div className="text-center py-8 text-slate-400">
          <p>Has visto todos los posts</p>
        </div>
      )}

      {/* Empty state */}
      {!loading && posts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-slate-400 text-lg">No hay posts todavía</p>
          <p className="text-slate-500 text-sm mt-2">Sé el primero en publicar algo</p>
        </div>
      )}
    </div>
  )
}
