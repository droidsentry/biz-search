import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SettingsCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function SettingsCard({
  title,
  description,
  children,
}: SettingsCardProps) {
  return (
    <Card className="shadow-border pb-3">
      <CardHeader>
        <CardTitle className="text-xl font-semibold mb-3">{title}</CardTitle>
        {description && (
          <p className="text-sm text-foreground">{description}</p>
        )}
      </CardHeader>
      {children}
    </Card>
  );
}
