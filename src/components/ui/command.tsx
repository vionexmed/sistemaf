"use client";

import * as React from "react";
import { Command as C } from "cmdk";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

function Command({ className, ...props }: React.ComponentProps<typeof C>) {
  return <C className={cn("flex size-full flex-col overflow-hidden bg-surface text-foreground", className)} {...props} />;
}

function CommandInput({ className, ...props }: React.ComponentProps<typeof C.Input>) {
  return (
    <div className="flex h-12 items-center gap-2 border-b px-4">
      <Search className="size-4 shrink-0 text-muted-foreground" />
      <C.Input
        className={cn("h-full w-full bg-transparent text-base outline-none placeholder:text-muted-foreground", className)}
        {...props}
      />
    </div>
  );
}

function CommandList({ className, ...props }: React.ComponentProps<typeof C.List>) {
  return <C.List className={cn("max-h-80 overflow-y-auto p-1", className)} {...props} />;
}

function CommandEmpty(props: React.ComponentProps<typeof C.Empty>) {
  return <C.Empty className="py-6 text-center text-sm text-muted-foreground" {...props} />;
}

function CommandGroup({ className, ...props }: React.ComponentProps<typeof C.Group>) {
  return (
    <C.Group
      className={cn(
        "overflow-hidden p-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

function CommandItem({ className, ...props }: React.ComponentProps<typeof C.Item>) {
  return (
    <C.Item
      className={cn(
        "relative flex h-9 cursor-default items-center gap-2 rounded-md px-2 text-base outline-none select-none data-[selected=true]:bg-hover data-[disabled=true]:opacity-50 [&_svg]:size-4 [&_svg]:stroke-[1.75] [&_svg]:text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

export { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem };
