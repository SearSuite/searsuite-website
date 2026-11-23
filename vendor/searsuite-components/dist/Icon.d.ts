import type { SVGProps } from 'react';
import { type IconName } from './strokeIcons.js';
export type IconProps = Omit<SVGProps<SVGSVGElement>, 'children' | 'name'> & {
    name: IconName;
    size?: number | string;
};
export declare function Icon({ name, size, ...props }: IconProps): import("react").JSX.Element;
