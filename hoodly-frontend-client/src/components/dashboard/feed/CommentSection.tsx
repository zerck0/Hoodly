import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Send, Loader2, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'
import { toast } from 'sonner'

import { postsApi } from '../../../services/api/posts'
import { useUser } from '../../../hooks/useUser'
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { Separator } from '../../ui/separator'
import { Skeleton } from '../../ui/skeleton'
import type { Comment, PaginatedComments } from '../../../types/post.types'

interface CommentSectionProps {
  postId: string
  onCommentAdded: () => void
  onCommentDeleted?: () => void
}

export function CommentSection({ postId, onCommentAdded, onCommentDeleted }: CommentSectionProps) {
  const { user } = useUser()
  const queryClient = useQueryClient()
  const [content, setContent] = useState('')

  const { data, isLoading, isError } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const res = await postsApi.getComments(postId)
      return res.data
    },
  })

  const { mutate: submitComment, isPending: isSubmitting } = useMutation({
    mutationFn: (text: string) => postsApi.createComment(postId, { content: text }),
    onMutate: async (text: string) => {
      await queryClient.cancelQueries({ queryKey: ['comments', postId] })
      const previousComments = queryClient.getQueryData<PaginatedComments>(['comments', postId])

      const optimisticComment: Comment = {
        _id: `optimistic-${Date.now()}`,
        post: postId,
        author: user?.id || 'temp-id',
        authorSnapshot: {
          nom: user?.name || 'Voisin',
          avatar: user?.picture || '',
        },
        content: text,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      queryClient.setQueryData<PaginatedComments>(['comments', postId], (old) => {
        if (!old) return { data: [optimisticComment], nextCursor: null }
        return {
          ...old,
          data: [optimisticComment, ...old.data],
        }
      })

      onCommentAdded()

      return { previousComments }
    },
    onError: (_err, _text, context) => {
      if (context?.previousComments) {
        queryClient.setQueryData(['comments', postId], context.previousComments)
      }
      onCommentDeleted?.()
      toast.error("Impossible d'ajouter le commentaire")
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
    },
    onSuccess: () => {
      setContent('')
      toast.success('Commentaire ajouté !')
    },
  })

  const { mutate: handleDeleteComment } = useMutation({
    mutationFn: (commentId: string) => postsApi.deleteComment(commentId),
    onSuccess: () => {
      toast.success('Commentaire supprimé')
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
      onCommentDeleted?.()
    },
    onError: () => {
      toast.error('Erreur lors de la suppression du commentaire')
    },
  })

  const confirmDeleteComment = (commentId: string) => {
    if (window.confirm('Voulez-vous vraiment supprimer ce commentaire ?')) {
      handleDeleteComment(commentId)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    submitComment(content)
  }

  const commentsList = data?.data || []

  return (
    <div className="mt-4 pt-4 border-t space-y-4">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src={user?.picture} alt={user?.name} />
          <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
        </Avatar>
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="Écrire un commentaire..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isSubmitting}
            className="h-9 text-sm rounded-full bg-slate-50 border-slate-200 focus-visible:ring-1"
          />
          <Button 
            type="submit" 
            size="icon" 
            className="h-9 w-9 rounded-full shrink-0" 
            disabled={!content.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>

      <Separator className="my-2" />

      <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="flex gap-3 items-start">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <p className="text-center text-xs text-destructive py-2">
            Erreur lors de la récupération des commentaires.
          </p>
        ) : commentsList.length === 0 ? (
          <p className="text-center text-xs text-muted-foreground py-4">
            Aucun commentaire pour le moment. Soyez le premier à réagir !
          </p>
        ) : (
          commentsList.map((comment) => (
            <div key={comment._id} className="flex gap-3 items-start text-sm group">
              <Avatar className="h-8 w-8 mt-0.5 shrink-0">
                <AvatarImage src={comment.authorSnapshot.avatar} alt={comment.authorSnapshot.nom} />
                <AvatarFallback>{comment.authorSnapshot.nom?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <div className="flex-1 bg-slate-50 rounded-2xl p-3 border border-slate-100 relative">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-semibold text-slate-800 text-xs">
                    {comment.authorSnapshot.nom}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">
                      {formatDistanceToNow(new Date(comment.createdAt), {
                        addSuffix: true,
                        locale: fr,
                      })}
                    </span>
                    {user?.id === comment.author && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-4 w-4 text-muted-foreground hover:text-destructive rounded opacity-0 group-hover:opacity-100 transition"
                        onClick={() => confirmDeleteComment(comment._id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
                <p className="text-slate-700 text-xs whitespace-pre-wrap leading-relaxed">
                  {comment.content}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
