import { tokens } from '../theme/theme';

/**
 * The icon tile's size in a category's exercise grid, for a screen width: two
 * cards across the page's content, the tile filling a card inside its padding
 * and 1px border.
 */
export function exerciseGridTile(width: number): number {
  const content = width - 2 * tokens.space[24];
  const card = (content - tokens.space[12]) / 2;
  return card - 2 * tokens.space[12] - 2;
}
