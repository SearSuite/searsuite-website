"use client";
import { jsx as _jsx } from "react/jsx-runtime";
export function IconButton({ className = '', type = 'button', ...props }) {
    return _jsx("button", { ...props, type: type, className: `searsuite-icon-button${className ? ` ${className}` : ''}` });
}
