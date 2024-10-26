import { Link, router, Stack, usePathname } from 'expo-router'
import { StyleSheet } from 'react-native'
import { ThemedText } from '@/components/ThemedText'
import { ThemedView } from '@/components/ThemedView'

export default function NotFoundScreen() {
  console.log(`not found: ${usePathname()}`)

  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <ThemedView style={styles.container}>
        <ThemedText type="title">
          This screen doesn't exist
        </ThemedText>
        <ThemedText type='default'>yet</ThemedText>
        {router.canGoBack() ? (
          <Link href=".." style={styles.link}>
            <ThemedText type="link">Go back</ThemedText>
          </Link>
        ) : (
          <Link href="/" style={styles.link}>
            <ThemedText type="link">Go to home screen!</ThemedText>
          </Link>
        )}
      </ThemedView>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
})
