export const unwrapResponse = (res) => {
  const d = res?.data;
  if (d && typeof d === "object" && "data" in d) return d.data;
  return d ?? null;
};

export const unwrapList = (res) => {
  const d = res?.data;
  if (Array.isArray(d)) return d;
  if (d && Array.isArray(d.data)) return d.data;
  if (d && Array.isArray(d.content)) return d.content;
  return [];
};

export const getApiErrorMessage = (err, fallback = "An error occurred.") => {
  const data = err?.response?.data;
  if (typeof data === "string") return data;
  return data?.message || fallback;
};

export const getCurrentUserId = () => {
  try {
    const u = JSON.parse(localStorage.getItem("user") || "{}");
    return u.userID ?? u.userId ?? localStorage.getItem("userId");
  } catch {
    return localStorage.getItem("userId");
  }
};
