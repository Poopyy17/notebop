import React from 'react'
import { Routes, Route, useLocation, Link } from 'react-router-dom'
import { StackHandler } from '@stackframe/react'
import { AppSidebar } from "@/components/sidebar-10/AppSidebar"
import { NavActions } from "@/components/sidebar-10/NavActions"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbLink,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { useBreadcrumb } from '@/contexts/BreadcrumbContext'
import Home from '@/pages/Home'
import Board from '@/pages/Board'
import Login from '@/pages/Login'
import Signup from '@/pages/Signup'
import Account from '@/pages/Account'
import Trash from '@/pages/Trash'
import Friends from '@/pages/Friends'
import UserProfile from '@/pages/UserProfile'
import { stackClientApp } from './stack'
import { ProtectedRoute } from '@/components/ProtectedRoute'

const MainLayout = () => {
  const { breadcrumbs } = useBreadcrumb()

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center gap-2">
          <div className="flex flex-1 items-center gap-2 px-3">
            <SidebarTrigger />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((breadcrumb, index) => (
                  <React.Fragment key={breadcrumb.label}>
                    <BreadcrumbItem>
                      {index === breadcrumbs.length - 1 ? (
                        <BreadcrumbPage className="line-clamp-1">
                          {breadcrumb.label}
                        </BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild className="line-clamp-1">
                          <Link to={breadcrumb.href || '/'}>
                            {breadcrumb.label}
                          </Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                    {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                  </React.Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="ml-auto px-3">
            <NavActions />
          </div>
        </header>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/account" element={<Account />} />
          <Route path="/trash" element={<Trash />} />
          <Route path="/friends" element={<Friends />} />
          <Route path="/board/:id" element={<Board />} />
          <Route path="/user/:userId" element={<UserProfile />} />
        </Routes>
      </SidebarInset>
    </SidebarProvider>
  )
}

function HandlerRoutes() {
  const location = useLocation();
  return (
    <StackHandler app={stackClientApp} location={location.pathname} fullPage />
  );
}

const App = () => {
  return (
    <Routes>
      <Route path="/handler/*" element={<HandlerRoutes />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/*" element={<ProtectedRoute><MainLayout /></ProtectedRoute>} />
    </Routes>
  )
}

export default App