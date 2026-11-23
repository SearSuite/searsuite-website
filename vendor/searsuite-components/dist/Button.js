"use client";
import { jsx as _jsx } from "react/jsx-runtime";
export function Button({ variant = 'action', selected = false, className = '', type = 'button', ...props }) {
    const variantClass = {
        action: 'searsuite-action-button',
        feedback: 'searsuite-feedback-button',
        group: 'searsuite-group-heading',
    }[variant];
    return _jsx("button", { ...props, type: type, className: `${variantClass}${selected ? ' searsuite-selected' : ''}${className ? ` ${className}` : ''}` });
}
