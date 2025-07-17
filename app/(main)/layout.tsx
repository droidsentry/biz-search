import { Header } from '@/components/layouts/header'
import { SubNavigation } from '@/components/layouts/sub-navigation'
import { Footer } from '@/components/layouts/footer'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-dvh bg-background flex flex-col">
      <div className="bg-muted">
        <Header />
      </div>
      <SubNavigation />
      <div className="flex-1 flex flex-col bg-background dark:bg-zinc-950 text-foreground">
        <main className="flex-1 mx-auto max-w-[1400px] w-full px-2 md:px-4">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  )
}