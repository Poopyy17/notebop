import { useEffect } from 'react'
import { useBreadcrumb } from '@/contexts/BreadcrumbContext'

export default function Dashboard() {
  const { setBreadcrumbs } = useBreadcrumb()

  useEffect(() => {
    setBreadcrumbs([
      { label: 'Dashboard' }
    ])
  }, [setBreadcrumbs])

  return (
    <div className="flex flex-1 flex-col p-4">
      <div className="bg-muted/50 h-full w-full rounded-xl flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to your dashboard</p>
        </div>
      </div>
    </div>
  )
}
