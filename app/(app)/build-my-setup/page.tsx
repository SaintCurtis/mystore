import { BuildMySetupClient } from "./BuildMySetupClient";

export const metadata = {
  title: "Build My Setup | The Saint's TechNet",
  description:
    "Tell us your use case and budget — our AI engineer recommends the perfect complete setup for you.",
};

export default function BuildMySetupPage() {
  return <BuildMySetupClient />;
}
