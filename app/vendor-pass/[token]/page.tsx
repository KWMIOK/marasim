import { VendorPassContent } from "@/components/pages/vendor-pass-content";

export default async function VendorPassPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <VendorPassContent masterToken={token} />;
}
