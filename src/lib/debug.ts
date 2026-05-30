/**
 * Rifinity WMS Colored Debug Console Logger
 */
export function debugLog(message: string, data?: any) {
  if (typeof window === 'undefined') return
  
  const debugEnabled = localStorage.getItem('rifinity_settings_ui_debug_mode') === 'true'
  if (!debugEnabled) return

  if (data !== undefined) {
    console.log(
      `%c[RIFINITY WMS DEBUG]%c ${message}`,
      'background: #3b82f6; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold;',
      'color: #3b82f6; font-weight: 500;',
      data
    )
  } else {
    console.log(
      `%c[RIFINITY WMS DEBUG]%c ${message}`,
      'background: #3b82f6; color: white; padding: 2px 6px; border-radius: 4px; font-weight: bold;',
      'color: #3b82f6; font-weight: 500;'
    )
  }
}
