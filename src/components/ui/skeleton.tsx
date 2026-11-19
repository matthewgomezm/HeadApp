import { cn } from "cn"

// shadcn Skeleton, kept still for this app: the pulse class is removed, since a slowly
// blinking screen is the kind of thing that hurts during a migraine.
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
