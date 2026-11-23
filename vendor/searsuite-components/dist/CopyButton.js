"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef, useState } from 'react';
import { Button } from './Button.js';
import { UiIcon } from './UiIcon.js';
export function CopyButton({ markdown }) {
    const [copied, setCopied] = useState(false);
    const timer = useRef(null);
    useEffect(() => () => { if (timer.current)
        clearTimeout(timer.current); }, []);
    async function copyMarkdown() {
        try {
            await navigator.clipboard.writeText(markdown);
            setCopied(true);
            if (timer.current)
                clearTimeout(timer.current);
            timer.current = setTimeout(() => setCopied(false), 2400);
        }
        catch {
            setCopied(false);
        }
    }
    return _jsxs(Button, { onClick: copyMarkdown, "aria-label": copied ? 'Markdown copied' : 'Copy Markdown', children: [_jsx(UiIcon, { name: copied ? 'check' : 'copy', size: 16 }), copied ? 'Copied' : 'Copy Markdown'] });
}
