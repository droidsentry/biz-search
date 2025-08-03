import { SearchPatternProvider } from "@/lib/contexts/search-pattern-context";

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SearchPatternProvider>{children}</SearchPatternProvider>;
}