import { Link2 } from 'lucide-react'

const URL_REGEX = /https?:\/\/[^\s]+/g

function linkifyLine(line: string, keyPrefix: string) {
  const matches = [...line.matchAll(URL_REGEX)]
  if (matches.length === 0) return line

  const nodes: React.ReactNode[] = []
  let cursor = 0
  matches.forEach((m, i) => {
    const url = m[0]
    const start = m.index ?? 0
    if (start > cursor) nodes.push(line.slice(cursor, start))
    nodes.push(
      <a
        key={`${keyPrefix}-${i}`}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline underline-offset-2 hover:opacity-80 break-all"
      >
        {url}
      </a>
    )
    cursor = start + url.length
  })
  if (cursor < line.length) nodes.push(line.slice(cursor))
  return nodes
}

export function TaskDescription({ text }: { text: string }) {
  const blocks = text.split(/\n+/).map(b => b.trim()).filter(Boolean)
  const references = Array.from(new Set(text.match(URL_REGEX) ?? []))

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {blocks.map((block, i) => (
          <p key={i} className="text-sm text-muted-foreground leading-relaxed">
            {linkifyLine(block, `p${i}`)}
          </p>
        ))}
      </div>

      {references.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
            References
          </p>
          <div className="flex flex-col gap-1.5">
            {references.map((url, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline break-all w-fit"
              >
                <Link2 className="w-3 h-3 shrink-0" />
                {url}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
