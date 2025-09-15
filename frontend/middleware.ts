// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
"/(.*)",
"/sign-in(.*)",
"/sign-up(.*)",
"/forgot-password",
"/api/webhooks/user",
"not-found(.*)",

]);


const requests = new Map<string, { count: number; lastRequest: number }>();
const WINDOW = 60 * 1000; 
const MAX_REQ = 10;

export default clerkMiddleware(async (auth, req) => {
const { userId } = await auth();

// ---- Clerk Auth Guard ----
if (!userId && !isPublicRoute(req)) {
    return NextResponse.redirect(new URL("/sign-up", req.url));
}
if (userId && isPublicRoute(req)) {
    return NextResponse.redirect(new URL("/chat", req.url));
}

// ---- Rate Limiter ----
const key = userId || req.headers.get("x-forwarded-for") || "unknown";
const now = Date.now();
const entry = requests.get(key) || { count: 0, lastRequest: now };

// Reset count if outside window
if (now - entry.lastRequest > WINDOW) {
    entry.count = 0;
    entry.lastRequest = now;
}

entry.count++;
requests.set(key, entry);

if (entry.count > MAX_REQ) {
    return new NextResponse("Too many requests, try again later.", { status: 429 });
}

return NextResponse.next();
});

export const config = {
matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)"
],
};