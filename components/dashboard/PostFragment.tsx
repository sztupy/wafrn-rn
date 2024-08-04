import { Post, PostUser } from "@/lib/api/posts.types"
import { Image, Pressable, Text, TouchableOpacity, useWindowDimensions, View } from "react-native"
import { formatAvatarUrl, formatCachedUrl, formatDate, formatMediaUrl, formatUserUrl } from "@/lib/formatters"
import HtmlRenderer from "../HtmlRenderer"
import { useMemo } from "react"
import { useDashboardContext } from "@/lib/contexts/DashboardContext"
import { AVATAR_SIZE, POST_MARGIN } from "@/lib/api/posts"
import Media from "../posts/Media"
import { Link, router } from "expo-router"
import RenderHTML from "react-native-render-html"
import { getUserNameHTML, handleDomElement, HTML_STYLES, inlineImageConfig, isEmptyRewoot, processPostContent } from "@/lib/api/content"
import RewootRibbon from "../posts/RewootRibbon"
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons"
import clsx from "clsx"
import colors from "tailwindcss/colors"
import { buttonCN } from "@/lib/styles"
import { PRIVACY_ICONS, PRIVACY_LABELS } from "@/lib/api/privacy"
import { useSettings } from "@/lib/api/settings"
import { EmojiBase } from "@/lib/api/emojis"

