import * as React from "react";

type ButtonProps = React.ComponentProps<"button"> & {
  variant?: "default" | "ghost";
};

function Button({ className, variant = "default", ...props }: ButtonProps) {
  const variantClass =
    variant === "ghost"
      ? "bg-transparent text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
      : "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white";

  return (
    <button
      data-slot="button"
      className={[
        "inline-flex h-11 w-full items-center justify-center rounded-xl px-4 text-sm font-medium transition outline-none focus-visible:ring-2 focus-visible:ring-zinc-300 disabled:pointer-events-none disabled:opacity-50 dark:focus-visible:ring-zinc-700",
        variantClass,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}

export { Button };
