/** Strip or close incomplete markdown tokens at end of streaming text. */
export function stabilizeStreamingMarkdown(text: string): string {
  if (!text) return text

  let result = text

  // Unclosed inline code
  const backtickCount = (result.match(/(?<!\\)`/g) ?? []).length
  if (backtickCount % 2 !== 0) {
    result = result.replace(/(`+)([^\n`]*)$/, '$1$2`')
  }

  // Unclosed bold
  const boldMatches = result.match(/\*\*/g)
  if (boldMatches && boldMatches.length % 2 !== 0) {
    result += '**'
  }

  // Unclosed link/image: [text](url
  if (/\[[^\]]*\]\([^)\n]*$/.test(result)) {
    result += ')'
  } else if (/\[[^\]\n]*$/.test(result)) {
    result = result.replace(/\[[^\]\n]*$/, '')
  }

  // Unclosed list item / dangling continuation line while streaming
  const lines = result.split('\n')
  const lastLine = lines[lines.length - 1] ?? ''
  if (/^\s*[-*•]\s*$/.test(lastLine)) {
    lines.pop()
    result = lines.join('\n')
  }

  return result
}
