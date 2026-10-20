/**
 * dsh-open-workspace-folder — host half.
 *
 * The feature lives entirely in the browser shell (`client.js`). Keeping this
 * half deliberately inert means the plugin never spawns a process and never
 * registers a route: it opens paths through DSH's existing Session Remote.
 */

export const name = 'dsh-open-workspace-folder'

export function apply() {
  // Nothing to mount on the host.
}
