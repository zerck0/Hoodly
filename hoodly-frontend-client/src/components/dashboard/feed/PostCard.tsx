import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'
import { Heart, MessageCircle, MapPin, AlertTriangle, Calendar, Wrench, Trash2, X } from 'lucide-react'
import { Card, CardContent, CardFooter, CardHeader } from '../../ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar'
import { Badge } from '../../ui/badge'
import { Button } from '../../ui/button'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { postsApi } from '../../../services/api/posts'
import type { Post } from '../../../types/post.types'
import { PostType } from '../../../types/post.types'
import { CommentSection } from './CommentSection'
import { toast } from 'sonner'
import { useAuthStore } from '../../../stores/auth.store'
import { ZoneMembershipStatus } from '../../../types/status.enum'
import { useTranslation } from 'react-i18next'

interface PostCardProps {
  post: Post
  currentUserId?: string
}

const typeConfig = {
  [PostType.DISCUSSION]: { color: 'bg-blue-100 text-blue-800', icon: MessageCircle },
  [PostType.SERVICE]: { color: 'bg-green-100 text-green-800', icon: Wrench },
  [PostType.EVENT]: { color: 'bg-purple-100 text-purple-800', icon: Calendar },
  [PostType.ALERT]: { color: 'bg-red-100 text-red-800', icon: AlertTriangle },
}

export function PostCard({ post, currentUserId }: PostCardProps) {
  const { t, i18n } = useTranslation()
  const user = useAuthStore((state) => state.user)
  const isVerified = user?.zoneStatut === ZoneMembershipStatus.ACTIVE

  const [isLiked, setIsLiked] = useState(() =>
    currentUserId ? post.likes.includes(currentUserId) : false
  )
  const [likesCount, setLikesCount] = useState(post.likes.length)
  const [isCommentsExpanded, setIsCommentsExpanded] = useState(false)
  const [commentsCount, setCommentsCount] = useState(post.commentCount)
  const [activeImage, setActiveImage] = useState<string | null>(null)

  const queryClient = useQueryClient()

  const { mutate: handleDeletePost, isPending: isDeleting } = useMutation({
    mutationFn: () => postsApi.deletePost(post._id),
    onSuccess: () => {
      toast.success(t('dashboard.postCard.deleteSuccess', 'Publication supprimée avec succès'))
      queryClient.invalidateQueries({ queryKey: ['posts', post.zone] })
    },
    onError: () => {
      toast.error(t('dashboard.postCard.deleteError', 'Erreur lors de la suppression de la publication'))
    }
  })

  const confirmDelete = () => {
    if (window.confirm(t('dashboard.postCard.confirmDelete', 'Voulez-vous vraiment supprimer cette publication ?'))) {
      handleDeletePost()
    }
  }

  const { mutate: toggleLike } = useMutation({
    mutationFn: () => postsApi.likePost(post._id),
    onMutate: async () => {
      setIsLiked((prev) => !prev)
      setLikesCount((prev) => isLiked ? prev - 1 : prev + 1)
    },
    onError: () => {
      setIsLiked((prev) => !prev)
      setLikesCount((prev) => isLiked ? prev - 1 : prev + 1)
    }
  })

  const TypeIcon = typeConfig[post.type].icon
  const activeLocale = i18n.language === 'en' ? enUS : fr

  const getTypeLabel = (type: PostType) => {
    switch (type) {
      case PostType.DISCUSSION: return t('dashboard.createPost.types.discussion', 'Discussion')
      case PostType.SERVICE: return t('dashboard.createPost.types.service', 'Service')
      case PostType.EVENT: return t('dashboard.createPost.types.event', 'Événement')
      case PostType.ALERT: return t('dashboard.createPost.types.alert', 'Alerte')
      default: return type
    }
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between p-4 pb-2">
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarImage src={post.authorSnapshot.avatar} alt={post.authorSnapshot.nom} />
            <AvatarFallback>{post.authorSnapshot.nom?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="font-semibold text-sm">{post.authorSnapshot.nom}</span>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true, locale: activeLocale })}
              {post.isPinned && (
                <>
                  <span>•</span>
                  <MapPin className="w-3 h-3 text-primary" /> {t('dashboard.postCard.pinned', 'Épinglé')}
                </>
              )}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {currentUserId === post.author && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={confirmDelete}
              disabled={isDeleting}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
          <Badge variant="secondary" className={`flex items-center gap-1.5 ${typeConfig[post.type].color}`}>
            <TypeIcon className="w-3 h-3" />
            {getTypeLabel(post.type)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-2">
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{post.content}</p>

        {post.content.includes('🗳️') && (
          <div className="mt-3 pt-3 border-t border-gray-100 flex">
            <Button
              asChild
              className="bg-[#2c308e] hover:bg-[#2c308e]/95 text-white font-bold text-xs rounded-xl h-9 px-4 shadow-sm transition-all cursor-pointer active:scale-98"
            >
              <a href="/votes">
                {t('dashboard.postCard.joinVote', '🗳️ Participer à la consultation')}
              </a>
            </Button>
          </div>
        )}

        {post.media && post.media.length > 0 && (
          <div className={`mt-3 grid gap-2 ${post.media.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {post.media.map((url, i) => (
              <img
                key={i}
                src={url}
                alt="Post media"
                className="rounded-md object-cover w-full max-h-64 cursor-zoom-in hover:brightness-95 transition"
                onClick={() => setActiveImage(url)}
                loading="lazy"
              />
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0 flex gap-4">
        <Button
          variant="ghost"
          size="sm"
          className={`flex items-center gap-1.5 ${isLiked ? 'text-red-500 hover:text-red-600' : 'text-muted-foreground'}`}
          onClick={() => {
            if (!isVerified) {
              toast.error(t('dashboard.postCard.verificationRequired', 'Veuillez faire vérifier votre compte avec vos justificatifs pour interagir avec les publications.'))
              return
            }
            toggleLike()
          }}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
          <span>{likesCount}</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className={`flex items-center gap-1.5 ${isCommentsExpanded ? 'text-primary' : 'text-muted-foreground'}`}
          onClick={() => setIsCommentsExpanded((prev) => !prev)}
        >
          <MessageCircle className="w-4 h-4" />
          <span>{t('dashboard.postCard.commentsCount', { count: commentsCount, defaultValue: `${commentsCount} commentaires` })}</span>
        </Button>
      </CardFooter>

      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isCommentsExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 overflow-hidden'
        }`}
      >
        <div className="overflow-hidden">
          {isCommentsExpanded && (
            <CardContent className="p-4 pt-0">
              <CommentSection
                postId={post._id}
                onCommentAdded={() => setCommentsCount((prev) => prev + 1)}
                onCommentDeleted={() => setCommentsCount((prev) => prev - 1)}
              />
            </CardContent>
          )}
        </div>
      </div>

      {activeImage && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setActiveImage(null)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/10 rounded-full"
            onClick={(e) => {
              e.stopPropagation()
              setActiveImage(null)
            }}
          >
            <X className="h-6 w-6" />
          </Button>
          <img
            src={activeImage}
            alt={t('dashboard.postCard.fullscreenPreview', 'Aperçu grand écran')}
            className="max-w-full max-h-[90vh] object-contain rounded-md animate-in zoom-in-95 duration-200"
          />
        </div>
      )}
    </Card>
  )
}
