import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import ThemeToggle from './ThemeToggle'
import { basePath } from '@/utils/path'

export default function Navbar() {
  const router = useRouter()
  const [session, setSession] = useState(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Fetch session on mount to see if user is logged in
  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch(`${basePath}/api/auth/me`)
        if (res.ok) {
          const data = await res.json()
          if (data.loggedIn) {
            setSession(data)
          } else {
            setSession(null)
          }
        }
      } catch (err) {
        console.error('Failed to fetch session in Navbar:', err)
      }
    }
    fetchSession()
  }, [router.asPath]) // Re-run when page changes to ensure session sync

  const handleLogout = async () => {
    try {
      await fetch(`${basePath}/api/auth/logout`)
      setSession(null)
      // Redirect to homepage or current login page depending on state
      if (session?.formSlug) {
        router.push(`/login/${session.formSlug}`)
      } else {
        router.push('/')
      }
    } catch (err) {
      console.error('Failed to log out:', err)
    }
  }

  const getStudentDisplayName = () => {
    if (!session?.studentInfo) return ''
    const { classcode, classno, name, cname, regno } = session.studentInfo
    return `${classcode || ''}${String(classno).padStart(2, 0) || ''} ${name || cname || ''} (${regno || ''})`
  }

  return (
    <nav
      className='navbar no-print has-shadow'
      role='navigation'
      aria-label='main navigation'
    >
      <div className='container'>
        <div className='navbar-brand'>
          <Link href='/' className='navbar-item has-text-weight-bold is-size-5'>
            SKHLPSS 聖公會李炳中學
          </Link>
        </div>
        <div className='navbar-end'>
          <div className='navbar-item'>
            <ThemeToggle />
          </div>
          {session?.formSlug && session.formSlug === router.query.slug && (
            <>
              <div className='navbar-item'>
                學生: <span>{getStudentDisplayName()}</span>
              </div>
              <div className='navbar-item'>
                <button
                  onClick={handleLogout}
                  className='button is-danger is-small'
                >
                  登出
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
