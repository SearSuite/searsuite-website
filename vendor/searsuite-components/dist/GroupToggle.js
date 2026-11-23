"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from './Button.js';
import { UiIcon } from './UiIcon.js';
export function GroupToggle({ label, open, controls, onClick }) {
    return _jsxs(Button, { variant: "group", "aria-expanded": open, "aria-controls": controls, onClick: onClick, children: [_jsx("span", { children: label }), _jsx(UiIcon, { name: "chevronDown", size: 16, "aria-hidden": "true", className: open ? '' : 'searsuite-chevron-closed' })] });
}
