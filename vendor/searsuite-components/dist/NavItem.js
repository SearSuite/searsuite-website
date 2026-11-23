"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { Link } from './Link.js';
export function NavItem({ link, onNavigate, current = false }) {
    return _jsx(Link, { variant: "sidebar", href: link.href, onClick: onNavigate, "aria-current": current ? 'page' : undefined, children: link.label });
}
