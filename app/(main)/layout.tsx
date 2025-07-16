import { Header } from '@/components/layouts/Header'
import { SubNavigation } from '@/components/layouts/SubNavigation'
import { Footer } from '@/components/layouts/Footer'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <div className="flex-1 flex flex-col bg-background dark:bg-zinc-950 text-foreground">
        <SubNavigation />
        <main className="flex-1">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  )
}