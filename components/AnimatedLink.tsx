"use client";

import Link, { type LinkProps } from "next/link";
import { useRouter } from "next/navigation";
import { type AnchorHTMLAttributes, type MouseEvent, type ReactNode } from "react";
import { pushWithTransition } from "@/lib/view-transition";

type AnimatedLinkProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    children: ReactNode;
  };

function isModifiedEvent(event: MouseEvent<HTMLAnchorElement>) {
  return (
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    event.button !== 0
  );
}

function hrefToString(href: LinkProps["href"]) {
  if (typeof href === "string") {
    return href;
  }

  const query = href.query
    ? `?${new URLSearchParams(
        Object.entries(href.query).reduce<Record<string, string>>(
          (acc, [key, value]) => {
            if (typeof value === "string") {
              acc[key] = value;
            }
            return acc;
          },
          {},
        ),
      ).toString()}`
    : "";

  const hash = href.hash ? `#${href.hash}` : "";
  return `${href.pathname ?? ""}${query}${hash}`;
}

export default function AnimatedLink({
  href,
  onClick,
  target,
  children,
  ...rest
}: AnimatedLinkProps) {
  const router = useRouter();

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);

    if (
      event.defaultPrevented ||
      isModifiedEvent(event) ||
      (target && target !== "_self")
    ) {
      return;
    }

    const nextHref = hrefToString(href);
    if (!nextHref.startsWith("/")) {
      return;
    }

    event.preventDefault();
    pushWithTransition(router, nextHref);
  };

  return (
    <Link {...rest} href={href} onClick={handleClick} target={target}>
      {children}
    </Link>
  );
}
