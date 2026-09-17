import { createSessionClient, createAdminClient } from '@/utils/appwrite/server'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { Camera } from 'lucide-react'
import { ID, Query } from 'node-appwrite'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const errorMsg = typeof params.error === 'string' ? params.error : ''

  let user = null
  try {
    const { account } = await createSessionClient()
    user = await account.get()
  } catch (error) {
  }

  if (user) {
    redirect('/')
  }

  const login = async (formData: FormData) => {
    'use server'
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    
    try {
      const { account } = await createAdminClient()
      const session = await account.createEmailPasswordSession(email, password)

      const cookieStore = await cookies()
      cookieStore.set('appwrite-session', session.secret, {
        path: '/',
        httpOnly: true,
        sameSite: 'strict',
        secure: true,
        expires: new Date(session.expire),
      })

      // Ensure profile exists
      try {
        const { databases } = await createAdminClient()
        const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!
        const existing = await databases.listRows(DB_ID, 'profiles', [
          Query.equal('$id', session.userId)
        ])
        
        if (existing.total === 0) {
          await databases.createRow(DB_ID, 'profiles', session.userId, {
            username: email.split('@')[0],
            bio: '',
            avatar_url: ''
          })
        }
      } catch (profileErr) {
        console.error('Error ensuring profile exists:', profileErr)
      }

    } catch (error: any) {
      console.error('Login error:', error)
      redirect(`/login?error=${encodeURIComponent(error.message || 'Could not log in')}`)
    }
    
    revalidatePath('/', 'layout')
    redirect('/')
  }

  const signup = async (formData: FormData) => {
    'use server'
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    
    try {
      const { account } = await createAdminClient()
      
      await account.create(ID.unique(), email, password)
      
      const session = await account.createEmailPasswordSession(email, password)

      const cookieStore = await cookies()
      cookieStore.set('appwrite-session', session.secret, {
        path: '/',
        httpOnly: true,
        sameSite: 'strict',
        secure: true,
        expires: new Date(session.expire),
      })

      // Ensure profile exists
      try {
        const { databases } = await createAdminClient()
        const DB_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!
        await databases.createRow(DB_ID, 'profiles', session.userId, {
          username: email.split('@')[0],
          bio: '',
          avatar_url: ''
        })
      } catch (profileErr) {
        console.error('Error ensuring profile exists:', profileErr)
      }

    } catch (error: any) {
      console.error('Signup error:', error)
      redirect(`/login?error=${encodeURIComponent(error.message || 'Could not sign up')}`)
    }
    
    revalidatePath('/', 'layout')
    redirect('/')
  }

  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 mx-auto pt-20">
      <div className="flex flex-col items-center mb-8 gap-4">
        <Camera className="w-12 h-12 text-accent" />
        <h1 className="text-3xl font-serif">Second Take</h1>
        <p className="text-muted-foreground text-center text-sm">
          Don't just remember what you watched. Remember what you saw.
        </p>
      </div>

      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-sm p-4 rounded-md mb-4 text-center">
          {errorMsg}
        </div>
      )}

      <form className="animate-in flex-1 flex flex-col w-full justify-center gap-2 text-foreground">
        <label className="text-md" htmlFor="email">
          Email
        </label>
        <input
          className="rounded-md px-4 py-2 bg-inherit border border-border mb-6 focus:outline-none focus:border-accent subtle-transition"
          name="email"
          placeholder="you@example.com"
          required
        />
        <label className="text-md" htmlFor="password">
          Password
        </label>
        <input
          className="rounded-md px-4 py-2 bg-inherit border border-border mb-6 focus:outline-none focus:border-accent subtle-transition"
          type="password"
          name="password"
          placeholder="••••••••"
          required
        />
        <button
          formAction={login}
          className="bg-foreground text-background rounded-md px-4 py-2 mb-2 hover:bg-neutral-800 subtle-transition"
        >
          Sign In
        </button>
        <button
          formAction={signup}
          className="border border-border rounded-md px-4 py-2 hover:bg-surface-hover subtle-transition"
        >
          Sign Up
        </button>
      </form>
    </div>
  )
}

