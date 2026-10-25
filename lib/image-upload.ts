export const MAX_IMAGE_UPLOAD_BYTES = 5 * 1024 * 1024;

export interface UploadedImage {
  data: Buffer;
  contentType: string;
}

const allowedImageTypes = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export async function parseUploadedImage(
  formData: FormData,
  fieldName = "image",
): Promise<{ image?: UploadedImage } | { error: string }> {
  const uploaded = formData.get(fieldName);
  if (uploaded === null) {
    return {};
  }
  if (!(uploaded instanceof File)) {
    return { error: "Tệp ảnh không hợp lệ." };
  }
  if (uploaded.size === 0) {
    return {};
  }
  if (!allowedImageTypes.includes(uploaded.type)) {
    return { error: "Ảnh phải có định dạng JPG, PNG, WebP hoặc GIF." };
  }
  if (uploaded.size > MAX_IMAGE_UPLOAD_BYTES) {
    return { error: "Ảnh không được vượt quá 5 MB." };
  }

  const data = Buffer.from(await uploaded.arrayBuffer());
  if (!matchesImageType(data, uploaded.type)) {
    return { error: "Tệp không khớp với định dạng ảnh đã chọn." };
  }

  return {
    image: {
      data,
      contentType: uploaded.type,
    },
  };
}

function matchesImageType(data: Buffer, contentType: string): boolean {
  if (contentType === "image/jpeg") {
    return data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff;
  }
  if (contentType === "image/png") {
    return data.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    );
  }
  if (contentType === "image/webp") {
    return (
      data.toString("ascii", 0, 4) === "RIFF" &&
      data.toString("ascii", 8, 12) === "WEBP"
    );
  }
  if (contentType === "image/gif") {
    const signature = data.toString("ascii", 0, 6);
    return signature === "GIF87a" || signature === "GIF89a";
  }
  return false;
}
