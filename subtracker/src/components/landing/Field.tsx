import type { ReactNode } from "react";

export default function Field({
    label,
    htmlFor,
    children,
}: {
    label: string;
    htmlFor: string;
    children: ReactNode;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-muted text-xs" htmlFor={htmlFor}>
                {label}
            </label>
            {children}
        </div>
    );
}