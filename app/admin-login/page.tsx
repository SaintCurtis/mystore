"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const PASSWORD = "your-secret-password"; // 🔒 change this

export default function AdminLogin() {
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const router = useRouter();

  const handleLogin = () => {
    if (input === PASSWORD) {
      document.cookie = "admin_authed=true; path=/; max-age=86400";
      router.push("/admin");
    } else {
      setError(true);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-900 dark:bg-zinc-100">
          <span className="text-sm font-bold text-white dark:text-zinc-900">A</span>
        </div>
        <div>
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Admin Access</h1>
          <p className="text-sm text-zinc-500">Enter your password to continue</p>
        </div>
        <input
          type="password"
          placeholder="Password"
          value={input}
          onChange={(e) => { setInput(e.target.value); setError(false); }}
          onKeyDown={(e) => e.key === "Enter" && handleLogin()}
          className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
        />
        {error && <p className="text-sm text-red-500">Incorrect password</p>}
        <button
          onClick={handleLogin}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          Login
        </button>
      </div>
    </div>
  );
}