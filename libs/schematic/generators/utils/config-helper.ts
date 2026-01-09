/**
 * Normalizes an action name by:
 * \- removing a trailing file extension,
 * \- replacing whitespace with hyphens,
 * \- converting to lowercase.
 *
 * @param action - The action string to normalize (e.g., a filename or label).
 * @returns The normalized action name.
 *
 * @example
 * // Removes extension, trims spaces, hyphenates, and lowercases
 * normalizeActionName('Generate Component.ts'); // 'generate-component'
 *
 * @example
 * // Multiple spaces become single hyphens
 * normalizeActionName('Build   Prod'); // 'build-prod'
 */
export function normalizeActionName(action: string) {
  return action
    .replace(/\.[^/.]+$/, '')
    .replace(/\s+/g, '-')
    .toLowerCase();
}

/**
 * Cuts off any subtitle from an action name by extracting the substring before the first colon
 *
 * @param action - The action string to normalize (e.g., a filename or label).
 * @returns The action icon name.
 *
 * @example
 * // Removes title
 * normalizeActionName('custom-icon.svg:Custom Icon Title'); // 'custom-icon.svg'
 */
export function extractActionIconName(action: string) {
  return action.split(':')[0].trim();
}
