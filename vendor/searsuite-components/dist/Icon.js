import { jsx as _jsx } from "react/jsx-runtime";
import { IconArtwork } from './IconArtwork.js';
import { iconData } from './strokeIcons.js';
export function Icon({ name, size = 24, ...props }) {
    return _jsx(IconArtwork, { definition: iconData[name], size: size, ...props });
}
