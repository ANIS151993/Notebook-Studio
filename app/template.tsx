"use client";

import { usePathname } from "next/navigation";

export default function Template({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="route-stage route-enter">
      {children}
    </div>
  );
}
