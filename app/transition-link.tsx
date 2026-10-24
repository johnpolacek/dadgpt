"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ComponentProps } from "react";
import { leaveThen } from "@/lib/transition";

/** A Link that plays the page's outro first. Modified clicks and new tabs stay native, since onNavigate skips them. */
export default function TransitionLink({ href, onNavigate, ...props }: ComponentProps<typeof Link> & { href: string }) {
  const router = useRouter();
  return (
    <Link
      href={href}
      {...props}
      onNavigate={(event) => {
        onNavigate?.(event);
        event.preventDefault();
        leaveThen(() => (props.replace ? router.replace(href, { scroll: props.scroll ?? true }) : router.push(href, { scroll: props.scroll ?? true })));
      }}
    />
  );
}
