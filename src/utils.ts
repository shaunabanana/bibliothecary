export function formatWildcards(text: string) {
    return text.replace('*', '[^ \\t\\n\\r]*').replace('?', '[^ \\t\\n\\r]');
}