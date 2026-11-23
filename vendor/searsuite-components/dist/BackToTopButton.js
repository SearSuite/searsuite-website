"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import { attachBackToTop } from './backToTopBehavior.js';
import { UiIcon } from './UiIcon.js';
export function BackToTop({ label = 'Back to top', showAfter = 400, alwaysVisible = false }) {
    const button = useRef(null);
    useEffect(() => button.current ? attachBackToTop(button.current) : undefined, [showAfter, alwaysVisible]);
    return _jsx("button", { ref: button, type: "button", className: "searsuite-icon-button searsuite-back-to-top", "aria-label": label, title: label, "data-searsuite-component": "BackToTop", "data-show-after": showAfter, "data-always-visible": alwaysVisible ? '' : undefined, hidden: !alwaysVisible, children: _jsx(UiIcon, { name: "arrowUp", size: 20, "aria-hidden": "true" }) });
}
