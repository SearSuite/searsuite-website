"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { Link } from './Link.js';
export function SiteNavigation({ items, label = 'Main navigation' }) {
    return _jsx("nav", { className: "site-nav searsuite-site-navigation", "aria-label": label, "data-searsuite-component": "SiteNavigation", children: items.map(item => _jsx(Link, { href: item.href, className: item.current ? 'is-current' : undefined, "aria-current": item.current ? 'page' : undefined, children: item.label }, item.href)) });
}
