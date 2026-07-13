import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from 'react'
import type { ReactNode } from 'react'
import type { Id } from '@/api'
import { WorkspaceStore } from './workspace-store'
import type { WorkspaceState } from './workspace-types'

const WorkspaceContext = createContext<WorkspaceStore | null>(null)

/** 为某 episode 建立并挂载 WorkspaceStore，卸载时清理订阅。 */
export function WorkspaceProvider({
  episodeId,
  children,
}: {
  episodeId: Id
  children: ReactNode
}) {
  const storeRef = useRef<WorkspaceStore | null>(null)
  if (!storeRef.current || storeRef.current.episodeId !== episodeId) {
    storeRef.current = new WorkspaceStore(episodeId)
  }
  const store = storeRef.current

  useEffect(() => {
    void store.init()
    return () => store.dispose()
  }, [store])

  return (
    <WorkspaceContext.Provider value={store}>
      {children}
    </WorkspaceContext.Provider>
  )
}

export function useWorkspaceStore(): WorkspaceStore {
  const store = useContext(WorkspaceContext)
  if (!store) throw new Error('useWorkspaceStore 必须在 WorkspaceProvider 内使用')
  return store
}

const NO_WORKSPACE = Symbol('no-workspace')

/** 订阅整个工作台状态；无 Provider 时返回 null。 */
export function useOptionalWorkspaceState(): WorkspaceState | null {
  const store = useContext(WorkspaceContext)
  const snapshot = useSyncExternalStore(
    (listener) => (store ? store.subscribe(listener) : () => {}),
    () => (store ? store.getState() : NO_WORKSPACE),
  )
  return snapshot === NO_WORKSPACE ? null : snapshot
}

/** 订阅整个工作台状态。 */
export function useWorkspaceState(): WorkspaceState {
  const store = useWorkspaceStore()
  return useSyncExternalStore(store.subscribe, store.getState)
}

/** 选择状态切片，减少无关重渲染。 */
export function useWorkspaceSelector<T>(selector: (s: WorkspaceState) => T): T {
  const store = useWorkspaceStore()
  const selectorRef = useRef(selector)
  selectorRef.current = selector
  return useSyncExternalStore(
    store.subscribe,
    useMemo(
      () => () => selectorRef.current(store.getState()),
      [store],
    ),
  )
}
