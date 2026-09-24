"use client";

import * as React from "react";
import { DropdownMenu as P } from "radix-ui";
import { cn } from "@/lib/utils";

const DropdownMenu = P.Root;
const DropdownMenuTrigger = P.Trigger;
const DropdownMenuGroup = P.Group;

function DropdownMenuContent({ className, sideOffset = 4, ...props }: React.ComponentProps<typeof P.Content>) {
  return (
    <P.Portal>
      <P.Content
        sideOffset={sideOffset}
        className={cn(
          "z-50 min-w-44 overflow-hidden rounded-md border bg-surface p-1 text-base text-foreground shadow-overlay",
          className,
        )}
        {...props}
      />
    </P.Portal>
  );
}

function DropdownMenuItem({
  className,
  destrutivo,
  ...props
}: React.ComponentProps<typeof P.Item> & { destrutivo?: boolean }) {
  return (
    <P.Item
      className={cn(
        "relative flex h-8 cursor-default items-center gap-2 rounded-sm px-2 outline-none select-none data-[disabled]:opacity-50 data-[highlighted]:bg-hover [&_svg]:size-4 [&_svg]:stroke-[1.75] [&_svg]:text-muted-foreground",
        destrutivo && "text-erro-11 [&_svg]:text-erro-11",
        className,
      )}
      {...props}
    />
  );
}

function DropdownMenuLabel({ className, ...props }: React.ComponentProps<typeof P.Label>) {
  return <P.Label className={cn("px-2 py-1 text-xs font-medium text-muted-foreground", className)} {...props} />;
}

function DropdownMenuSeparator({ className, ...props }: React.ComponentProps<typeof P.Separator>) {
  return <P.Separator className={cn("-mx-1 my-1 h-px bg-border", className)} {...props} />;
}

function DropdownMenuRadioGroup(props: React.ComponentProps<typeof P.RadioGroup>) {
  return <P.RadioGroup {...props} />;
}

function DropdownMenuRadioItem({ className, children, ...props }: React.ComponentProps<typeof P.RadioItem>) {
  return (
    <P.RadioItem
      className={cn(
        "relative flex h-8 cursor-default items-center gap-2 rounded-sm pr-2 pl-7 outline-none select-none data-[highlighted]:bg-hover",
        className,
      )}
      {...props}
    >
      <span className="absolute left-2 flex size-3.5 items-center justify-center">
        <P.ItemIndicator>
          <span className="block size-1.5 rounded-full bg-foreground" />
        </P.ItemIndicator>
      </span>
      {children}
    </P.RadioItem>
  );
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuGroup,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
};
