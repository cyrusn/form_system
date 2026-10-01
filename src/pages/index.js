import { useState } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import Link from 'next/link'

export default function Home() {
  const router = useRouter()
  const [spreadsheetId, setSpreadsheetId] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    const cleanId = spreadsheetId.trim()

    if (!cleanId) {
      setError('請輸入 Google 試算表 ID')
      return
    }

    // Direct routing to login page for the given Spreadsheet ID
    router.push(`/login/${cleanId}`)
  }

  return (
    <>
      <Head>
        <title>學校表格系統 | 首頁</title>
      </Head>
      <div
        className='section'
        style={{ display: 'flex', alignItems: 'center', minHeight: '80vh' }}
      >
        <div className='container' style={{ maxWidth: '600px' }}>
          <div className='card'>
            <header className='card-header has-background-link'>
              <p className='card-header-title has-text-white'>
                學校表格系統
              </p>
            </header>
            <div className='card-content'>
              <p className='mb-5'>
                歡迎使用學校表格系統。請在下方輸入由相關的{' '}
                <strong>Google 試算表 ID</strong> 以存取表格。
              </p>

              {error && (
                <div className='notification is-danger py-2 is-size-6 mb-4'>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className='field'>
                  <label className='label'>
                    Google 試算表 ID (Spreadsheet ID)
                  </label>
                  <div className='control'>
                    <input
                      className='input'
                      type='text'
                      placeholder='例如: 1a2b3c4d5e6f7g8h9i0j...'
                      value={spreadsheetId}
                      onChange={(e) => {
                        setSpreadsheetId(e.target.value)
                        if (error) setError('')
                      }}
                      required
                    />
                  </div>
                  <p className='help'>
                    您可以在 Google 試算表網址中的 <code>/d/</code> 與{' '}
                    <code>/edit</code> 之間找到此 ID。
                  </p>
                </div>

                <div className='field mt-5'>
                  <div className='control'>
                    <button
                      type='submit'
                      className='button is-link'
                    >
                      進入表格
                    </button>
                  </div>
                </div>
              </form>

              <hr />

              <div className='content has-text-centered'>
                <p className='is-size-6'>
                  第一次設定或需要範本？請參閱{' '}
                  <Link
                    href='/setup-guide'
                    className='has-text-link has-text-weight-bold'
                  >
                    設定指南
                  </Link>
                </p>
              </div>
            </div>
            <footer className='card-footer py-3 is-justify-content-center has-background-light'>
              <span className='is-size-7 has-text-grey'>
                © 2026 Liping. All Rights Reserved.
              </span>
            </footer>
          </div>
        </div>
      </div>
    </>
  )
}
