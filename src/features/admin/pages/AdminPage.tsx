import { useQuery } from '@tanstack/react-query'
import type { PropsWithChildren } from 'react'
import { ErrorState, LoadingState } from '@/components/shared/QueryState'
import { Button } from '@/components/ui/button'
import { AdminCatalog } from '@/features/admin/components/AdminCatalog'
import { AdminPageFrame } from '@/features/admin/components/AdminPageFrame'
import { checkAdminMembership } from '@/features/admin/api'
import { useAuth } from '@/features/auth/AuthContext'

export function AdminPage() {
  const auth = useAuth()
  const membershipQuery = useQuery({
    queryKey: ['admin-membership', auth.user?.id],
    queryFn: () => checkAdminMembership(auth.user!.id),
    enabled: Boolean(auth.user),
    staleTime: Infinity,
    retry: false,
  })

  if (auth.isLoading) return <LoadingState label="Checking account…" />

  if (!auth.user) {
    return (
      <AdminAccessMessage
        title="Sign in to manage the catalog"
        message="Only the designated administrator can add or change city guides."
      >
        <Button onClick={() => void auth.signInWithGoogle()}>
          Sign in with Google
        </Button>
      </AdminAccessMessage>
    )
  }

  if (membershipQuery.isPending) {
    return <LoadingState label="Checking administrator access…" />
  }

  if (membershipQuery.isError) {
    return (
      <AdminPageFrame>
        <ErrorState
          title="Administrator access could not be checked"
          message={membershipQuery.error.message}
          onRetry={() => void membershipQuery.refetch()}
        />
      </AdminPageFrame>
    )
  }

  if (!membershipQuery.data) {
    return (
      <AdminAccessMessage
        title="Administrator access required"
        message="This account can browse the catalog, but it cannot change it."
      />
    )
  }

  return <AdminCatalog />
}

function AdminAccessMessage({
  title,
  message,
  children,
}: PropsWithChildren<{
  title: string
  message: string
}>) {
  return (
    <AdminPageFrame>
      <div className="rounded-3xl border border-stone-200 bg-white p-7 shadow-sm sm:p-9">
        <p className="text-sm font-medium text-emerald-800">Catalog admin</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
          {title}
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-stone-600">
          {message}
        </p>
        {children ? <div className="mt-6">{children}</div> : null}
      </div>
    </AdminPageFrame>
  )
}
