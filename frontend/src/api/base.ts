const rawBase =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

const normalizeBase = (value: string) => {
  if (!value) return "";
  return value.endsWith("/") ? value.slice(0, -1) : value;
};

export const API_BASE_URL = normalizeBase(rawBase);

export const withApiBase = (path: string) => {
  if (!API_BASE_URL) {
    return path;
  }
  return `${API_BASE_URL}${path}`;
};
