/** Paths reachable without signing in (login page + what iOS needs to install the app). */
export function isPublicPath(pathname: string): boolean {
  return (
    pathname === "/login" ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/apple-icon" ||
    pathname.startsWith("/icon/")
  );
}
