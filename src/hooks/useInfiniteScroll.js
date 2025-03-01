import { useEffect, useCallback } from 'react'

export const useInfiniteScroll = (onLoadMore, hasMore, isLoading) => {
  const handleScroll = useCallback(() => {
    if (!hasMore || isLoading) return
    
    const scrolledToBottom =
      window.innerHeight + document.documentElement.scrollTop
      >= document.documentElement.offsetHeight - 1000

    if (scrolledToBottom) {
      onLoadMore()
    }
  }, [hasMore, isLoading, onLoadMore])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])
}

export default useInfiniteScroll
