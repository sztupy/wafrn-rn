import { Post, PostUser } from "@/lib/api/posts.types"
import { Image, LayoutAnimation, Pressable, Text, TouchableOpacity, useWindowDimensions, View } from "react-native"
import { formatSmallAvatar, formatCachedUrl, formatDate, formatMediaUrl, formatUserUrl } from "@/lib/formatters"
import HtmlRenderer from "../HtmlRenderer"
import { useMemo, useRef, useState } from "react"
import { useDashboardContext } from "@/lib/contexts/DashboardContext"
import { AVATAR_SIZE, POST_MARGIN } from "@/lib/api/posts"
import Media from "../posts/Media"
import { Link, router } from "expo-router"
import RenderHTML from "react-native-render-html"
import { getReactions, getUserNameHTML, handleDomElement, HTML_STYLES, inlineImageConfig, isEmptyRewoot, processPostContent } from "@/lib/api/content"
import RewootRibbon from "../posts/RewootRibbon"
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons"
import clsx from "clsx"
import colors from "tailwindcss/colors"
import { PRIVACY_ICONS, PRIVACY_LABELS } from "@/lib/api/privacy"
import { useSettings } from "@/lib/api/settings"
import { LinearGradient } from "expo-linear-gradient"
import { Menu, MenuOptions, MenuTrigger, renderers } from "react-native-popup-menu"

const HEIGHT_LIMIT = 300

