"use client";

import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";

export default function SignOutButton() {
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/");
          router.refresh();
        },
      },
    });
  };

  return (
    <button
      onClick={handleSignOut}
      className="rounded-lg border border-[#f47f8a] px-5 py-2 text-sm font-semibold text-[#ffb3ba] transition hover:bg-[#f47f8a]/10"
    >
      Cerrar sesión
    </button>
  );
}
