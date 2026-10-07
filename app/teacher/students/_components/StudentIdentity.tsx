import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/app/teacher/_components/format";
import { cn } from "@/lib/utils";

interface StudentIdentityProps {
    name: string;
    email?: string | null;
    image?: string | null;
    className?: string;
}

/** Avatar + name + email; long values truncate (full text in the title tooltip). */
export function StudentIdentity({ name, email, image, className }: StudentIdentityProps) {
    return (
        <div className={cn("flex min-w-0 items-center gap-3", className)}>
            <Avatar className="size-9 shrink-0">
                {image && <AvatarImage src={image} alt="" />}
                <AvatarFallback className="text-xs font-medium">{initials(name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
                <p className="truncate font-medium" title={name}>
                    {name}
                </p>
                {email && (
                    <p className="truncate text-xs text-muted-foreground" title={email}>
                        {email}
                    </p>
                )}
            </div>
        </div>
    );
}
