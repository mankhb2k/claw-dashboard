import { Suspense } from "react";

import { OAuthPopupBridge } from "./_components/OAuthPopupBridge/OAuthPopupBridge";

export default function ConnectorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Suspense fallback={null}>
        <OAuthPopupBridge />
      </Suspense>
      {children}
    </>
  );
}
