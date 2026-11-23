"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Link } from './Link.js';
import { UiIcon } from './UiIcon.js';
export function SourceLink({ href, children = 'View source' }) {
    return _jsxs(Link, { variant: "source", href: href, target: "_blank", rel: "noopener noreferrer", children: [children, " ", _jsx(UiIcon, { name: "externalLink", size: 15, "aria-hidden": "true" })] });
}
