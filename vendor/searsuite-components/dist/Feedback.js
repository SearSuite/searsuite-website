"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Button } from './Button.js';
export function Feedback({ question = 'Was this page helpful?' }) {
    const [value, setValue] = useState(null);
    return _jsxs("div", { className: "searsuite-feedback", children: [_jsx("h2", { children: question }), _jsxs("div", { children: [_jsx(Button, { variant: "feedback", selected: value === 'yes', onClick: () => setValue('yes'), children: "Yes" }), _jsx(Button, { variant: "feedback", selected: value === 'no', onClick: () => setValue('no'), children: "No" })] }), value && _jsx("p", { role: "status", children: "Thanks for your feedback." })] });
}
