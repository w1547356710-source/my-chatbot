import * as React from "react";

function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={[
        "rounded-2xl border border-black/10 bg-white/80 text-zinc-950 shadow-xl backdrop-blur dark:border-white/10 dark:bg-zinc-950/70 dark:text-zinc-50",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={["flex flex-col gap-1.5 p-6", className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="card-title"
      className={["text-xl font-semibold tracking-tight", className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="card-description"
      className={["text-sm text-zinc-600 dark:text-zinc-400", className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={["px-6 pb-6", className].filter(Boolean).join(" ")}
      {...props}
    />
  );
}

export { Card, CardContent, CardDescription, CardHeader, CardTitle };
