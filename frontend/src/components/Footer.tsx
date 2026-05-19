export function Footer() {
  return (
    <footer className="mt-auto border-t border-dota-border px-4 py-8 text-center">
      <p className="text-xs text-gray-700">
        Powered by{' '}
        <a
          href="https://www.opendota.com"
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors hover:text-gray-500"
        >
          OpenDota API
        </a>
      </p>
      <p className="mt-1 text-xs text-gray-800">
        © {new Date().getFullYear()} StompTracker
      </p>
    </footer>
  )
}
