import GenericRibbon from "@/components/GenericRibbon";
import Header, { HEADER_HEIGHT } from "@/components/Header";
import UserRibbon from "@/components/user/UserRibbon";
import { useIgnoreReportMutation, useReportList, useToggleBanUserMutation } from "@/lib/api/admin";
import { Report, REPORT_SEVERITY_DESCRIPTIONS, REPORT_SEVERITY_LABELS } from "@/lib/api/reports";
import { formatUserUrl } from "@/lib/formatters";
import useSafeAreaPadding from "@/lib/useSafeAreaPadding";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { FlashList } from "@shopify/flash-list";
import clsx from "clsx";
import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";
import colors from "tailwindcss/colors";

export default function ReportList() {
  const sx = useSafeAreaPadding()
  const { data } = useReportList()
  
  return (
    <View style={{ ...sx, flex: 1, paddingTop: sx.paddingTop + HEADER_HEIGHT }}>
      <Header title="Reports" />
      <FlashList
        data={data}
        estimatedItemSize={500}
        keyExtractor={item => String(item.id)}
        renderItem={({ item }) => (
          <ReportListItem report={item} />
        )}
      />
    </View>
  )
}

function ReportListItem({ report }: { report: Report }) {
  const ignoreReportMutation = useIgnoreReportMutation()
  const banMutation = useToggleBanUserMutation(report.user)
  const actionDisabled = ignoreReportMutation.isPending || banMutation.isPending || report.resolved
  
  return (
    <View className="p-3 bg-gray-800 rounded-lg mb-3">
      <GenericRibbon
        className="rounded-xl"
        user={report.user}
        userNameHTML={formatUserUrl(report.user)}
        link={`/user/${report.user.url}`}
        label="reported"
        icon={
          <MaterialIcons
            className="mx-1"
            name="report-problem"
            color={colors.red[200]}
            size={20}
          />
        }
      />
      <View className="mt-4 mb-2">
        <Text className="text-white">Reported user:</Text>
        <UserRibbon
          user={report.post.user}
          userName={report.post.user.name}
          showFollowButtons={false}
        />
      </View>
      <Text className="text-white">
        Reported post:{' '}
        <Link href={`/post/${report.post.id}`} className="text-blue-400 active:text-blue-600">
          See post
        </Link>
      </Text>
      <View className="mt-4 mb-2">
        <Text className="text-white mb-2">Report Severity:</Text>
        <View className="py-2 px-3 bg-gray-700 rounded-md">
          <Text className="text-white text-sm mb-2">{report.severity} - {REPORT_SEVERITY_LABELS[report.severity]}</Text>
          <Text className="text-white">{REPORT_SEVERITY_DESCRIPTIONS[report.severity]}</Text>
        </View>
      </View>
      <View className="my-4">
        <Text className="text-white mb-2">Report description:</Text>
        <View className="py-2 px-3 bg-gray-700 rounded-md">
          <Text className="text-white">{report.description}</Text>
        </View>
      </View>
      <View className="flex-row pt-4 gap-3 pr-3">
        <Pressable
          disabled={actionDisabled}
          className={clsx(
            'flex-row items-center gap-3 rounded-lg p-2 basis-1/2',
            'bg-cyan-700/50',
            {
              'active:bg-cyan-700/75': !actionDisabled,
              'opacity-50': actionDisabled,
            },
          )}
          onPress={() => ignoreReportMutation.mutate(report.id)}
        >
          <MaterialCommunityIcons name="check" size={20} color="white" />
          <Text className="text-white">
            {report.resolved ? 'Resolved' : 'Mark resolved'}
          </Text>
        </Pressable>
        <Pressable
          disabled={actionDisabled}
          className={clsx(
            'flex-row items-center gap-3 rounded-lg p-2 basis-1/2',
            'bg-red-700/50',
            {
              'active:bg-red-700/75': !actionDisabled,
              'opacity-50': actionDisabled,
            },
          )}
          onPress={() => banMutation.mutate(false)} // assume user is not banned previously
        >
          <MaterialCommunityIcons name="close" size={20} color="white" />
          <Text className="text-white">
            Ban user
          </Text>
        </Pressable>
      </View>
    </View>
  )
}
