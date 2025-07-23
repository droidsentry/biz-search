import { Footer } from "./components/footer";
import { Header } from "./components/header";
import { SubNavigation } from "./components/sub-navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex-1 flex flex-col bg-background text-foreground">
        <SubNavigation />
        <main className="flex-1">{children}</main>
      </div>
      <Footer />
    </div>
  );
}
