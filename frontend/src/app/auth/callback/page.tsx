/**
 * OAuth callback handler page
 * Processes authentication tokens from OAuth providers (Google, GitHub)
 * Redirects based on user's onboarding status
 */
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function AuthCallbackPage() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      router.replace("/login?error=missing_token");
      return;
    }

    // Store authentication token for subsequent API requests
    localStorage.setItem("token", token);
    (async () => {
      try {
        const res = await fetch("http://localhost:5000/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data?.user?.onboardingCompleted) {
          router.replace("/dashboard");
        } else {
          router.replace("/setup");
        }
      } catch (_) {
        router.replace("/dashboard");
      }
    })();
  }, [params, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      Signing you in...
    </div>
  );
}
