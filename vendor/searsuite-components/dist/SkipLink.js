"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { Link } from './Link.js';
export function SkipLink({ href, children = 'Skip to main content' }) {
    return _jsx(Link, { className: "searsuite-skip-link", href: href, children: children });
}
