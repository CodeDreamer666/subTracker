import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "~/lib/utils";

const buttonVariants = cva(
    "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-[10px] text-sm font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-violet/30 disabled:pointer-events-none disabled:opacity-50",
    {
        variants: {
            variant: {
                default:
                    "bg-violet text-white shadow-[0_5px_16px_#4b40e92b] hover:bg-[#3e35d0]",
                destructive: "bg-[#c9364d] text-white hover:bg-[#aa293e]",
                outline:
                    "border-line border bg-white text-ink hover:border-[#b4afff] hover:bg-soft-violet",
                secondary: "bg-soft-violet text-violet hover:bg-[#e4e2ff]",
                ghost: "text-ink hover:bg-soft-violet hover:text-violet",
                link: "text-violet underline-offset-4 hover:underline",
            },
            size: {
                default: "h-10 px-4 py-2",
                sm: "h-9 px-3 text-xs",
                lg: "h-11 px-6",
                icon: "size-10",
            },
        },
        defaultVariants: { variant: "default", size: "default" },
    },
);

function Button({
    className,
    variant,
    size,
    asChild = false,
    ...props
}: React.ComponentProps<"button"> &
    VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
    const Component = asChild ? Slot.Root : "button";

    return (
        <Component
            className={cn(buttonVariants({ variant, size, className }))}
            data-slot="button"
            {...props}
        />
    );
}

export { Button, buttonVariants };
