"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { Link } from './Link.js';
export function SectionHeading({ id, title }) {
    return _jsx("h2", { className: "searsuite-section-heading", children: _jsx(Link, { href: `#${id}`, children: title }) });
}
