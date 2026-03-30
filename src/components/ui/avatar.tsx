import * as React from "react";
import { cn } from "@/lib/utils";
import { getInitials } from "@/lib/utils";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  alt?: string;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

/**
 * Avatar: shows profile image when src is provided, otherwise initials from firstName + lastName.
 * Use wherever a profile picture is needed (user, etc.).
 */
const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ src, firstName, lastName, alt = "", size = "md", className, ...props }, ref) => {
    const initials = getInitials(firstName, lastName);
    const sizeClass = sizeClasses[size];

    return (
      <div
        ref={ref}
        className={cn(
          "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/15 font-semibold text-primary",
          sizeClass,
          className
        )}
        {...props}
      >
        {src ? (
          <img src={src} alt={alt} className="h-full w-full object-cover" />
        ) : (
          <span>{initials}</span>
        )}
      </div>
    );
  }
);

Avatar.displayName = "Avatar";

export { Avatar };
