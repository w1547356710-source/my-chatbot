import * as React from "react";

function Label({ className, ...props }: React.ComponentProps<"label">) {
  return (
    <label
      data-slot="label"
      className={[
        "text-sm font-medium text-zinc-700 peer-disabled:cursor-not-allowed peer-disabled:opacity-70 dark:text-zinc-300",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}

export { Label };
