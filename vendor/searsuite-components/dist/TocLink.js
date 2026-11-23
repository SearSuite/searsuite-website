"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { Link } from './Link.js';
export function TocLink({ id, title, active = false }) {
    return _jsx(Link, { variant: "toc", href: `#${id}`, className: active ? 'searsuite-toc-active' : undefined, "aria-current": active ? 'location' : undefined, children: title });
}
