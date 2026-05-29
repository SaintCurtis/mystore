// app/(app)/profile/page.tsx
import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { ProfileClient } from "./ProfileClient";

export const metadata: Metadata = {
  title: "My Profile | The Saint's TechNet",
  description: "Manage your contact details and saved delivery addresses.",
};

export default async function ProfilePage() {
  const { userId } = await auth();
  if (!userId) redirect("/");

  const user = await currentUser();

  return (
    <ProfileClient
      clerkUser={{
        email: user?.emailAddresses[0]?.emailAddress ?? "",
        name: user?.fullName ?? user?.firstName ?? "",
      }}
    />
  );
}