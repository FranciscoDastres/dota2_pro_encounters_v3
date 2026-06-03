import { useEffect } from 'react'

const KOFI_USERNAME = (import.meta.env.VITE_KOFI_USERNAME as string | undefined) ?? 'dnthdev'

declare global {
  interface Window {
    kofiWidgetOverlay?: {
      draw: (username: string, config: Record<string, string>) => void
    }
    __kofiWidgetOverlayLoaded?: boolean
  }
}

export function KofiWidget() {
  useEffect(() => {
    let script: HTMLScriptElement | null = null

    const draw = () => {
      window.kofiWidgetOverlay?.draw(KOFI_USERNAME, {
        type: 'floating-chat',
        'floating-chat.donateButton.text': 'Support me',
        'floating-chat.donateButton.background-color': '#29ABE0',
        'floating-chat.donateButton.text-color': '#fff',
      })
    }

    const loadWidget = () => {
      if (window.__kofiWidgetOverlayLoaded || document.querySelector('script[data-kofi-overlay="true"]')) {
        draw()
        return
      }

      script = document.createElement('script')
      script.src = 'https://storage.ko-fi.com/cdn/scripts/overlay-widget.js'
      script.async = true
      script.dataset.kofiOverlay = 'true'
      script.onload = () => {
        window.__kofiWidgetOverlayLoaded = true
        draw()
      }
      document.head.appendChild(script)
    }

    const timer = window.setTimeout(loadWidget, 3_000)

    return () => {
      window.clearTimeout(timer)
      if (script && document.head.contains(script)) document.head.removeChild(script)
    }
  }, [])

  return null
}
