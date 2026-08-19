import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "~/lib/utils";

const badgeVariants = cva(
    "inline-flex w-fit shrink-0 items-center justify-center rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap",
    {
        variants: {
            variant: {
                default: "border-transparent bg-violet text-white",
                secondary: "border-transparent bg-soft-violet text-violet",
                destructive: "border-transparent bg-[#fff0f2] text-[#ad2840]",
                outline: "border-line bg-white text-muted",
                success: "border-transparent bg-[#e8f7ef] text-[#17744d]",
            },
        },
        defaultVariants: { variant: "default" },
    },
);

function Badge({
    className,
    variant,
    asChild = false,
    ...props
}: React.ComponentProps<"span"> &
    VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
    const Component = asChild ? Slot.Root : "span";
    return (
        <Component
            className={cn(badgeVariants({ variant }), className)}
            data-slot="badge"
            {...props}
        />
    );
}

export { Badge, badgeVariants };
