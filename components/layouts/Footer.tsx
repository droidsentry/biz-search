import { ModeToggle } from '../mode-toggle'

export function Footer() {
  return (
    <footer className="border-t border-border bg-muted/50">
      <div className="mx-auto max-w-[1400px] px-2 md:px-4 py-8">

        {/* 下部の情報 */}
        <div className="mt-8 border-t border-border pt-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground">&copy; 2025.07 TK</p>
        <span className="flex-1"></span>
        <ModeToggle />
          </div>
        </div>
      </div>
    </footer>
  )
}