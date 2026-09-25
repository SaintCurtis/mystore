import { BuildMySetupClient } from "./BuildMySetupClient";
import type { Metadata } from "next";
import { SITE_URL } from "@/lib/constants/site";

export const metadata: Metadata = {
  title: "Build My Setup | The Saint's TechNet",
  description:
    "Tell us your use case and budget — our AI engineer recommends the perfect complete setup for you. Engineer-verified gadgets, warranty on every item, same-day shipping, after-sales support — the smartest way to buy gadgets in Nigeria.",
  alternates: { canonical: `${SITE_URL}/build-my-setup` },
  openGraph: {
    title: "Build My Setup | The Saint's TechNet",
    description: "AI-recommended, engineer-verified setups for your budget — warranty on every item, same-day shipping.",
    type: "website",
    siteName: "The Saint's TechNet",
    url: `${SITE_URL}/build-my-setup`,
  },
  twitter: {
    card: "summary_large_image",
    title: "Build My Setup | The Saint's TechNet",
    description: "AI-recommended, engineer-verified setups for your budget — warranty on every item, same-day shipping.",
  },
};

export default function BuildMySetupPage() {
  return <BuildMySetupClient />;
}
