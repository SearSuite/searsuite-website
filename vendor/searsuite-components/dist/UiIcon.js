import { jsx as _jsx } from "react/jsx-runtime";
import { IconArtwork } from './IconArtwork.js';
import { uiIconData } from './uiIconData.js';
export function UiIcon({ name, size = 24, ...props }) {
    return _jsx(IconArtwork, { definition: uiIconData[name], size: size, ...props });
}
