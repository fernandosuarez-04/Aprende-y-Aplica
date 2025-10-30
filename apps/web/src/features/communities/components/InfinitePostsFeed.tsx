'use client'

import React, { useState, useCallback, useEffect } from 'react'
import { useInfiniteScroll } from '../../../core/hooks/useIntersectionObserver'
import { OptimizedPostCard } from './OptimizedPostCard'
import { PostsSkeleton } from './CommunitySkeletons'

// Tipo genérico para permitir cualquier tipo de post
type GenericPost = Record<string, any> & { id: string }

interface InfinitePostsFeedProps<T = GenericPost> {
  communitySlug: string
  initialPosts?: T[]
  renderPost?: (post: T, index: number) => React.ReactNode
  onPostsUpdate?: (posts: T[]) => void
}

export function InfinitePostsFeed<T extends GenericPost = GenericPost>({ 
  communitySlug, 
  initialPosts = [],
  renderPost,
  onPostsUpdate
}: InfinitePostsFeedProps<T>) {
  const [posts, setPosts] = useState<T[]>(initialPosts)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)

  // Notificar cambios en posts al componente padre
  useEffect(() => {
    if (onPostsUpdate) {
      onPostsUpdate(posts)
    }
  }, [posts, onPostsUpdate])

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
      {posts.map((post, index) => (
        renderPost ? (
          <React.Fragment key={post.id}>
            {renderPost(post, index)}
          </React.Fragment>
        ) : (
          <OptimizedPostCard
            key={post.id}
            post={post}
            onReact={() => console.log('React to', post.id)}
            onComment={() => console.log('Comment on', post.id)}
            onShare={() => console.log('Share', post.id)}
          />
        )
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
