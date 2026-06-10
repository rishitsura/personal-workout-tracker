'use client'

/**
 * Lightweight markdown renderer — no external deps.
 * Handles: headings, bold, italic, bullet lists, numbered lists, code blocks, inline code, links.
 */
export default function MarkdownRenderer({ content }) {
  if (!content) return null

  const lines = content.split('\n')
  const elements = []
  let i = 0
  let listBuffer = []
  let listType = null // 'ul' | 'ol'

  const flushList = () => {
    if (listBuffer.length > 0) {
      if (listType === 'ol') {
        elements.push(
          <ol key={`ol-${elements.length}`} className="list-decimal list-inside space-y-1.5 mb-4 text-sm text-txt-secondary leading-relaxed pl-1">
            {listBuffer.map((item, j) => (
              <li key={j}>{renderInline(item)}</li>
            ))}
          </ol>
        )
      } else {
        elements.push(
          <ul key={`ul-${elements.length}`} className="space-y-1.5 mb-4 text-sm text-txt-secondary leading-relaxed">
            {listBuffer.map((item, j) => (
              <li key={j} className="flex items-start gap-2">
                <span className="text-accent mt-1.5 shrink-0 w-1.5 h-1.5 rounded-full bg-accent inline-block" />
                <span>{renderInline(item)}</span>
              </li>
            ))}
          </ul>
        )
      }
      listBuffer = []
      listType = null
    }
  }

  while (i < lines.length) {
    const line = lines[i]
    
    // Code block
    if (line.trim().startsWith('```')) {
      flushList()
      const codeLines = []
      i++
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      elements.push(
        <pre key={`code-${elements.length}`} className="bg-card-secondary rounded-xl p-4 mb-4 overflow-x-auto border border-border-subtle">
          <code className="text-xs font-mono text-txt-primary leading-relaxed">{codeLines.join('\n')}</code>
        </pre>
      )
      i++
      continue
    }

    // Headings
    if (line.startsWith('### ')) {
      flushList()
      elements.push(
        <h4 key={`h4-${elements.length}`} className="text-sm font-bold text-txt-primary mt-5 mb-2">
          {renderInline(line.slice(4))}
        </h4>
      )
      i++
      continue
    }
    if (line.startsWith('## ')) {
      flushList()
      elements.push(
        <h3 key={`h3-${elements.length}`} className="text-base font-bold text-txt-primary mt-6 mb-2.5 pb-2 border-b border-border-subtle">
          {renderInline(line.slice(3))}
        </h3>
      )
      i++
      continue
    }
    if (line.startsWith('# ')) {
      flushList()
      elements.push(
        <h2 key={`h2-${elements.length}`} className="font-display text-xl tracking-wider text-txt-primary mt-6 mb-3">
          {renderInline(line.slice(2))}
        </h2>
      )
      i++
      continue
    }

    // Unordered lists
    if (/^[\s]*[-*•]\s/.test(line)) {
      if (listType !== 'ul') {
        flushList()
        listType = 'ul'
      }
      listBuffer.push(line.replace(/^[\s]*[-*•]\s/, ''))
      i++
      continue
    }

    // Ordered lists
    if (/^[\s]*\d+[.)]\s/.test(line)) {
      if (listType !== 'ol') {
        flushList()
        listType = 'ol'
      }
      listBuffer.push(line.replace(/^[\s]*\d+[.)]\s/, ''))
      i++
      continue
    }

    // Empty line
    if (line.trim() === '') {
      flushList()
      i++
      continue
    }

    // Paragraph
    flushList()
    elements.push(
      <p key={`p-${elements.length}`} className="text-sm text-txt-secondary leading-relaxed mb-3">
        {renderInline(line)}
      </p>
    )
    i++
  }

  flushList()

  return <div className="markdown-content">{elements}</div>
}


/**
 * Render inline markdown: bold, italic, inline code, links
 */
function renderInline(text) {
  if (!text) return text

  // Split by inline patterns and reconstruct
  const parts = []
  let remaining = text
  let key = 0

  // Pattern: **bold**, *italic*, `code`, [text](url)
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`|\[(.+?)\]\((.+?)\))/g
  let lastIndex = 0
  let match

  while ((match = regex.exec(remaining)) !== null) {
    // Push text before match
    if (match.index > lastIndex) {
      parts.push(remaining.slice(lastIndex, match.index))
    }

    if (match[2]) {
      // **bold**
      parts.push(<strong key={`b-${key++}`} className="font-semibold text-txt-primary">{match[2]}</strong>)
    } else if (match[3]) {
      // *italic*
      parts.push(<em key={`i-${key++}`} className="italic">{match[3]}</em>)
    } else if (match[4]) {
      // `code`
      parts.push(
        <code key={`c-${key++}`} className="bg-card-secondary px-1.5 py-0.5 rounded text-xs font-mono text-accent">
          {match[4]}
        </code>
      )
    } else if (match[5] && match[6]) {
      // [text](url)
      parts.push(
        <a key={`a-${key++}`} href={match[6]} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-2 hover:text-accent-light">
          {match[5]}
        </a>
      )
    }

    lastIndex = match.index + match[0].length
  }

  // Push remaining text
  if (lastIndex < remaining.length) {
    parts.push(remaining.slice(lastIndex))
  }

  return parts.length > 0 ? parts : text
}
