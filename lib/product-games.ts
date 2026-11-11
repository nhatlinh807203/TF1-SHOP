export const productGames = [
  { id: "riftbound", name: "Riftbound" },
  { id: "pokemon", name: "Pokémon" },
  { id: "digimon", name: "Digimon" },
  { id: "one-piece", name: "One Piece" },
] as const;

export type ProductGame = (typeof productGames)[number]["id"];

export function isProductGame(value: unknown): value is ProductGame {
  return productGames.some((game) => game.id === value);
}
