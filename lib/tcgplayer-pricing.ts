const DEFAULT_TCGPLAYER_USD_VND_RATE = 23_000;

export function getTcgplayerUsdVndRate() {
  const configuredRate = process.env.TCGPLAYER_USD_VND_RATE?.trim();
  if (!configuredRate) {
    return DEFAULT_TCGPLAYER_USD_VND_RATE;
  }

  const rate = Number(configuredRate);
  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error(
      "TCGPLAYER_USD_VND_RATE phải là một số lớn hơn 0 hoặc để trống để dùng tỷ giá mặc định 23.000.",
    );
  }
  return rate;
}

export function getTcgplayerReferencePrice(
  priceUsd: number,
  rate = getTcgplayerUsdVndRate(),
) {
  if (!Number.isFinite(priceUsd) || priceUsd < 0) {
    return null;
  }

  const priceVnd = Math.round(priceUsd * rate);
  return Number.isSafeInteger(priceVnd) ? Math.max(1, priceVnd) : null;
}
