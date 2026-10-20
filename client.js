/**
 * dsh-open-workspace-folder — desktop-first client half.
 *
 * A tiny, dependency-free DSH web plugin bundle:
 *  - listens for a right-click on a workspace tree row;
 *  - resolves the row's title against the live workspaces snapshot;
 *  - opens, reveals, or copies that workspace path through the built-in
 *    Session Remote (`session.openWorkspacePath`), so DSH Desktop performs the
 *    native Explorer/Finder/xdg-open gesture on the host;
 *  - renames the workspace in place through `remote.workspace.rename`, the same
 *    Command the sidebar's own rename action uses, so the title survives a
 *    restart and every open window sees it.
 *
 * No host route, child process, network request, external asset, or other
 * plugin's DOM is used. The menu closes on outside click, Escape, scroll, or
 * resize, and supports arrow-key navigation.
 */
window.__ModuleLoader__.load({
  id: 'dsh-open-workspace-folder',
  factory: (require) => {
    var module = { exports: {} }
    var exports = module.exports
    const React = require('react')

    const CSS_ID = 'dsh-open-workspace-folder/menu.css'
    const CSS = `
.owf-menu {
  --owf-bg: #ffffff;
  --owf-fg: #18181b;
  --owf-muted: #71717a;
  --owf-border: rgba(24, 24, 27, .14);
  --owf-hover: rgba(24, 24, 27, .06);
  --owf-accent: #4f46e5;
  position: fixed;
  z-index: 2147483000;
  box-sizing: border-box;
  width: max-content;
  min-width: 268px;
  max-width: min(380px, calc(100vw - 16px));
  padding: 6px;
  border: 1px solid var(--owf-border);
  border-radius: 13px;
  background: var(--owf-bg);
  color: var(--owf-fg);
  box-shadow: 0 24px 60px rgba(0, 0, 0, .24), 0 2px 10px rgba(0, 0, 0, .12);
  font-family: "Segoe UI Variable", "Segoe UI", "Microsoft YaHei UI", "Microsoft YaHei", system-ui, sans-serif;
  font-size: 13px;
  line-height: 20px;
  user-select: none;
  animation: owf-pop .12s cubic-bezier(.2, .8, .2, 1);
  transform-origin: top left;
}
.owf-menu[data-owf-theme="dark"] {
  --owf-bg: #1c1c1f;
  --owf-fg: #f4f4f5;
  --owf-muted: #a1a1aa;
  --owf-border: rgba(255, 255, 255, .16);
  --owf-hover: rgba(255, 255, 255, .08);
  --owf-accent: #a5b4fc;
  box-shadow: 0 26px 70px rgba(0, 0, 0, .46), 0 2px 12px rgba(0, 0, 0, .3);
}
.owf-head {
  min-width: 0;
  margin-bottom: 4px;
  padding: 8px 10px 9px;
  border-bottom: 1px solid var(--owf-border);
}
.owf-eyebrow {
  color: var(--owf-muted);
  font-size: 10px;
  line-height: 14px;
  letter-spacing: .12em;
  text-transform: uppercase;
}
.owf-title {
  margin-top: 2px;
  overflow: hidden;
  color: var(--owf-fg);
  font-size: 14px;
  font-weight: 650;
  line-height: 20px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.owf-path {
  margin-top: 2px;
  overflow: hidden;
  color: var(--owf-muted);
  font-family: ui-monospace, "Cascadia Mono", Consolas, monospace;
  font-size: 11px;
  line-height: 15px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.owf-item {
  display: flex;
  align-items: center;
  gap: 9px;
  width: 100%;
  min-height: 34px;
  box-sizing: border-box;
  padding: 6px 9px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.owf-item:hover:not(:disabled),
.owf-item:focus-visible {
  background: var(--owf-hover);
  outline: none;
}
.owf-item:focus-visible {
  box-shadow: inset 0 0 0 1px var(--owf-accent);
}
.owf-item:disabled {
  opacity: .42;
  cursor: default;
}
.owf-icon {
  display: inline-flex;
  flex: 0 0 16px;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
}
.owf-icon svg {
  display: block;
  width: 16px;
  height: 16px;
}
.owf-label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.owf-hint {
  flex: none;
  padding: 0 4px;
  border: 1px solid var(--owf-border);
  border-radius: 4px;
  color: var(--owf-muted);
  font-size: 10px;
  line-height: 15px;
  letter-spacing: .04em;
}
.owf-item[data-copied="true"] .owf-label {
  color: #16a34a;
}
.owf-menu[data-owf-theme="dark"] .owf-item[data-copied="true"] .owf-label {
  color: #86efac;
}
.owf-form {
  padding: 2px 4px 0;
}
.owf-input {
  box-sizing: border-box;
  width: 100%;
  min-height: 30px;
  padding: 5px 8px;
  border: 1px solid var(--owf-border);
  border-radius: 7px;
  background: transparent;
  color: var(--owf-fg);
  font: inherit;
  outline: none;
}
.owf-input:focus {
  border-color: var(--owf-accent);
  box-shadow: 0 0 0 2px rgba(79, 70, 229, .18);
}
.owf-input:disabled {
  opacity: .55;
}
.owf-input::placeholder {
  color: var(--owf-muted);
}
.owf-actions {
  display: flex;
  gap: 6px;
  margin-top: 6px;
}
.owf-btn {
  flex: 1;
  min-height: 30px;
  padding: 5px 10px;
  border: 1px solid var(--owf-border);
  border-radius: 7px;
  background: transparent;
  color: inherit;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}
.owf-btn:hover:not(:disabled) {
  background: var(--owf-hover);
}
.owf-btn:focus-visible {
  outline: none;
  box-shadow: inset 0 0 0 1px var(--owf-accent);
}
.owf-btn:disabled {
  opacity: .42;
  cursor: default;
}
.owf-btn[data-variant="primary"] {
  border-color: transparent;
  background: var(--owf-accent);
  color: #fff;
}
.owf-menu[data-owf-theme="dark"] .owf-btn[data-variant="primary"] {
  color: #101014;
}
.owf-keys {
  margin-top: 6px;
  color: var(--owf-muted);
  font-size: 10px;
  line-height: 14px;
}
.owf-sep {
  height: 1px;
  margin: 4px 8px;
  background: var(--owf-border);
}
.owf-note {
  padding: 2px 10px 6px;
  color: var(--owf-muted);
  font-size: 11px;
  line-height: 15px;
}
.owf-error {
  margin: 4px 4px 0;
  padding: 6px 8px;
  border-radius: 7px;
  background: rgba(220, 38, 38, .08);
  color: #dc2626;
  font-size: 11px;
  line-height: 15px;
  white-space: normal;
  overflow-wrap: anywhere;
}
.owf-menu[data-owf-theme="dark"] .owf-error {
  background: rgba(248, 113, 113, .1);
  color: #fca5a5;
}
@keyframes owf-pop {
  from { opacity: 0; transform: translateY(-3px) scale(.985); }
  to { opacity: 1; transform: none; }
}
@media (prefers-reduced-motion: reduce) {
  .owf-menu { animation: none; }
}
`

    const runtime = {
      ctx: undefined,
      remote: undefined,
      themeMode: 'light',
      workspaces: []
    }
    const themeListeners = new Set()

    function modeOf(snapshot) {
      if (snapshot === null || typeof snapshot !== 'object') return 'light'
      if (snapshot.active !== null && typeof snapshot.active === 'object' && snapshot.active.colorScheme === 'dark') return 'dark'
      if (snapshot.colorScheme === 'dark') return 'dark'
      return 'light'
    }

    function setThemeMode(mode) {
      if (mode === runtime.themeMode) return
      runtime.themeMode = mode
      for (const listener of themeListeners) listener()
    }

    function subscribeTheme(listener) {
      themeListeners.add(listener)
      return () => {
        themeListeners.delete(listener)
      }
    }

    function getThemeMode() {
      return runtime.themeMode
    }

    function remoteOf() {
      if (runtime.remote !== undefined) return runtime.remote
      const ctx = runtime.ctx
      if (ctx === undefined) return undefined
      if (ctx.remote !== undefined) return ctx.remote
      if (typeof ctx.get === 'function') return ctx.get('remote')
      return undefined
    }

    function normalize(value) {
      return typeof value === 'string' ? value.replace(/\\s+/g, ' ').trim() : ''
    }

    function rowTitle(row) {
      const titleNode = row.querySelector('span[class$="_title"]')
      let title = titleNode === null ? '' : normalize(titleNode.textContent)
      if (title === '') title = normalize(row.getAttribute('aria-label'))
      if (title === '') {
        const titled = row.querySelector('[title]')
        title = titled === null ? '' : normalize(titled.getAttribute('title'))
      }
      if (title === '') title = normalize(row.textContent)
      return title
    }

    function workspaceAt(node) {
      if (node === null || typeof node !== 'object' || typeof node.closest !== 'function') return null
      const row = node.closest('[role="treeitem"]')
      if (row === null) return null
      if (row.hasAttribute('aria-selected') || !row.hasAttribute('aria-expanded')) return null
      const rowKey = row.getAttribute('data-row-key')
      if (typeof rowKey !== 'string' || rowKey.slice(0, 10) !== 'workspace:') return null
      const workspaceId = rowKey.slice(10)
      if (workspaceId === '') return null
      const title = rowTitle(row)
      if (title === '') return null
      let workspace = null
      for (const candidate of runtime.workspaces) {
        if (candidate === null || typeof candidate !== 'object') continue
        if (String(candidate.workspaceId) === workspaceId || String(candidate.id) === workspaceId) {
          workspace = candidate
          break
        }
      }
      if (workspace === null) {
        const matches = []
        for (const candidate of runtime.workspaces) {
          if (candidate !== null && typeof candidate === 'object' && normalize(candidate.title) === title) matches.push(candidate)
        }
        if (matches.length !== 1) return null
        workspace = matches[0]
      }
      if (typeof workspace.path !== 'string' || workspace.path.trim() === '') return null
      return {
        title: normalize(workspace.title) || title,
        path: workspace.path,
        workspaceId: String(workspace.workspaceId ?? workspace.id ?? workspaceId)
      }
    }

    async function canOpenNow() {
      const remote = remoteOf()
      if (remote === undefined || remote.session === undefined || typeof remote.session.canOpenWorkspacePath !== 'function') return false
      try {
        const result = await remote.session.canOpenWorkspacePath()
        return Boolean(result !== null && typeof result === 'object' && result.ok === true && result.value === true)
      } catch {
        return false
      }
    }

    function workspaceService() {
      const ctx = runtime.ctx
      if (ctx === undefined || ctx === null || typeof ctx.get !== 'function') return undefined
      return ctx.get('workspaces')
    }

    function renameFailureMessage(cause) {
      const raw = cause instanceof Error ? cause.message : String(cause)
      const match = /workspace\s+rename\s+failed:\s*([^:]+):\s*([\s\S]*)$/.exec(raw)
      const code = match === null ? '' : match[1].trim()
      const detail = match === null ? raw : match[2].trim()
      if (code === 'workspace/name-conflict') return '已有同名工作区，请换一个名称。'
      if (code === 'gateway/bad-request') return detail === '' ? '名称不能为空。' : detail
      return detail === '' ? '重命名失败。' : detail
    }

    async function renameWorkspace(workspaceId, title) {
      const service = workspaceService()
      if (service !== undefined && service !== null && typeof service.rename === 'function') {
        await service.rename(workspaceId, title)
        return
      }
      const remote = remoteOf()
      if (remote === undefined || remote.workspace === undefined || typeof remote.workspace.rename !== 'function') {
        throw new Error('未找到 DSH 的工作区接口，请确认 Desktop 已更新。')
      }
      const result = await remote.workspace.rename({ workspaceId, title })
      if (result !== null && typeof result === 'object' && result.ok === true) return
      const error = result !== null && typeof result === 'object' ? result.error : undefined
      const code = error !== null && typeof error === 'object' ? String(error.code ?? '') : ''
      const message = error !== null && typeof error === 'object' ? normalize(error.message) : ''
      if (code === 'workspace/name-conflict') throw new Error('已有同名工作区，请换一个名称。')
      throw new Error(message === '' ? '重命名失败。' : message)
    }

    async function copyText(text) {
      if (navigator.clipboard !== undefined && typeof navigator.clipboard.writeText === 'function') {
        try {
          await navigator.clipboard.writeText(text)
          return
        } catch {
          // Fall through to the selection-based fallback.
        }
      }
      const area = document.createElement('textarea')
      area.value = text
      area.setAttribute('readonly', '')
      area.style.position = 'fixed'
      area.style.opacity = '0'
      area.style.pointerEvents = 'none'
      document.body.appendChild(area)
      area.select()
      let copied = false
      try {
        copied = document.execCommand('copy')
      } finally {
        area.remove()
      }
      if (!copied) throw new Error('复制失败，请检查剪贴板权限。')
    }

    function MenuIcon(props) {
      const paths = {
        open: [
          'M3 7.5A1.5 1.5 0 0 1 4.5 6H9l2 2h8.5A1.5 1.5 0 0 1 21 9.5v8A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5z',
          'M12 11v5',
          'M9.5 13.5 12 16l2.5-2.5'
        ],
        reveal: [
          'M3 7.5A1.5 1.5 0 0 1 4.5 6H9l2 2h8.5A1.5 1.5 0 0 1 21 9.5v8A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5z',
          'M15 16l4-4',
          'M15 12h4v4'
        ],
        copy: [
          'M8 8h10v12H8z',
          'M6 16H4V4h10v2'
        ],
        rename: [
          'M4 20h4l9.5-9.5a2.1 2.1 0 0 0-3-3L5 17z',
          'M14.5 6.5l3 3'
        ]
      }
      const list = paths[props.kind] || paths.open
      return React.createElement(
        'span',
        { className: 'owf-icon', 'aria-hidden': 'true' },
        React.createElement(
          'svg',
          {
            viewBox: '0 0 24 24',
            fill: 'none',
            stroke: 'currentColor',
            strokeWidth: 1.7,
            strokeLinecap: 'round',
            strokeLinejoin: 'round'
          },
          list.map((d) => React.createElement('path', { key: d, d }))
        )
      )
    }

    function WorkspaceMenuHost(props) {
      const useWorkspaces = props.useWorkspaces
      const [menu, setMenu] = React.useState(null)
      const [pos, setPos] = React.useState(null)
      const [busy, setBusy] = React.useState(false)
      const [error, setError] = React.useState('')
      const [copied, setCopied] = React.useState(false)
      const [canOpen, setCanOpen] = React.useState(null)
      const [editing, setEditing] = React.useState(false)
      const [draft, setDraft] = React.useState('')
      const menuRef = React.useRef(null)
      const inputRef = React.useRef(null)
      const dark = typeof React.useSyncExternalStore === 'function'
        ? React.useSyncExternalStore(subscribeTheme, getThemeMode) === 'dark'
        : runtime.themeMode === 'dark'

      if (typeof useWorkspaces === 'function') {
        useWorkspaces((state) => {
          const items = state !== null && typeof state === 'object' && Array.isArray(state.items) ? state.items : []
          runtime.workspaces = items
          return items.length
        })
      }

      React.useEffect(() => {
        let alive = true
        canOpenNow().then((value) => {
          if (alive) setCanOpen(value)
        })
        return () => {
          alive = false
        }
      }, [])

      React.useEffect(() => {
        const onContextMenu = (event) => {
          if (event.defaultPrevented) return
          const target = workspaceAt(event.target)
          if (target === null) return
          event.preventDefault()
          event.stopPropagation()
          if (typeof event.stopImmediatePropagation === 'function') event.stopImmediatePropagation()
          setBusy(false)
          setError('')
          setCopied(false)
          setEditing(false)
          setDraft('')
          setMenu({
            ...target,
            x: event.clientX,
            y: event.clientY
          })
          canOpenNow().then((value) => setCanOpen(value))
        }
        document.addEventListener('contextmenu', onContextMenu, true)
        return () => document.removeEventListener('contextmenu', onContextMenu, true)
      }, [])

      React.useEffect(() => {
        if (menu === null) return undefined
        const close = () => {
          setMenu(null)
          setPos(null)
          setError('')
          setCopied(false)
          setEditing(false)
          setDraft('')
        }
        const onPointerDown = (event) => {
          if (menuRef.current !== null && menuRef.current.contains(event.target)) return
          close()
        }
        const onKeyDown = (event) => {
          if (event.key !== 'Escape') return
          event.preventDefault()
          if (editing) {
            setEditing(false)
            setError('')
            return
          }
          close()
        }
        const onScroll = () => close()
        document.addEventListener('pointerdown', onPointerDown, true)
        document.addEventListener('keydown', onKeyDown, true)
        window.addEventListener('scroll', onScroll, true)
        window.addEventListener('resize', onScroll)
        return () => {
          document.removeEventListener('pointerdown', onPointerDown, true)
          document.removeEventListener('keydown', onKeyDown, true)
          window.removeEventListener('scroll', onScroll, true)
          window.removeEventListener('resize', onScroll)
        }
      }, [menu, editing])

      React.useLayoutEffect(() => {
        if (menu === null) {
          setPos(null)
          return
        }
        const node = menuRef.current
        if (node === null) return
        const margin = 8
        const rect = node.getBoundingClientRect()
        let left = menu.x
        let top = menu.y
        if (left + rect.width > window.innerWidth - margin) left = Math.max(margin, window.innerWidth - rect.width - margin)
        if (top + rect.height > window.innerHeight - margin) top = Math.max(margin, window.innerHeight - rect.height - margin)
        setPos((current) => current !== null && current.left === left && current.top === top ? current : { left, top })
      }, [menu, error, copied, canOpen, busy, editing])

      React.useLayoutEffect(() => {
        if (menu === null) return
        if (editing) return
        const node = menuRef.current
        if (node === null) return
        const first = node.querySelector('button:not(:disabled)')
        if (first !== null) first.focus({ preventScroll: true })
      }, [menu, editing])

      React.useLayoutEffect(() => {
        if (!editing) return
        const node = inputRef.current
        if (node === null) return
        node.focus({ preventScroll: true })
        node.select()
      }, [editing])

      const onMenuKeyDown = (event) => {
        if (inputRef.current !== null && event.target === inputRef.current) return
        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp' && event.key !== 'Home' && event.key !== 'End') return
        const node = menuRef.current
        if (node === null) return
        const buttons = Array.from(node.querySelectorAll('button:not(:disabled)'))
        if (buttons.length === 0) return
        const current = buttons.indexOf(document.activeElement)
        let next = current
        if (event.key === 'ArrowDown') next = current < 0 ? 0 : (current + 1) % buttons.length
        else if (event.key === 'ArrowUp') next = current < 0 ? buttons.length - 1 : (current - 1 + buttons.length) % buttons.length
        else if (event.key === 'Home') next = 0
        else next = buttons.length - 1
        event.preventDefault()
        buttons[next].focus({ preventScroll: true })
      }

      const run = async (kind) => {
        if (menu === null || busy) return
        setBusy(true)
        setError('')
        setCopied(false)
        try {
          if (kind === 'copy') {
            await copyText(menu.path)
            setCopied(true)
            return
          }
          if (canOpen === false) throw new Error('当前窗口不支持打开本地文件夹。')
          const remote = remoteOf()
          if (remote === undefined || remote.session === undefined || typeof remote.session.openWorkspacePath !== 'function') {
            throw new Error('未找到 DSH 的本地打开接口，请确认 Desktop 已更新。')
          }
          const request = kind === 'reveal'
            ? { path: menu.path, action: 'reveal' }
            : { path: menu.path }
          const result = await remote.session.openWorkspacePath(request)
          if (result === null || typeof result !== 'object' || result.ok !== true) {
            const detail = result !== null && typeof result === 'object' && result.error !== null && typeof result.error === 'object'
              ? normalize(result.error.message)
              : ''
            throw new Error(detail === '' ? '系统未能打开该文件夹。' : detail)
          }
          setMenu(null)
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : String(cause))
        } finally {
          setBusy(false)
        }
      }

      const submitRename = async () => {
        if (menu === null || busy) return
        const title = draft.trim()
        if (title === '') {
          setError('名称不能为空。')
          return
        }
        if (title === menu.title) {
          setEditing(false)
          setError('')
          return
        }
        setBusy(true)
        setError('')
        setCopied(false)
        try {
          await renameWorkspace(menu.workspaceId, title)
          setEditing(false)
          setDraft('')
          setMenu(null)
          setPos(null)
        } catch (cause) {
          setError(renameFailureMessage(cause))
        } finally {
          setBusy(false)
        }
      }

      const beginRename = () => {
        if (menu === null || busy) return
        setError('')
        setCopied(false)
        setDraft(menu.title)
        setEditing(true)
      }

      const cancelRename = () => {
        setEditing(false)
        setError('')
      }

      if (menu === null) return null

      const style = pos === null ? { left: menu.x, top: menu.y } : { left: pos.left, top: pos.top }
      const openDisabled = busy || canOpen === false
      const head = React.createElement('div', { key: 'head', className: 'owf-head' }, [
        React.createElement('div', { key: 'eyebrow', className: 'owf-eyebrow' }, editing ? '重命名工作区' : '工作区'),
        React.createElement('div', { key: 'title', className: 'owf-title', title: menu.title }, menu.title),
        React.createElement('div', { key: 'path', className: 'owf-path', title: menu.path }, menu.path)
      ])
      const renameForm = [
        React.createElement('div', { key: 'form', className: 'owf-form' }, [
          React.createElement('input', {
            key: 'input',
            ref: inputRef,
            className: 'owf-input',
            type: 'text',
            value: draft,
            placeholder: '工作区名称',
            'aria-label': '工作区名称',
            maxLength: 200,
            disabled: busy,
            onChange: (event) => setDraft(event.target.value),
            onKeyDown: (event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                event.stopPropagation()
                submitRename()
                return
              }
              if (event.key === 'Escape') {
                event.preventDefault()
                event.stopPropagation()
                cancelRename()
              }
            }
          }),
          React.createElement('div', { key: 'actions', className: 'owf-actions' }, [
            React.createElement('button', {
              key: 'save',
              type: 'button',
              className: 'owf-btn',
              'data-variant': 'primary',
              disabled: busy || draft.trim() === '',
              onClick: () => {
                submitRename()
              }
            }, busy ? '保存中…' : '保存'),
            React.createElement('button', {
              key: 'cancel',
              type: 'button',
              className: 'owf-btn',
              disabled: busy,
              onClick: cancelRename
            }, '取消')
          ])
        ]),
        React.createElement('div', { key: 'keys', className: 'owf-keys' }, 'Enter 保存 · Esc 取消'),
        error !== '' && React.createElement('div', { key: 'error', className: 'owf-error', role: 'alert' }, error)
      ]
      return React.createElement(
        'div',
        {
          ref: menuRef,
          className: 'owf-menu',
          role: editing ? 'dialog' : 'menu',
          'aria-label': editing ? '重命名工作区' : '工作区操作',
          'data-owf-theme': dark ? 'dark' : 'light',
          style,
          onContextMenu: (event) => {
            event.preventDefault()
            event.stopPropagation()
          },
          onKeyDown: onMenuKeyDown
        },
        editing ? [head, ...renameForm] : [
          React.createElement('div', { key: 'sep1', className: 'owf-sep', role: 'separator' }),
          React.createElement(
            'button',
            {
              key: 'open',
              type: 'button',
              role: 'menuitem',
              className: 'owf-item',
              disabled: openDisabled,
              onClick: () => {
                run('open')
              }
            },
            [
              React.createElement(MenuIcon, { key: 'icon', kind: 'open' }),
              React.createElement('span', { key: 'label', className: 'owf-label' }, '打开工作区文件夹'),
              React.createElement('span', { key: 'hint', className: 'owf-hint' }, 'Enter')
            ]
          ),
          React.createElement(
            'button',
            {
              key: 'reveal',
              type: 'button',
              role: 'menuitem',
              className: 'owf-item',
              disabled: openDisabled,
              onClick: () => {
                run('reveal')
              }
            },
            [
              React.createElement(MenuIcon, { key: 'icon', kind: 'reveal' }),
              React.createElement('span', { key: 'label', className: 'owf-label' }, '在资源管理器中定位')
            ]
          ),
          React.createElement('div', { key: 'sep2', className: 'owf-sep', role: 'separator' }),
          React.createElement(
            'button',
            {
              key: 'rename',
              type: 'button',
              role: 'menuitem',
              className: 'owf-item',
              disabled: busy,
              onClick: () => {
                beginRename()
              }
            },
            [
              React.createElement(MenuIcon, { key: 'icon', kind: 'rename' }),
              React.createElement('span', { key: 'label', className: 'owf-label' }, '重命名工作区')
            ]
          ),
          React.createElement(
            'button',
            {
              key: 'copy',
              type: 'button',
              role: 'menuitem',
              className: 'owf-item',
              'data-copied': copied ? 'true' : undefined,
              disabled: busy,
              onClick: () => {
                run('copy')
              }
            },
            [
              React.createElement(MenuIcon, { key: 'icon', kind: 'copy' }),
              React.createElement('span', { key: 'label', className: 'owf-label' }, copied ? '已复制路径' : '复制路径')
            ]
          ),
          canOpen === false && React.createElement('div', { key: 'note', className: 'owf-note' }, '当前窗口不支持打开本地文件夹。'),
          error !== '' && React.createElement('div', { key: 'error', className: 'owf-error', role: 'alert' }, error)
        ]
      )
    }

    function apply(ctx) {
      runtime.ctx = ctx
      runtime.remote = typeof ctx.get === 'function' ? ctx.get('remote') : ctx.remote
      const slots = typeof ctx.get === 'function' ? ctx.get('slots') : ctx.slots
      if (slots === undefined || slots === null || typeof slots.inject !== 'function') return
      const theme = typeof ctx.get === 'function' ? ctx.get('theme') : undefined
      if (theme !== undefined && theme !== null && typeof theme.getTheme === 'function') {
        setThemeMode(modeOf(theme.getTheme()))
        if (typeof ctx.on === 'function') ctx.on('theme/change', (snapshot) => setThemeMode(modeOf(snapshot)))
      }
      const mountStyle = () => {
        if (document.querySelector('style[data-plugin-css="' + CSS_ID + '"]') !== null) return () => {}
        const style = document.createElement('style')
        style.dataset.plugin = 'dsh-open-workspace-folder'
        style.dataset.pluginCss = CSS_ID
        style.textContent = CSS
        document.head.appendChild(style)
        return () => {
          style.remove()
        }
      }
      if (typeof ctx.effect === 'function') ctx.effect(mountStyle, 'dsh-open-workspace-folder: styles')
      else mountStyle()
      slots.inject('shell.overlay', () => slots.register({
        name: 'shell.overlay',
        id: 'dsh-open-workspace-folder',
        order: 120
      }, WorkspaceMenuHost))
    }

    exports.inject = ['remote', 'remote.session']
    exports.apply = apply
    return module.exports
  }
})
