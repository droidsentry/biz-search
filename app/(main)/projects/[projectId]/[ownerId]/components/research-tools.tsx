import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

interface ResearchToolsProps {
  ownerName: string;
}

export function ResearchTools({ ownerName }: ResearchToolsProps) {
  const encodedName = encodeURIComponent(ownerName);

  const researchLinks = [
    {
      name: "Facebook",
      url: `https://www.facebook.com/search/top?q=${encodedName}`,
      className: "bg-[#1877F2] hover:bg-[#1864C9] text-white",
    },
    {
      name: "LinkedIn",
      url: `https://www.linkedin.com/search/results/people/?keywords=${encodedName}`,
      className: "bg-[#0A66C2] hover:bg-[#0952A5] text-white",
    },
    {
      name: "Eight",
      url: `https://8card.net/myhome?page=1&sort=exchangeDate&tab=network`,
      className: "bg-gray-800 hover:bg-gray-700 text-white",
    },
  ];

  return (
    <div className="bg-background border border-muted-foreground/20 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4">調査ツール</h3>

      <div className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-3">外部サイトで検索</p>
          <div className="flex gap-3">
            {researchLinks.map((link) => (
              <Button
                key={link.name}
                asChild
                className={link.className}
                size="sm"
              >
                <Link
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2"
                >
                  {link.name}
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
