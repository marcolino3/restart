"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

export interface SliderProps
  extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  trackClassName?: string;
  rangeClassName?: string;
  thumbClassName?: string;
}

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(function Slider(
  {
    className,
    defaultValue,
    value,
    min = 0,
    max = 100,
    trackClassName,
    rangeClassName,
    thumbClassName,
    ...props
  },
  ref
) {
  // Anzahl Thumbs robust bestimmen (Standard: 1 Thumb)
  const thumbCount = React.useMemo(() => {
    if (Array.isArray(value)) return Math.max(1, value.length);
    if (Array.isArray(defaultValue)) return Math.max(1, defaultValue.length);
    return 1;
  }, [value, defaultValue]);

  return (
    <SliderPrimitive.Root
      ref={ref}
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn(
        "relative flex w-full select-none items-center touch-none data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col",
        className
      )}
      {...props}
    >
      <SliderPrimitive.Track
        data-slot="slider-track"
        className={cn(
          "relative grow overflow-hidden rounded-full bg-secondary data-[orientation=horizontal]:h-1.5 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5",
          trackClassName
        )}
      >
        <SliderPrimitive.Range
          data-slot="slider-range"
          className={cn(
            "absolute data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full bg-primary",
            rangeClassName
          )}
        />
      </SliderPrimitive.Track>

      {Array.from({ length: thumbCount }, (_, i) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={i}
          className={cn(
            "block size-4 shrink-0 rounded-full border-2 border-background bg-primary shadow-sm ring-ring/50 transition-[color,box-shadow] hover:ring-4 focus-visible:outline-hidden focus-visible:ring-4 disabled:pointer-events-none disabled:opacity-50",
            thumbClassName
          )}
        />
      ))}
    </SliderPrimitive.Root>
  );
});

Slider.displayName = "Slider";

export { Slider };
