import api from '../../lib/axios'
import type { 
  Post, 
  CreatePostDto, 
  Comment, 
  CreateCommentDto, 
  PaginatedPosts, 
  PaginatedComments 
} from '../../types/post.types'

export const postsApi = {
  getFeed: (zoneId: string, cursor?: string, limit = 10) =>
    api.get<PaginatedPosts>(`/zones/${zoneId}/posts`, {
      params: { cursor, limit },
    }),

  createPost: (zoneId: string, data: CreatePostDto, file?: File) => {
    if (file) {
      const formData = new FormData()
      formData.append('content', data.content)
      if (data.type) {
        formData.append('type', data.type)
      }
      formData.append('files', file)
      return api.post<Post>(`/zones/${zoneId}/posts`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    }
    return api.post<Post>(`/zones/${zoneId}/posts`, data)
  },

  likePost: (postId: string) => 
    api.post<{ isLiked: boolean }>(`/posts/${postId}/like`),

  getComments: (postId: string, cursor?: string, limit = 20) =>
    api.get<PaginatedComments>(`/posts/${postId}/comments`, {
      params: { cursor, limit },
    }),

  createComment: (postId: string, data: CreateCommentDto) =>
    api.post<Comment>(`/posts/${postId}/comments`, data),

  deletePost: (postId: string) => 
    api.delete<{ success: boolean }>(`/posts/${postId}`),

  deleteComment: (commentId: string) => 
    api.delete<{ success: boolean }>(`/comments/${commentId}`),
}
