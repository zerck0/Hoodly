import { useEffect } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { postsApi } from '../../../services/api/posts'
import { PostCard } from './PostCard'
import { FeedSkeleton } from './FeedSkeleton'
import { useUser } from '../../../hooks/useUser'
import { useInView } from 'react-intersection-observer'

export function Feed({ zoneId }: { zoneId: string }) {
  const { user } = useUser()

  const { ref, inView } = useInView({
    threshold: 0,
  })

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
    isError,
  } = useInfiniteQuery({
    queryKey: ['posts', zoneId],
    queryFn: async ({ pageParam }) => {
      const { data } = await postsApi.getFeed(zoneId, pageParam as string | undefined);
      return data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
    staleTime: 1000 * 60,
    refetchInterval: 30000,
  })

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage()
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage])

  if (isPending) {
    return <FeedSkeleton />
  }

  if (isError || !data) {
    return <div className="text-center py-8 text-destructive">Erreur lors du chargement du fil d'actualité.</div>
  }

  const posts = data.pages.flatMap((page) => page.data)

  return (
    <div className="space-y-6">
      {posts.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-lg">
          Aucune publication pour le moment.
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post._id} post={post} currentUserId={user?.id} />
          ))}
        </div>
      )}

      <div ref={ref} className="py-4 flex justify-center">
        {isFetchingNextPage && <FeedSkeleton />}
      </div>
    </div>
  )
}
