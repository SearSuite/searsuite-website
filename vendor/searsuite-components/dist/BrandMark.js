"use client";
import { jsx as _jsx } from "react/jsx-runtime";
export function BrandMark({ mark }) {
    if (mark === null)
        return null;
    return mark === undefined
        ? _jsx("span", { className: "searsuite-brand-mark searsuite-brand-mark-searsuite", "aria-hidden": "true" })
        : _jsx("span", { className: "searsuite-brand-mark", children: mark });
}
