/** Swaps straight quotes for curly ones, since models reply with plain ' and " */
export function smartQuotes(text: string) {
  return text
    .replace(/(^|[\s([{“])'/g, "$1‘")
    .replace(/'/g, "’")
    .replace(/(^|[\s([{‘])"/g, "$1“")
    .replace(/"/g, "”");
}
