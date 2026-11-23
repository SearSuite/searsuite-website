import { jsx as _jsx } from "react/jsx-runtime";
import { createElement } from 'react';
export function IconArtwork({ definition, size = 24, ...props }) {
    const accessible = Boolean(props['aria-label'] || props['aria-labelledby']);
    return _jsx("svg", { xmlns: "http://www.w3.org/2000/svg", width: size, height: size, viewBox: definition.viewBox, fill: "none", "aria-hidden": accessible ? undefined : true, role: accessible ? 'img' : undefined, ...props, children: definition.shapes.map(([tag, attributes], index) => createElement(tag, { ...attributes, key: index })) });
}
