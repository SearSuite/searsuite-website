import { type SVGProps } from 'react';
import type { IconDefinition } from './strokeIcons.js';
export type IconArtworkProps = Omit<SVGProps<SVGSVGElement>, 'children' | 'name'> & {
    definition: IconDefinition;
    size?: number | string;
};
export declare function IconArtwork({ definition, size, ...props }: IconArtworkProps): import("react").JSX.Element;