export default function PostFragment({ post, hasThreadLine, CWOpen, setCWOpen }: {
  post: Post
  hasThreadLine?: boolean
  CWOpen: boolean
  setCWOpen: (value: boolean) => void
}) {
  const { width } = useWindowDimensions()
  const { data: settings } = useSettings()
  const context = useDashboardContext()
  const user = useMemo(
    () => context.users.find((u) => u.id === post.userId),
    [context.users, post.userId]
  )

  const userName = useMemo(() => {
    return getUserNameHTML(user!, context)
  }, [user, context])

  const postContent = useMemo(
    () => processPostContent(post, context),
    [context, post]
  )

  const medias = useMemo(() => {
    return context.medias
      .filter((m) => m.posts.some(({ id }) => id === post.id))
      .sort((a, b) => a.order - b.order)
  }, [post, context])

  const likes = useMemo(() => {
    return context.likes
      .filter((l) => l.postId === post.id)
      .map((l) => ({
        user: context.users.find((u) => u.id === l.userId),
        emoji: '❤️'
      }))
  }, [post, context])

  type EmojiGroup = {
    emoji: string | EmojiBase
    users: PostUser[]
    id: string
  }

  const reactions = useMemo(() => {
    const emojis = Object.fromEntries(
      context.emojiRelations.emojis.map((e) => [e.id, e])
    )
    const reactions = context.emojiRelations.postEmojiReactions
      .filter((r) => r.postId === post.id)
      .map((e) => ({
        id: `${e.emojiId}-${e.userId}`,
        user: context.users.find((u) => u.id === e.userId),
        emoji: e.emojiId ? emojis[e.emojiId] : e.content
      }))
      .filter((r) => r.user)
    const grouped = new Map<string,EmojiGroup >()
    for (const r of reactions) {
      const key = typeof r.emoji === 'string' ? r.emoji : r.emoji.id
      if (!grouped.has(key)) {
        grouped.set(key, {
          id: key,
          users: [],
          emoji: r.emoji,
        })
      }
      grouped.get(key)!.users.push(r.user!)
    }
    return [...grouped.values()]
  }, [post, context])

  const contentWidth = width - POST_MARGIN
  const hideContent = !!post.content_warning && !CWOpen

  const isFollowing = settings?.followedUsers.includes(user?.id!)
  const isAwaitingApproval = settings?.notAcceptedFollows.includes(user?.id!)
  // edition is considered if the post was updated more than 1 minute after it was created
  const isEdited = new Date(post.updatedAt).getTime() - new Date(post.createdAt).getTime() > (1000 * 60)

  if (isEmptyRewoot(post, context)) {
    return (
      <RewootRibbon user={user} userNameHTML={userName} />
    )
  }

  return (
    <Link href={`/post/${post.id}`} asChild>
      <Pressable
        android_ripple={{
          color: 'rgba(255, 255, 255, 0.1)',
        }}
        className="flex-row w-full gap-2.5 items-stretch"
      >
        <View id='avatar-column' className="relative">
          <Pressable onPress={() => router.navigate(`/user/${user?.url}`)}>
            <Image
              className="rounded-br-md border border-gray-500 flex-shrink-0"
              source={{
                width: AVATAR_SIZE,
                height: AVATAR_SIZE,
                uri: formatAvatarUrl(user)
              }}
            />
          </Pressable>
          {hasThreadLine && (
            <View className="flex-1 ml-6 my-1 w-[2px] bg-gray-500/50" />
          )}
        </View>
        <View id='content-column' style={{ width: contentWidth }}>
          <View id='user-name-link' className="my-1">
            <Link href={`/user/${user?.url}`} asChild>
              <Pressable>
                <View className="flex-row my-1">
                  <HtmlRenderer html={userName} renderTextRoot />
                  {(isAwaitingApproval || !isFollowing) && (
                    <TouchableOpacity className="ml-2">
                      <Text className={clsx(
                        'rounded-full px-2 text-sm',
                        isAwaitingApproval ? 'text-gray-400 bg-gray-500/50' : 'text-indigo-500 bg-indigo-500/20',
                      )}>
                        {isAwaitingApproval ? 'Awaiting approval' : 'Follow'}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
                <Text className="text-sm text-cyan-400">{formatUserUrl(user)}</Text>
              </Pressable>
            </Link>
          </View>
          <View id='date-line' className="flex-row gap-1 my-1 items-center">
            {isEdited && <MaterialCommunityIcons name="pencil" color='white' size={16} />}
            <Text className="text-xs text-gray-200">{formatDate(post.updatedAt)}</Text>
            <MaterialCommunityIcons className="ml-0.5" name={PRIVACY_ICONS[post.privacy]} color='white' size={16} />
            <Text className="text-xs text-gray-400">{PRIVACY_LABELS[post.privacy]}</Text>
          </View>
          {post.content_warning && (
            <View
              id='content-warning-message'
              className="flex-row items-center gap-2 my-3 p-2 border border-yellow-500 rounded-full"
            >
              <Ionicons className="ml-2" name="warning" size={20} color={colors.yellow[500]} />
              <Text className="text-yellow-100 text-lg flex-shrink flex-grow">{post.content_warning}</Text>
              <TouchableOpacity className="flex-shrink-0" onPress={() => setCWOpen(!CWOpen)}>
                <Text className={buttonCN}>
                  {CWOpen ? 'Hide' : 'Show'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
          <View
            id='content-warning-content'
            className={clsx('my-2', {
              'rounded-xl bg-yellow-200/10': hideContent,
            })}
          >
            <RenderHTML
              tagsStyles={HTML_STYLES}
              baseStyle={{
                ...HTML_STYLES.text,
                opacity: hideContent ? 0 : 1,
              }}
              contentWidth={contentWidth}
              source={{ html: postContent }}
              // all images are set to inline, html renderer doesn't support dynamic block / inline images
              // and most images inside post content are emojis, so we can just make them all inline
              // and any block images should be rendered as media anyway
              customHTMLElementModels={inlineImageConfig}
              domVisitors={{ onElement: (el) => handleDomElement(el, context) }}
              defaultTextProps={{ selectable: !hideContent }}
              renderersProps={{
                a: {
                  onPress(event, url) {
                    if (url.startsWith('wafrn://')) {
                      router.navigate(url.replace('wafrn://', ''))
                    } else {
                      router.navigate(url)
                    }
                  }
                }
              }}
            />
            <View id='media-list'>
              {medias.map((media, index) => (
                <Media hidden={hideContent} key={`${media.id}-${index}`} media={media} />
              ))}
            </View>
          </View>
          {post.notes > 0 && (
            <View id='notes' className="mt-3 pt-1 border-t border-gray-500">
              <Text className="text-gray-200 text-sm">
                {post.notes} Notes
              </Text>
            </View>
          )}
          <View id='reactions' className="my-2 flex-row flex-wrap items-center gap-2">
            {likes.length > 0 && (
              <Text className="text-gray-200 py-1 px-2 rounded-md border border-gray-500">
                ❤️ {likes.length}
              </Text>
            )}
            {reactions.map((r) => {
              if (typeof r.emoji === 'string') {
                return (
                  <Text key={r.id} className="text-gray-200 py-1 px-2 rounded-md border border-gray-500">
                    {r.emoji} {r.users.length}
                  </Text>
                )
              } else {
                return (
                  <View className="flex-row items-center gap-2 py-1 px-2 rounded-md border border-gray-500">
                    <Image
                      key={r.id}
                      className="rounded-md"
                      source={{ uri: formatCachedUrl(formatMediaUrl(r.emoji.url)) }}
                      style={{ width: 20, height: 20 }}
                    />
                    <Text className="text-gray-200">
                      {r.users.length}
                    </Text>
                  </View>
                )
              }
            })}
          </View>
        </View>
      </Pressable>
    </Link>
  )
}
