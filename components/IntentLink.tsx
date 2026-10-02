"use client";

import Link from "next/link";
import { useState, type ComponentProps } from "react";

type IntentLinkProps = Omit<ComponentProps<typeof Link>, "prefetch">;

/** Keep optional destinations off the initial network queue; warm them on intent. */
export function IntentLink({ onMouseEnter, onFocus, ...props }: IntentLinkProps) {
  const [active, setActive] = useState(false);
  return <Link {...props} prefetch={active ? null : false}
    onMouseEnter={event => { setActive(true); onMouseEnter?.(event); }}
    onFocus={event => { setActive(true); onFocus?.(event); }} />;
}
