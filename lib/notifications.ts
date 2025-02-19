import { useMemo } from "react"
import { getJSON } from "./http"
import { useAuth } from "./contexts/AuthContext"
import { useInfiniteQuery, useQuery } from "@tanstack/react-query"
import { DashboardData, Post, PostAsk, PostEmojiContext, PostEmojiReaction, PostMedia, PostQuote, PostTag, PostUser, PostUserRelation } from "./api/posts.types"
import { Follow } from "./api/user"
import { EmojiGroupConfig } from "./api/settings"
import { Timestamps } from "./api/types"
import { getEnvironmentStatic } from "./api/auth"

type NotificationsBadges = {
  asks: number
  notifications: number
  followsAwaitingApproval: number
  reports: number
  usersAwaitingApproval: number
}

function getLastDate(posts: Timestamps[]) {
  if (!posts.length) {
    return undefined
  }
  const dates = posts.map((post) => new Date(post.createdAt).getTime())
  return Math.min(...dates)
}

export async function getNotificationBadges({ token, time }: { token: string; time: number }) {
  const env = getEnvironmentStatic()
  const json = await getJSON(`${env?.API_URL}/v2/notificationsCount?startScroll=${time}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
  const data = json as NotificationsBadges
  return data
}

export function useNotificationBadges() {
  const { token } = useAuth()
  const time = useMemo(() => Date.now(), [])
  return useQuery({
    queryKey: ["notificationsBadge", token],
    queryFn: () => getNotificationBadges({ token: token!, time }),
    enabled: !!token
  })
}

type NotificationPayload = {
  likesDate: number // ms
  followsDate: number // ms
  reblogsDate: number // ms
  mentionsDate: number // ms
  emojiReactionDate: number // ms
  quotesDate: number // ms
  page: number
}

export type NotificationsV3Page = NotificationsV3PageContext & {
  notifications: NotificationV3[]
}

export type NotificationsV3PageContext = {
  users: Omit<PostUser, 'remoteId'>[]
  posts: Post[]
  medias: PostMedia[]
  asks: PostAsk[]
  tags: (PostTag & Timestamps & { id: string })[]
  emojiRelations: PostEmojiContext
}

export type NotificationV3Base = Timestamps & {
  id: number
  notifiedUserId: string
  userId: string
}

export type FollowNotificationV3 = NotificationV3Base & {
  notificationType: 'FOLLOW'
}
export type LikeNotificationV3 = NotificationV3Base & {
  notificationType: 'LIKE'
  postId: string
}
export type ReblogNotificationV3 = NotificationV3Base & {
  notificationType: 'REWOOT'
  postId: string
}
export type MentionNotificationV3 = NotificationV3Base & {
  notificationType: 'MENTION'
  postId: string
}
export type QuoteNotificationV3 = NotificationV3Base & {
  notificationType: 'QUOTE'
  postId: string
}
export type EmojiReactionNotificationV3 = NotificationV3Base & {
  notificationType: 'EMOJIREACT'
  postId: string
  emojiReactionId: string
}
export type NotificationV3 = FollowNotificationV3 | LikeNotificationV3 | ReblogNotificationV3 | MentionNotificationV3 | QuoteNotificationV3 | EmojiReactionNotificationV3


export type NotificationsPage = {
  emojiReactions: (Timestamps & PostEmojiReaction & { id: string; remoteId: string })[]
  emojis: EmojiGroupConfig['emojis']
  users: Omit<PostUser, 'remoteId'>[]
  posts: Post[]
  reblogs: Post[]
  likes: (Timestamps & PostUserRelation)[]
  mentions: Post[]
  follows: Follow['follows'][]
  medias: PostMedia[]
  quotes: PostQuote[]
  asks: PostAsk[]
}

export type Notification = Timestamps & NotificationDetails & { user: Omit<PostUser, 'remoteId'> }

export type FollowNotification = {
  type: 'follow'
}
export type LikeNotification = {
  type: 'like',
  post: Post
}
export type ReblogNotification = {
  type: 'reblog',
  post: Post
}
export type MentionNotification = {
  type: 'mention',
  post: Post
}
export type EmojiReactionNotification = {
  type: 'emoji',
  emoji: PostEmojiReaction
}
export type QuoteNotification = {
  type: 'quote',
  post: Post
}
export type NotificationDetails = FollowNotification | LikeNotification | ReblogNotification | MentionNotification | EmojiReactionNotification | QuoteNotification


export async function getNotificationsV3({ token, page, date }: { token: string; page: number; date: number }) {
  const env = getEnvironmentStatic()
  const json = await getJSON(`${env?.API_URL}/v3/notificationsScroll?page=${page}&date=${date}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
  return json as NotificationsV3Page
}

export async function getNotifications({ token, payload }: { token: string; payload: NotificationPayload }) {
  const env = getEnvironmentStatic()
  const params = new URLSearchParams(payload as any) // force string coercion
  const json = await getJSON(`${env?.API_URL}/v2/notificationsScroll?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })
  return json as NotificationsPage
}

export function getNotificationPageEnd(page: NotificationsPage) {
  const dates = [
    getLastDate(page.emojiReactions),
    getLastDate(page.likes),
    getLastDate(page.follows),
    getLastDate(page.reblogs),
    getLastDate(page.mentions),
    getLastDate(page.quotes),
  ]
  return Math.max(...dates.filter(Boolean) as number[]) 
}

export function useNotificationsV3() {
  const { refetch: refetchBadge } = useNotificationBadges()
  const { token } = useAuth()
  return useInfiniteQuery({
    queryKey: ['notificationsV3'],
    queryFn: async ({ pageParam }) => {
      const list = await getNotificationsV3({ token: token!, page: pageParam.page, date: pageParam.date })
      await refetchBadge()
      return list
    },
    initialPageParam: {
      date: Date.now(),
      page: 0
    },
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      const dates = lastPage.notifications.map(n => new Date(n.createdAt).getTime())
      const endDate = Math.min(...dates)
      return {
        date: endDate,
        page: lastPageParam.page + 1
      }
    },
    enabled: !!token,
  })
}

export function useNotifications() {
  const { refetch: refetchBadge } = useNotificationBadges()
  const { token } = useAuth()
  return useInfiniteQuery({
    queryKey: ['notifications'],
    queryFn: async ({ pageParam }) => {
      const list = await getNotifications({ token: token!, payload: pageParam })
      await refetchBadge()
      return list
    },
    initialPageParam: {
      likesDate: Date.now(),
      followsDate: Date.now(),
      reblogsDate: Date.now(),
      mentionsDate: Date.now(),
      emojiReactionDate: Date.now(),
      quotesDate: Date.now(),
      page: 0
    },
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      const endDate = getNotificationPageEnd(lastPage)
      return {
        likesDate: endDate,
        followsDate: endDate,
        reblogsDate: endDate,
        mentionsDate: endDate,
        emojiReactionDate: endDate,
        quotesDate: endDate,
        page: lastPageParam.page + 1
      }
    },
    enabled: !!token,
  })
}

export function notificationPageToDashboardPageV3(page: NotificationsV3Page) {
  return {
    ...page,
    likes: [],
    rewootIds: [],
    polls: [],
    mentions: [],
    quotes: [], // TODO inlcude data for this somehow
    quotedPosts: [], // TODO inlcude data for this somehow
    users: page.users.map(u => ({ ...u, remoteId: null })),
    posts: page.posts.map(p => ({ ...p, ancestors: [] })),
  } satisfies DashboardData
}

export function notificationPageToDashboardPage(page: NotificationsPage) {
  return {
    users: page.users.map(u => ({ ...u, remoteId: null })),
    emojiRelations: {
      emojis: page.emojis,
      userEmojiRelation: [],
      postEmojiRelation: [],
      postEmojiReactions: page.emojiReactions,
    },
    likes: page.likes,
    medias: page.medias,
    mentions: [],
    polls: [],
    tags: [],
    posts: [...page.mentions, ...page.posts].map((p) => ({ ...p, ancestors: [] })),
    quotedPosts: page.posts.filter((p) => page.quotes.some((q) => q.quotedPostId === p.id)),
    quotes: page.quotes,
    asks: page.asks,
    rewootIds: [], // TODO consider if we can get data here somehow
  } satisfies DashboardData
}

export function getNotificationKeyV3(notification: NotificationV3) {
  return notification.id
}

export function getNotificationKey(notification: Notification) {
  return `${notification.type}-${notification.user.url}-${notification.createdAt}`
}

export type FullNotificationV3 = ReturnType<typeof getNotificationListV3>[number]


export function getNotificationListV3(pages: NotificationsV3Page[]) {
  const list = pages.flatMap(page => {
    return page.notifications.map(n => {
      if (n.notificationType === 'EMOJIREACT') {
        return {
          ...n,
          user: page.users.find(u => u.id === n.userId)!,
          post: page.posts.find(p => p.id === n.postId)!,
          emoji: page.emojiRelations.postEmojiReactions.find(e => e.id === n.emojiReactionId)!,
        }
      }
      if (n.notificationType === 'FOLLOW') {
        return {
          ...n,
          user: page.users.find(u => u.id === n.userId)!,
        }
      }
      return {
        ...n,
        user: page.users.find(u => u.id === n.userId)!,
        post: page.posts.find(p => p.id === n.postId)!,
      }
    })
  })
  return list
}

export function getNotificationList(pages: NotificationsPage[]) {
  const list = pages.flatMap(page => {
    const endDate = getNotificationPageEnd(page)
    const notifications = [] as Notification[]

    notifications.push(...page.follows.map(follow => ({
      type: 'follow' as const,
      user: page.users.find(u => u.id === follow.followerId)!,
      createdAt: follow.createdAt,
      updatedAt: follow.updatedAt,
    })))
    notifications.push(...page.emojiReactions.map(emoji => ({
      type: 'emoji' as const,
      emoji,
      user: page.users.find(u => u.id === emoji.userId)!,
      post: page.posts.find(p => p.id === emoji.postId)!,
      createdAt: emoji.createdAt,
      updatedAt: emoji.updatedAt
    })))
    notifications.push(...page.likes.map(like => ({
      type: 'like' as const,
      user: page.users.find(u => u.id === like.userId)!,
      post: page.posts.find(p => p.id === like.postId)!,
      createdAt: like.createdAt,
      updatedAt: like.updatedAt,
    })))
    notifications.push(...page.reblogs.map(reblog => ({
      type: 'reblog' as const,
      user: page.users.find(u => u.id === reblog.userId)!,
      post: page.posts.find((p) => p.id === reblog.parentId)!,
      createdAt: reblog.createdAt,
      updatedAt: reblog.updatedAt,
    })))
    notifications.push(...page.mentions.map(mention => ({
      type: 'mention' as const,
      user: page.users.find(u => u.id === mention.userId)!,
      post: mention,
      createdAt: mention.createdAt,
      updatedAt: mention.updatedAt,
    })))
    notifications.push(...page.quotes.map(quote => {
      const post = page.posts.find(p => p.id === quote.quoterPostId)!
      return {
        type: 'quote' as const,
        user: page.users.find(u => u.id === post.userId)!,
        post,
        createdAt: quote.createdAt,
        updatedAt: quote.updatedAt,
      }
    }))
    const filtered = notifications
      .filter((n) => new Date(n.createdAt).getTime() >= endDate)
      .sort((a, b) => {
        const aTime = new Date(a.createdAt).getTime()
        const bTime = new Date(b.createdAt).getTime()
        return bTime - aTime
      })
    return filtered
  })

  const seen = new Set<string>()

  return list.filter(item => {
    const key = getNotificationKey(item)
    if (seen.has(key)) {
      return false
    }
    seen.add(key)
    return true
  })
}
