import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { basePath } from '../../utils/path'
import { getFormStructure, resolveSheetNames } from '@/utils/googleSheet'

export async function getServerSideProps(context) {
  const { slug } = context.params
  let formTitle = '網上表格系統'
  let formDescription = '請登入以填寫表格'

  try {
    const { infoSheetName, dataSheetName } = await resolveSheetNames(slug)
    const structure = await getFormStructure(slug, dataSheetName, infoSheetName)
    if (structure && structure.formTitle) {
      formTitle = structure.formTitle
      formDescription = structure.formDescription
    }
  } catch (error) {
    console.error('Failed to fetch form title for login page:', error.message)
  }

  return {
    props: {
      slug,
      formTitle,
      formDescription
    }
  }
}

export default function Login({ slug, formTitle, formDescription }) {
  const router = useRouter()

  const [regno, setRegno] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // If we're already logged in, check session and redirect
    async function checkSession() {
      const res = await fetch(`${basePath}/api/auth/me`)
      const data = await res.json()
      if (data.loggedIn && data.role === 'USER' && data.formSlug === slug) {
        router.replace(`/f/${slug}`)
      }
    }
    if (slug) {
      checkSession()
    }
  }, [slug, router])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!slug) {
      setError('遺失表格編號，請返回首頁重新選擇。')
      setLoading(false)
      return
    }

    try {
      const res = await fetch(`${basePath}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, regno, password })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || '登入失敗，請確認登入資訊。')
      } else {
        router.push(`/f/${slug}`)
      }
    } catch (err) {
      setError('網絡連接錯誤，請稍後重試。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className='section'
      style={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}
    >
      <div className='container' style={{ maxWidth: '480px' }}>
        <div className='card'>
          <header className='card-header has-background-link'>
            <p className='card-header-title has-text-white is-size-5 is-centered'>
              {formTitle}
            </p>
          </header>

          <div className='card-content'>
            {error && (
              <div className='notification is-danger py-2 is-size-6 mb-4'>
                {error}
              </div>
            )}
            <p className='content'>{formDescription}</p>

            <form onSubmit={handleLogin}>
              <div className='field'>
                <label className='label'>學生註冊編號</label>
                <div className='control'>
                  <input
                    className='input'
                    type='text'
                    placeholder='請輸入註冊編號'
                    value={regno}
                    onChange={(e) => setRegno(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              <div className='field mb-5'>
                <label className='label'>登入密碼</label>
                <div className='control'>
                  <input
                    className='input'
                    type='password'
                    placeholder='請輸入家長密碼'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>
              <button
                type='submit'
                className={`button is-link ${loading ? 'is-loading' : ''}`}
                disabled={loading}
              >
                登入
              </button>
            </form>
          </div>
          <footer className='card-footer has-background-light py-2 is-justify-content-center'>
            <span className='is-size-7 has-text-grey'>
              SKHLPSS. All Rights Reserved.
            </span>
          </footer>
        </div>
      </div>
    </div>
  )
}
