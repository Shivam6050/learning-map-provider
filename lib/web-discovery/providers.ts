export function providerName(url: string): string {
  let host = "";
  try { host = new URL(url).hostname.replace(/^www\./, ""); } catch { return "Course provider"; }
  const providers: Record<string, string> = {
    "udemy.com": "Udemy", "coursera.org": "Coursera", "pwskills.com": "Physics Wallah",
    "pw.live": "Physics Wallah", "geeksforgeeks.org": "GeeksforGeeks",
    "campus.w3schools.com": "W3Schools", "w3schools.com": "W3Schools",
    "youtube.com": "YouTube", "youtu.be": "YouTube", "freecodecamp.org": "freeCodeCamp",
  };
  return providers[host] ?? host;
}
export function isPaidCourseUrl(url: string): boolean {
  try {
    const u = new URL(url), host = u.hostname.replace(/^www\./, "");
    const routes: Record<string, RegExp> = {
      "udemy.com": /^\/course\/[^/]+\/?$/,
      "coursera.org": /^\/(learn|specializations|professional-certificates)\/[^/]+\/?$/,
      "pwskills.com": /^\/course\/[^/]+\/?$/,
      "geeksforgeeks.org": /^\/courses\/(?!search(?:\/|$))[^/]+\/?$/,
      "campus.w3schools.com": /^\/products\/[^/]+\/?$/,
    };
    return routes[host]?.test(u.pathname) ?? false;
  } catch { return false; }
}
