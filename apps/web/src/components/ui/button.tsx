import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-sans text-sm font-medium tracking-[0.04em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-espresso focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        default: "bg-[#1C1810] text-[#F2EFE9] hover:bg-[#2E2720] active:bg-[#0E0D0A]",
        outline:
          "border border-[#1C1810] bg-transparent text-[#1C1810] hover:bg-[#1C1810] hover:text-[#F2EFE9]",
        ghost: "bg-transparent text-[#6B6358] hover:text-[#1C1810] hover:bg-[#EAE6DE]"
      },
      size: {
        sm: "h-8 px-4 py-1.5 text-xs",
        default: "h-11 px-7 py-3.5",
        lg: "h-12 px-8 py-4 text-base"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
