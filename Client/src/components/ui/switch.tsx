"use client";

import * as React from "react";
import * as SwitchPrimitives from "@radix-ui/react-switch";
import { cn } from "@/lib/utils";

const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitives.Root
    ref={ref}
    {...props}
    className={cn(
      // OUTER TRACK
      "peer inline-flex h-[18px] w-[34px] cursor-pointer items-center rounded-full border transition-colors",
      "bg-neutral-300 border-neutral-300",
      "data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className
    )}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        // INNER CIRCLE
        "pointer-events-none block h-[14px] w-[14px] rounded-full bg-white shadow transition-transform",
        "data-[state=unchecked]:translate-x-[2px]",
        "data-[state=checked]:translate-x-[16px]"
      )}
    />
  </SwitchPrimitives.Root>
));

Switch.displayName = "Switch";

export { Switch };
