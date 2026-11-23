import type { SVGProps } from 'react';
import { type UiIconName } from './uiIconData.js';
export type UiIconProps = Omit<SVGProps<SVGSVGElement>, 'children' | 'name'> & {
    name: UiIconName;
    size?: number | string;
};
export declare function UiIcon({ name, size, ...props }: UiIconProps): import("react").JSX.Element;
