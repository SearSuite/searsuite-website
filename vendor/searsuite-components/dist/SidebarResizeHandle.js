"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import { attachSidebarResizeHandle, sidebarResizeBounds } from './sidebarResize.js';
export function SidebarResizeHandle({ label = 'Resize sidebar' }) {
    const ref = useRef(null);
    useEffect(() => ref.current ? attachSidebarResizeHandle(ref.current) : undefined, []);
    return _jsx("div", { ref: ref, className: "searsuite-sidebar-resize-handle", role: "separator", "aria-orientation": "vertical", "aria-label": label, "aria-valuemin": sidebarResizeBounds.min, "aria-valuemax": sidebarResizeBounds.max, "aria-valuenow": 304, tabIndex: 0, title: label, "data-searsuite-component": "SidebarResizeHandle" });
}
