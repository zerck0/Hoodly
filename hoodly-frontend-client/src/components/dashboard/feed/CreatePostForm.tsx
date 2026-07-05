import { useState, useRef } from 'react'
import { Image, X, Loader2, Send } from 'lucide-react'
import { Card, CardContent, CardFooter } from '../../ui/card'
import { Button } from '../../ui/button'
import { Textarea } from '../../ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { postsApi } from '../../../services/api/posts'
import { useUser } from '../../../hooks/useUser'
import { toast } from 'sonner'
import { PostType } from '../../../types/post.types'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'
import { useTranslation } from 'react-i18next'

export function CreatePostForm({ zoneId }: { zoneId: string }) {
  const { t } = useTranslation()
  const { user } = useUser()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [content, setContent] = useState('')
  const [type, setType] = useState<PostType>(PostType.DISCUSSION)
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const { mutate, isPending } = useMutation({
    mutationFn: () => postsApi.createPost(zoneId, { content, type }, file || undefined),
    onSuccess: () => {
      setContent('')
      setType(PostType.DISCUSSION)
      removeFile()
      toast.success(t('dashboard.createPost.successMsg', 'Publication réussie !'))
      queryClient.invalidateQueries({ queryKey: ['posts', zoneId] })
    },
    onError: (error: Error | { response?: { data?: { message?: string } } }) => {
      console.error(error)
      const err = error as { response?: { data?: { message?: string } } }
      toast.error(err.response?.data?.message || t('dashboard.createPost.errorMsg', 'Erreur lors de la publication'))
    }
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return

    if (selected.size > 5 * 1024 * 1024) {
      toast.error(t('dashboard.createPost.errorSize', "L'image ne doit pas dépasser 5 Mo"))
      return
    }

    if (!selected.type.startsWith('image/')) {
      toast.error(t('dashboard.createPost.errorType', "Le fichier doit être une image"))
      return
    }

    setFile(selected)
    const reader = new FileReader()
    reader.onload = () => setPreviewUrl(reader.result as string)
    reader.readAsDataURL(selected)
  }

  const removeFile = () => {
    setFile(null)
    setPreviewUrl(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return
    mutate()
  }

  return (
    <Card className="mb-6">
      <form onSubmit={handleSubmit}>
        <CardContent className="pt-4 pb-2">
          <div className="flex gap-4">
            <Avatar>
              <AvatarImage src={user?.picture} alt={user?.name} />
              <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Textarea
                placeholder={t('dashboard.createPost.placeholder', 'Quoi de neuf dans votre quartier ?')}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[100px] resize-none border-none focus-visible:ring-0 px-0 text-base"
                disabled={isPending}
              />
              
              {previewUrl && (
                <div className="relative inline-block w-full max-w-sm rounded-lg overflow-hidden border">
                  <img src={previewUrl} alt="Preview" className="w-full h-auto object-cover max-h-48" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6 rounded-full"
                    onClick={removeFile}
                    disabled={isPending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between items-center py-3 border-t">
          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              disabled={isPending}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-primary"
              onClick={() => fileInputRef.current?.click()}
              disabled={isPending || !!file}
            >
              <Image className="h-4 w-4 mr-2" />
              {t('dashboard.createPost.photo', 'Photo')}
            </Button>
            
            <Select value={type} onValueChange={(v) => setType(v as PostType)} disabled={isPending}>
              <SelectTrigger className="w-[140px] h-8 text-xs border-none shadow-none focus:ring-0">
                <SelectValue placeholder={t('dashboard.createPost.typePlaceholder', 'Type de post')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={PostType.DISCUSSION}>{t('dashboard.createPost.types.discussion', 'Discussion')}</SelectItem>
                <SelectItem value={PostType.SERVICE}>{t('dashboard.createPost.types.service', 'Service')}</SelectItem>
                <SelectItem value={PostType.EVENT}>{t('dashboard.createPost.types.event', 'Événement')}</SelectItem>
                <SelectItem value={PostType.ALERT}>{t('dashboard.createPost.types.alert', 'Alerte')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button 
            type="submit" 
            size="sm" 
            disabled={!content.trim() || isPending}
            className="rounded-full px-6"
          >
            {isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            {t('dashboard.createPost.submit', 'Publier')}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
