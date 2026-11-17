import { Center, Loader } from '@mantine/core'
import { type ComponentType, lazy, type LazyExoticComponent, Suspense } from 'react'

type Page = LazyExoticComponent<ComponentType>
const cache = new Map<string, Page>()

/**
 * Load a page's code only when it is first visited (keeps Markdown/KaTeX and editors out of the
 * initial bundle). `name` is the page's named export.
 */
export function lazyPage<K extends string>(load: () => Promise<{ [P in K]: ComponentType }>, name: K) {
  let Component = cache.get(name)
  if (!Component) {
    Component = lazy(async () => {
      const module = await load()
      return { default: module[name] }
    })
    cache.set(name, Component)
  }
  return (
    <Suspense
      fallback={
        <Center py="xl">
          <Loader />
        </Center>
      }
    >
      <Component />
    </Suspense>
  )
}
