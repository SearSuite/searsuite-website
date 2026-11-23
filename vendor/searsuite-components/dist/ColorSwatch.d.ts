export declare const colorGroups: readonly [{
    readonly title: "Brand / Primary";
    readonly colors: readonly [readonly ["primary-50", "Primary 50"], readonly ["primary-100", "Primary 100"], readonly ["primary-200", "Primary 200"], readonly ["primary-300", "Primary 300"], readonly ["primary-400", "Primary 400"], readonly ["primary-500", "Primary 500 · Brand"], readonly ["primary-600", "Primary 600"], readonly ["primary-700", "Primary 700"], readonly ["primary-800", "Primary 800"], readonly ["primary-900", "Primary 900"], readonly ["primary", "Primary alias"]];
}, {
    readonly title: "Neutral";
    readonly colors: readonly [readonly ["neutral-0", "Neutral 0"], readonly ["neutral-50", "Neutral 50"], readonly ["neutral-100", "Neutral 100"], readonly ["neutral-200", "Neutral 200"], readonly ["neutral-300", "Neutral 300"], readonly ["neutral-400", "Neutral 400"], readonly ["neutral-500", "Neutral 500"], readonly ["neutral-600", "Neutral 600"], readonly ["neutral-700", "Neutral 700"], readonly ["neutral-800", "Neutral 800"], readonly ["neutral-900", "Neutral 900"]];
}, {
    readonly title: "Status";
    readonly colors: readonly [readonly ["success-50", "Success 50"], readonly ["success-500", "Success 500"], readonly ["success-700", "Success 700"], readonly ["warning-50", "Warning 50"], readonly ["warning-500", "Warning 500"], readonly ["warning-700", "Warning 700"], readonly ["danger-50", "Danger 50"], readonly ["danger-500", "Danger 500"], readonly ["danger-700", "Danger 700"]];
}, {
    readonly title: "Text roles";
    readonly colors: readonly [readonly ["text-primary", "Primary text"], readonly ["text-secondary", "Secondary text"], readonly ["text-muted", "Muted text"], readonly ["text-subtle", "Subtle text"], readonly ["text-hint", "Hint text"], readonly ["text-strong", "Strong text"], readonly ["text-on-primary", "On primary"], readonly ["text-on-strong", "On strong"]];
}, {
    readonly title: "Surfaces and interaction";
    readonly colors: readonly [readonly ["surface", "Surface"], readonly ["surface-strong", "Strong surface"], readonly ["canvas", "Canvas"], readonly ["hover", "Hover"], readonly ["action-hover", "Action hover"], readonly ["action-active", "Action active"], readonly ["border", "Border"], readonly ["soft-border", "Soft border"], readonly ["link", "Link"], readonly ["link-hover", "Link hover"], readonly ["focus", "Focus"], readonly ["selection", "Selection"], readonly ["selection-text", "Selection text"], readonly ["primary-fill", "Primary fill"], readonly ["success", "Success"], readonly ["clear", "Transparent"], readonly ["code-bg", "Code background"]];
}, {
    readonly title: "Syntax highlighting";
    readonly colors: readonly [readonly ["syntax-keyword", "Keyword"], readonly ["syntax-string", "String"], readonly ["syntax-number", "Number"], readonly ["syntax-comment", "Comment"], readonly ["syntax-definition", "Definition"], readonly ["syntax-atom", "Atom"], readonly ["syntax-type", "Type"], readonly ["syntax-regexp", "Regular expression"]];
}, {
    readonly title: "Overlays and shadows";
    readonly colors: readonly [readonly ["action-shadow", "Action shadow"], readonly ["backdrop", "Backdrop"], readonly ["mobile-backdrop", "Mobile backdrop"], readonly ["dialog-shadow", "Dialog shadow"], readonly ["mobile-shadow", "Mobile shadow"], readonly ["preview-shadow", "Preview shadow"], readonly ["website-shadow", "Website shadow"], readonly ["back-to-top-shadow", "Back to top shadow"], readonly ["toast-shadow", "Toast shadow"]];
}, {
    readonly title: "Short aliases";
    readonly colors: readonly [readonly ["fg", "Foreground"], readonly ["muted", "Muted"], readonly ["tertiary", "Tertiary"], readonly ["secondary", "Secondary"], readonly ["strong", "Strong"], readonly ["hint", "Hint"], readonly ["blue", "Blue"], readonly ["blue-soft", "Blue soft"], readonly ["blue-strong", "Blue strong"], readonly ["on-accent", "On accent"], readonly ["on-strong", "On strong"]];
}];
export interface ColorSwatchProps {
    color?: string;
    token?: string;
    label: string;
    value?: string;
}
export declare function ColorSwatch({ color, token, label, value }: ColorSwatchProps): import("react").JSX.Element;
