import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const prefs = req.nextauth.token?.preferences as
      | { quizCompleted?: boolean }
      | undefined;
    const path = req.nextUrl.pathname;
    if (
      prefs &&
      !prefs.quizCompleted &&
      !path.startsWith("/onboarding") &&
      !path.startsWith("/api") &&
      path !== "/login" &&
      path !== "/register"
    ) {
      return NextResponse.redirect(new URL("/onboarding/vibe-quiz", req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const publicPaths = [
          "/login",
          "/register",
          "/discover",
          "/map",
          "/vibes",
          "/place",
          "/itinerary/share",
        ];
        const path = req.nextUrl.pathname;
        if (publicPaths.some((p) => path === p || path.startsWith(p + "/"))) {
          return true;
        }
        if (
          path.startsWith("/api/places") ||
          path.startsWith("/api/recommendations") ||
          path.startsWith("/api/events") ||
          path.startsWith("/api/transport") ||
          path.startsWith("/api/itinerary/share")
        ) {
          return true;
        }
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/discover",
    "/map",
    "/vibes",
    "/itinerary/:path*",
    "/profile/:path*",
    "/onboarding/:path*",
    "/business/:path*",
    "/place/:path*",
  ],
};
