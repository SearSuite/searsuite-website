"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { SectionHeading } from './SectionHeading.js';
export function Section({ id, title, children }) {
    return (_jsxs("section", { className: "searsuite-section", id: id, children: [_jsx(SectionHeading, { id: id, title: title }), _jsx("div", { className: "searsuite-section-content", children: children })] }));
}
