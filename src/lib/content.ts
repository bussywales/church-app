export function toYoutubeEmbedUrl(youtubeUrl: string | null) {
  if (!youtubeUrl) {
    return null;
  }

  try {
    const parsed = new URL(youtubeUrl);

    if (parsed.hostname.includes("youtu.be")) {
      const id = parsed.pathname.replace("/", "").trim();
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    if (parsed.hostname.includes("youtube.com")) {
      const id = parsed.searchParams.get("v")?.trim();
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }

    return null;
  } catch {
    return null;
  }
}

export function formatDateTime(dateValue: string) {
  return new Date(dateValue).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatDate(dateValue: string) {
  return new Date(dateValue).toLocaleDateString("en-GB", {
    dateStyle: "medium",
  });
}

export function toDatetimeLocalValue(dateValue: string | null) {
  if (!dateValue) {
    return "";
  }

  return new Date(dateValue).toISOString().slice(0, 16);
}
