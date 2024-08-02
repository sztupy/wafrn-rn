import { PostMedia } from "@/lib/api/posts.types";
import { formatCachedUrl, formatMediaUrl } from "@/lib/formatters";
import { Text, useWindowDimensions, View } from "react-native";
import { POST_MARGIN } from "@/lib/api/posts";
import { isAudio, isImage, isPDF, isVideo } from "@/lib/api/media";
import ZoomableImage from "./ZoomableImage";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Link } from "expo-router";
import { ResizeMode, Video } from "expo-av";
import MediaCloak from "./MediaCloak";

export const MEDIA_MARGIN = POST_MARGIN + 9

export default function Media({ hidden, media }: { hidden: boolean; media: PostMedia }) {
  const src = formatCachedUrl(formatMediaUrl(media.url))
  const aspectRatio = media.aspectRatio || 1 
  const { width } = useWindowDimensions()
  const postWidth = width - MEDIA_MARGIN

  return (
    <View
      className="overflow-hidden m-2 ml-0 border border-gray-300 rounded-lg"
      style={{ opacity: hidden ? 0 : 1 }}
    >
      <MediaCloak
        backgroundImage={{
          src,
          width: postWidth,
          aspectRatio
        }}
        isNSFW={media.NSFW}
      >
        {isVideo(src) && (
          <Video
            source={{ uri: src }}
            resizeMode={ResizeMode.CONTAIN}
            style={{ width: postWidth, height: postWidth * aspectRatio }}
            isLooping
            usePoster
          />
        )}
        {isAudio(src) && (
          <Text className="text-white p-2 italic">Audio not yet supported :c</Text>
          // <audio
          //   className="rounded-md"
          //   controls
          //   src={url}
          // />
        )}
        {/* Why PDF? I don't know but original wafrn angular frontend handled it  */}
        {isPDF(src) && (
          <View className="flex-row gap-2">
            <MaterialCommunityIcons name="file-pdf-box" size={24} color="white" />
            <Link href={src}>{src}</Link>
          </View>
        )}
        {isImage(src) && (
          <ZoomableImage
            src={src}
            hidden={hidden}
            width={postWidth}
            aspectRatio={aspectRatio}
            contentFit="contain"
            className="rounded-t-md max-w-full"
          />
        )}
      </MediaCloak>
      <Text className="text-white text-xs p-2 bg-blue-950 rounded-lg">
        {media.description || 'No alt text'}
      </Text>
    </View>
  )
}