export default function PostFragment({ post, isQuote, hasThreadLine, CWOpen, setCWOpen }: {
  post: Post
  isQuote?: boolean
  hasThreadLine?: boolean
  CWOpen: boolean
  setCWOpen: React.Dispatch<React.SetStateAction<boolean>>
}) {
  const [showMore, setShowMore] = useState(true)
  const [showMoreToggle, setShowMoreToggle] = useState(false)

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

  const tags = useMemo(() => {
    const tags = context.tags.filter((t) => t.postId === post.id).map((t) => t.tagName)
    return tags
  }, [post, context])

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

  const quotedPost = useMemo(() => {
    const id = context.quotes.find((q) => q.quoterPostId === post.id)?.quotedPostId
    return context.quotedPosts.find((p) => p.id === id)
  }, [post, context])

  const reactions = useMemo(() => {
    return getReactions(post, context)
  }, [post, context])

  const contentWidth = width - POST_MARGIN - (isQuote ? POST_MARGIN : 0)
  const hideContent = !!post.content_warning && !CWOpen

  const amIFollowing = settings?.followedUsers.includes(user?.id!)
  const amIAwaitingApproval = settings?.notAcceptedFollows.includes(user?.id!)
  // edition is considered if the post was updated more than 1 minute after it was created
  const isEdited = new Date(post.updatedAt).getTime() - new Date(post.createdAt).getTime() > (1000 * 60)
  const hasReactions = likes.length > 0 || reactions.length > 0

  function toggleCW() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setCWOpen((o) => !o)
  }

  if (isEmptyRewoot(post, context)) {
    return (
      <RewootRibbon user={user} userNameHTML={userName} />
    )
  }

  return (
    <Link href={`/post/${post.id}`} asChild>
      <Pressable
        className="px-3"
        android_ripple={{
          color: 'rgba(255, 255, 255, 0.1)',
        }}
      >
        <Link href={`/user/${user?.url}`} asChild>
          <Pressable id='post-header' className="flex-row w-full gap-3 items-stretch">
            <Image
              className="flex-shrink-0 my-3 rounded-md border border-gray-500"
              source={{
                width: AVATAR_SIZE,
                height: AVATAR_SIZE,
                uri: formatSmallAvatar(user)
              }}
            />
            <View id='user-name-link' className="flex-grow">
              <View className="flex-row mt-3">
                <HtmlRenderer html={userName} renderTextRoot />
                {(amIAwaitingApproval || !amIFollowing) && (
                  <TouchableOpacity className="ml-2">
                    <Text className={clsx(
                      'rounded-full px-2 text-sm',
                      amIAwaitingApproval ? 'text-gray-400 bg-gray-500/50' : 'text-indigo-500 bg-indigo-500/20',
                    )}>
                      {amIAwaitingApproval ? 'Awaiting approval' : 'Follow'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text className="text-sm text-cyan-400">{formatUserUrl(user)}</Text>
            </View>
          </Pressable>
        </Link>
        <View id='date-line' className="flex-row gap-1 items-center">
          {isEdited && <MaterialCommunityIcons name="pencil" color='white' size={16} />}
          <Text className="text-xs text-gray-200">{formatDate(post.updatedAt)}</Text>
          <MaterialCommunityIcons className="ml-0.5" name={PRIVACY_ICONS[post.privacy]} color='white' size={16} />
          <Text className="text-xs text-gray-400">{PRIVACY_LABELS[post.privacy]}</Text>
        </View>
        <View id='content'>
          {post.content_warning && (
            <View
              id='content-warning-message'
              className='flex-row items-start gap-3 my-4 p-2 border border-yellow-300 rounded-xl'
            >
              <View className="ml-1 gap-1">
                <Ionicons
                  name="warning"
                  size={24}
                  color={colors.yellow[500]}
                />
                {medias.length > 0 && (
                  <MaterialCommunityIcons
                    name='image'
                    color='white'
                    size={24}
                  />
                )}
                {quotedPost && (
                  <MaterialIcons
                    name='format-quote'
                    size={24}
                    color={colors.gray[200]}
                  />
                )}
              </View>
              <View className="flex-shrink flex-grow gap-2">
                <Text className="text-yellow-100 leading-5">{post.content_warning}</Text>
                <TouchableOpacity className="mr-auto px-2 py-1 bg-indigo-500/20 rounded-full" onPress={toggleCW}>
                  <Text className='text-indigo-500 text-sm'>
                    {CWOpen ? 'Hide' : 'Show'} content
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          {hideContent ? null : (
            <>              
              <View id='show-more-container' className="relative pb-2">
                <View
                  id='show-more-content'
                  style={{
                    overflow: 'hidden',
                    maxHeight: showMore ? undefined : HEIGHT_LIMIT,
                    paddingBottom: showMoreToggle && showMore ? 28 : 4,
                  }}
                  onLayout={(ev) => {
                    const height = ev.nativeEvent.layout.height
                    if (height > HEIGHT_LIMIT && !showMoreToggle) {
                      setShowMoreToggle(true)
                      setShowMore(false)
                    }
                  }}
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
                </View>
                {showMoreToggle && (
                  <LinearGradient
                    id='show-more-toggle'
                    colors={[
                      'transparent',
                      colors.indigo[900],
                    ]}
                    className={clsx(
                      'flex-row justify-center absolute pt-4 pb-2 px-2 bottom-0 -left-3 -right-3',
                      { 'opacity-0': hideContent }
                    )}
                  >
                    <Pressable
                      className="bg-indigo-950 px-3 py-1 rounded-full"
                      onPress={() => {
                        if (!hideContent) {
                          setShowMore(e => !e)
                        }
                      }}
                    >
                      <Text className='text-indigo-500'>
                        {showMore ? 'Show less' : 'Show more'}
                      </Text>
                    </Pressable>
                  </LinearGradient>
                )}
              </View>
              {medias.length > 0 && (
                <View 
                  id='media-list'
                  className='pt-4 pb-2'
                >
                  {medias.map((media, index) => (
                    <Media
                      key={`${media.id}-${index}`}
                      hidden={hideContent}
                      media={media}
                      contentWidth={contentWidth}
                    />
                  ))}
                </View>
              )}
              {tags.length > 0 && (
                <View className="flex-row flex-wrap gap-2 py-2 border-t border-cyan-700">
                  {tags.map((tag, index) => (
                    <Link
                      key={index}
                      href={`/tag/${tag}`}
                      className="text-cyan-200 bg-cyan-600/20 text-sm py-0.5 px-1.5 rounded-md"
                    >
                      #{tag}
                    </Link>
                  ))}
                </View>
              )}
              {quotedPost && (
                <View id='quoted-post' className="my-2 border border-gray-500 rounded-xl bg-gray-500/10">
                  <PostFragment
                    isQuote
                    post={quotedPost}
                    CWOpen={CWOpen}
                    setCWOpen={setCWOpen}
                  />
                </View>
              )}
            </>
          )}
          {hasReactions && (
            <View id='reactions' className="my-2 flex-row flex-wrap items-center gap-2">
              {likes.length > 0 && (
                <ReactionMenu
                  users={likes.map((l) => l.user).filter(l => l) as PostUser[]}
                  reaction='liked'
                >
                  <Text className="text-gray-200 py-1 px-2 rounded-md border border-gray-500">
                    ❤️ {likes.length}
                  </Text>
                </ReactionMenu>
              )}
              {reactions.map((r) => {
                if (typeof r.emoji === 'string') {
                  return (
                    <ReactionMenu
                      key={r.id}
                      users={r.users}
                      reaction={r.emoji}
                    >
                      <Text className="text-gray-200 py-1 px-2 rounded-md border border-gray-500">
                        {r.emoji} {r.users.length}
                      </Text>
                    </ReactionMenu>
                  )
                } else {
                  return (
                    <ReactionMenu
                      key={r.id}
                      users={r.users}
                      reaction={(
                        <Image
                          source={{ uri: formatCachedUrl(formatMediaUrl(r.emoji.url)) }}
                          style={{ resizeMode: 'contain', width: 20, height: 20 }}
                        />
                      )}
                    >
                      <View className="flex-row items-center gap-2 py-1 px-2 rounded-md border border-gray-500">
                        <Image
                          source={{ uri: formatCachedUrl(formatMediaUrl(r.emoji.url)) }}
                          style={{ resizeMode: 'contain', width: 20, height: 20 }}
                        />
                        <Text className="text-gray-200">
                          {r.users.length}
                        </Text>
                      </View>
                    </ReactionMenu>
                  )
                }
              })}
            </View>
          )}
          {post.notes !== undefined && (
            <View id='notes' className="mb-3 pt-1 border-t border-gray-500">
              <Text className="text-gray-200 text-sm">
                {post.notes} Notes
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    </Link>
  )
}

function ReactionMenu({ children, users, reaction }: {
  children: React.ReactNode
  users: PostUser[]
  reaction: React.ReactNode
}) {
  const menuRef = useRef<Menu>(null)
  return (
    <Menu
      ref={menuRef}
      renderer={renderers.Popover}
      rendererProps={{
        placement: 'bottom',
        anchorStyle: {
          backgroundColor: colors.gray[900],
        }
      }}      
    >
      <MenuTrigger>{children}</MenuTrigger>
      <MenuOptions customStyles={{
        optionsContainer: {
          backgroundColor: colors.gray[900],
        },
      }}>
        <View className="p-2 pb-0">
          <Text className="text-gray-200 text-sm">
            {reaction} by
          </Text>
        </View>
        <View className="bg-gray-900 rounded-lg p-2">
          {users.map((user) => (
            <Link
              asChild
              key={user.id}
              href={`/user/${user.url}`}
              onPress={() => {
                menuRef.current?.close()
              }}
            >
              <Pressable className="my-1 flex-row items-center gap-2">
                <Image
                  className="rounded-lg"
                  source={{ uri: formatSmallAvatar(user) }}
                  style={{ width: 24, height: 24 }}
                />
                <Text className="text-gray-200 flex-grow flex-shrink-0">
                  {user.url}
                </Text>
              </Pressable>
            </Link>
          ))}
        </View>
      </MenuOptions>
    </Menu>
  )
}
