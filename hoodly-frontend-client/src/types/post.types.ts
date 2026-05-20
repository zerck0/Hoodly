export const PostType = {
  DISCUSSION: 'DISCUSSION',
  SERVICE: 'SERVICE',
  EVENT: 'EVENT',
  ALERT: 'ALERT',
} as const;

export type PostType = typeof PostType[keyof typeof PostType];

export interface AuthorSnapshot {
  nom: string;
  avatar: string;
}

export interface Post {
  _id: string;
  author: string;
  authorSnapshot: AuthorSnapshot;
  zone: string;
  content: string;
  media: string[];
  type: PostType;
  likes: string[];
  commentCount: number;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePostDto {
  content: string;
  type?: PostType;
}

export interface Comment {
  _id: string;
  post: string;
  author: string;
  authorSnapshot: AuthorSnapshot;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentDto {
  content: string;
}

export interface PaginatedPosts {
  data: Post[];
  nextCursor: string | null;
}

export interface PaginatedComments {
  data: Comment[];
  nextCursor: string | null;
}
