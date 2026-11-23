"use client";
import { jsx as _jsx } from "react/jsx-runtime";
export function DemoFrame({ src, title }) {
    return _jsx("div", { className: "workbench searsuite-demo-frame", "data-searsuite-component": "DemoFrame", children: _jsx("iframe", { className: "workbench-demo", src: src, title: title }) });
}
