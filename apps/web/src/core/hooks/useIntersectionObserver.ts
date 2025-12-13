'use client'

import { useEffect, useRef, useState, RefObject } from 'react'

interface UseIntersectionObserverProps {
  threshold?: number
  root?: Element | null
  rootMargin?: string
  freezeOnceVisible?: boolean
}

export function useIntersectionObserver({
  threshold = 0,
  root = null,
  rootMargin = '0px',
  freezeOnceVisible = false,
}: UseIntersectionObserverProps = {}): [RefObject<HTMLDivElement>, boolean] {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const targetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = targetRef.current

    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isElementIntersecting = entry.isIntersecting

        setIsIntersecting(isElementIntersecting)

        if (freezeOnceVisible && isElementIntersecting && node) {
          observer.unobserve(node)
        }
      },
      { threshold, root, rootMargin }
    )

    observer.observe(node)

    return () => {
      if (node) {
        observer.unobserve(node)
      }
    }
  }, [threshold, root, rootMargin, freezeOnceVisible])

  return [targetRef, isIntersecting]
}

// Hook for lazy loading images
export function useLazyImage(src: string): [RefObject<HTMLDivElement>, string, boolean] {
  const [ref, inView] = useIntersectionObserver({
    threshold: 0.1,
    freezeOnceVisible: true,
    rootMargin: '50px' // Start loading 50px before entering viewport
  })
  const [imageSrc, setImageSrc] = useState('')
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    if (inView && src && !imageSrc) {
      setImageSrc(src)
    }
  }, [inView, src, imageSrc])

  useEffect(() => {
    if (!imageSrc) return

    const img = new Image()
    img.src = imageSrc
    img.onload = () => setIsLoaded(true)
  }, [imageSrc])

  return [ref, imageSrc, isLoaded]
}

// Hook for infinite scroll
export function useInfiniteScroll(
  callback: () => void,
  hasMore: boolean
): RefObject<HTMLDivElement> {
  const [ref, inView] = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '100px'
  })

  useEffect(() => {
    if (inView && hasMore) {
      callback()
    }
  }, [inView, hasMore, callback])

  return ref
}
