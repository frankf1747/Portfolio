"use client";

import { usePathname } from "next/navigation";
import { requestTransition } from "@/lib/transition";
import { ReactNode, MouseEvent } from "react";

export default function TransitionLink({
  href, children, className, cursor
}: { href: string; children: ReactNode; className?: string; cursor?: string }) {
  const pathname = usePathname();
  const onClick = (e: MouseEvent) => {
    e.preventDefault();
    if (href !== pathname) requestTransition(href);
  };
  return (
    <a href={href} onClick={onClick} className={className} data-cursor={cursor}>
      {children}
    </a>
  );
}
