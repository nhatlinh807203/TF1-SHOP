export const VIETQR_BANK_ID = "TCB";
export const VIETQR_ACCOUNT_NUMBER = "1234567896328";
export const VIETQR_ACCOUNT_NAME = "LE TIEN NHAT LINH";

export function normalizeVietQrAccountName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/gi, "d")
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

export function createVietQrUrl(amount: number, description: string) {
  if (!Number.isSafeInteger(amount) || amount < 1) {
    throw new Error("VietQR amount must be a positive safe integer.");
  }

  const query = new URLSearchParams({
    amount: String(amount),
    addInfo: description.slice(0, 50),
    accountName: normalizeVietQrAccountName(VIETQR_ACCOUNT_NAME),
  });
  return `https://img.vietqr.io/image/${VIETQR_BANK_ID}-${VIETQR_ACCOUNT_NUMBER}-compact2.png?${query.toString()}`;
}
