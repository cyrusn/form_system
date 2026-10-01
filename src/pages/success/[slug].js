import { useRouter } from 'next/router'
import { basePath } from '../../utils/path'

export default function Success() {
  const router = useRouter()
  const { slug } = router.query

  const handleLogout = async () => {
    await fetch(`${basePath}/api/auth/logout`)
    router.replace('/')
  }

  return (
    <div
      className='section'
      style={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}
    >
      <div className='container' style={{ maxWidth: '540px' }}>
        <div className='card'>
          <header className='card-header has-background-success'>
            <p className='card-header-title'>提交成功</p>
          </header>
          <div className='card-content'>
            <p className='content'>
              表格已記錄到學校雲端系統中。如需備份，可以按
              <span
                className='tag mx-2 is-link'
                onClick={() => router.push(`/f/${slug}`)}
              >
                檢視表格
              </span>
              查閱，並利用瀏覽器的列印功能列印填報結果。
            </p>
          </div>
          <footer className='card-footer'>
            {slug && (
              <a
                onClick={() => router.push(`/f/${slug}`)}
                className='card-footer-item is-link is-outlined'
              >
                檢視表格
              </a>
            )}
            <a onClick={handleLogout} className='card-footer-item is-danger'>
              登出系統
            </a>
          </footer>
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
