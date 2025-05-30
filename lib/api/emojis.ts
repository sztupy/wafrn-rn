import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { getJSON } from '../http'
import {
  invalidatePostQueries,
  showToastError,
  showToastSuccess,
} from '../interaction'
import { Post } from './posts.types'
import { getEnvironmentStatic } from './auth'

export type EmojiBase = {
  external: boolean
  id: string
  name: string
  url: string
}

export type UserEmojiRelation = {
  emojiId: string
  userId: string
}
export type PostEmojiRelation = {
  emojiId: string
  postId: string
}

type EmojiReactPayload = {
  post: Post
  emojiName: string
}

export async function emojiReact(
  token: string,
  { post, emojiName }: EmojiReactPayload,
) {
  const env = getEnvironmentStatic()
  await getJSON(`${env?.API_URL}/emojiReact`, {
    method: 'POST',
    body: JSON.stringify({ postId: post.id, emojiName }),
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  })
}

export function useEmojiReactMutation(post: Post) {
  const { token } = useAuth()
  const qc = useQueryClient()

  return useMutation<void, Error, string>({
    mutationKey: ['emojiReact', post.id],
    mutationFn: (emojiName) => emojiReact(token!, { post, emojiName }),
    onError: (err) => {
      console.error(err)
      showToastError(`Failed to react to woot`)
    },
    onSuccess: () => {
      showToastSuccess(`Reaction sent`)
    },
    // after either error or success, refetch the queries to make sure cache and server are in sync
    onSettled: () => invalidatePostQueries(qc, post),
  })
}
