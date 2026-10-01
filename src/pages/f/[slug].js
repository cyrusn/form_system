import { getDb } from '@/lib/db'
import { getSession } from '@/lib/jwt'
import { getFormStructure } from '@/utils/googleSheet'
import { google } from 'googleapis'
import { getGoogleAuth } from '@/utils/googleApiAuth'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { marked } from 'marked'
import FormInput from '@/components/form/FormInput'
import { basePath } from '@/utils/path'
import ThemeToggle from '@/components/ThemeToggle'

export async function getServerSideProps(context) {
  const { slug } = context.params
  const session = getSession(context.req, 'USER')

  // 1. Session check
  if (!session || session.role !== 'USER' || session.formSlug !== slug) {
    return {
      redirect: {
        destination: `/login/${slug}`,
        permanent: false
      }
    }
  }

  try {
    const db = getDb()
    const spreadsheet_id = slug
    const data_sheet_name = session.dataSheetName || 'data'
    const info_sheet_name = session.infoSheetName || 'info'

    // 2. Fetch Form structure & Fields
    const structure = await getFormStructure(
      spreadsheet_id,
      data_sheet_name,
      info_sheet_name
    )

    // 3. Read parent's current answers directly from Google Sheets row
    const auth = await getGoogleAuth()
    const sheets = google.sheets('v4')
    const rowResponse = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: spreadsheet_id,
      range: `${data_sheet_name}!A${session.rowNumber}:ZZ${session.rowNumber}`,
      valueRenderOption: 'UNFORMATTED_VALUE'
    })

    const rowValues = (rowResponse.data.values || [])[0] || []
    const headersResponse = await sheets.spreadsheets.values.get({
      auth,
      spreadsheetId: spreadsheet_id,
      range: `${data_sheet_name}!A1:ZZ1`,
      valueRenderOption: 'UNFORMATTED_VALUE'
    })
    const headers = (headersResponse.data.values || [])[0] || []

    // Map column value to field key
    const currentAnswers = {}
    headers.forEach((h, idx) => {
      const key = String(h || '').trim()
      if (key) {
        currentAnswers[key] = rowValues[idx] || ''
      }
    })

    // Check if form is currently locked
    const lockIndex = headers
      .map((h) =>
        String(h || '')
          .trim()
          .toLowerCase()
      )
      .indexOf('is_locked')
    let isLocked = session.isLocked
    if (lockIndex !== -1 && rowValues[lockIndex] !== undefined) {
      isLocked = ['true', 'yes', '1'].includes(
        String(rowValues[lockIndex]).trim().toLowerCase()
      )
    }

    // 4. Retrieve existing digital signature from SQLite if exists
    const signatureRow = db
      .prepare(
        'SELECT signature_base64 FROM signatures WHERE form_slug = ? AND regno = ?'
      )
      .get(slug, session.regno)
    const existingSignature = signatureRow ? signatureRow.signature_base64 : ''

    return {
      props: {
        slug,
        studentInfo: session.studentInfo,
        formTitle: structure.formTitle,
        formDescription: structure.formDescription,
        fields: structure.fields,
        currentAnswers,
        existingSignature,
        isLocked
      }
    }
  } catch (error) {
    console.error('[Form Page ServerProps Error]:', error)
    return {
      props: {
        slug,
        studentInfo: session.studentInfo,
        formTitle: '表格載入失敗',
        formDescription: '無法從 Google 試算表載入表格欄位。請檢查試算表配置。',
        fields: [],
        currentAnswers: {},
        existingSignature: '',
        isLocked: true,
        error: '表格配置載入錯誤'
      }
    }
  }
}

export default function FormView({
  slug,
  studentInfo,
  formTitle,
  formDescription,
  fields,
  currentAnswers,
  existingSignature,
  isLocked,
  error
}) {
  const router = useRouter()
  const [formData, setFormData] = useState({})
  const [signatureData, setSignatureData] = useState(existingSignature || '')
  const [loading, setLoading] = useState(false)
  const [submitAction, setSubmitAction] = useState('save')
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState(error || '')
  const [fieldErrors, setFieldErrors] = useState({})

  // Pre-populate answers
  useEffect(() => {
    const initial = {}
    fields.forEach((f) => {
      if (!f.isSystem && f.type !== 'info') {
        // Skip signature since we handle canvas specifically
        if (f.type !== 'signature') {
          initial[f.key] = currentAnswers[f.key] || ''
        }
      }
    })
    setFormData(initial)
  }, [fields, currentAnswers])

  // Logout handler
  const handleLogout = async () => {
    await fetch(`${basePath}/api/auth/logout`)
    router.replace(`/login/${slug}`)
  }

  const handleInputChange = (key, value) => {
    if (isLocked) return
    setFormData((prev) => ({ ...prev, [key]: value }))
    if (successMsg) setSuccessMsg('')
    if (errorMsg) setErrorMsg('')
    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const updated = { ...prev }
        delete updated[key]
        return updated
      })
    }
  }

  useEffect(() => {
    if (signatureData && fieldErrors.signature) {
      setFieldErrors((prev) => {
        const updated = { ...prev }
        delete updated.signature
        return updated
      })
    }
  }, [signatureData, fieldErrors.signature])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (isLocked) return
    setErrorMsg('')
    setSuccessMsg('')
    setFieldErrors({})

    // Perform validation only when clicking "Confirm and Submit"
    if (submitAction === 'confirm') {
      const errors = {}
      let hasError = false

      fields.forEach((field) => {
        if (field.isSystem || field.type === 'info') return

        if (field.isRequired) {
          if (field.type === 'signature') {
            if (!signatureData || String(signatureData).trim() === '') {
              errors[field.key] = `請完成 ${field.title}`
              hasError = true
            }
          } else {
            const value = formData[field.key]
            if (
              value === undefined ||
              value === null ||
              String(value).trim() === ''
            ) {
              errors[field.key] = `請填寫 / 選擇 ${field.title}`
              hasError = true
            }
          }
        }
      })

      if (hasError) {
        setFieldErrors(errors)
        setErrorMsg('表格中含有未填妥的必填項目，請檢查下方的紅色提示。')
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
    }

    setLoading(true)

    try {
      // Separate files from text fields
      const textResponses = {}
      const fileFieldsToUpload = []

      Object.keys(formData).forEach((key) => {
        const value = formData[key]
        if (value instanceof File) {
          fileFieldsToUpload.push({ key, file: value })
        } else {
          textResponses[key] = value
        }
      })

      // Add signature if dynamic drawing is present
      const hasSignatureField = fields.some((f) => f.type === 'signature')
      if (hasSignatureField) {
        textResponses.signature = signatureData
      }

      // Package payload as FormData to support binary file upload
      const sendData = new FormData()
      sendData.append('action', submitAction)
      sendData.append('responses', JSON.stringify(textResponses))

      fileFieldsToUpload.forEach(({ key, file }) => {
        sendData.append(`file_${key}`, file)
      })

      const res = await fetch(`${basePath}/api/submit/${slug}`, {
        method: 'POST',
        body: sendData
      })

      const data = await res.json()

      if (!res.ok) {
        setErrorMsg(data.error || '提交表格失敗。')
      } else {
        if (submitAction === 'confirm') {
          router.push(`/success/${slug}`)
        } else {
          setSuccessMsg('已暫存表格，確認表格並遞交後才會正式提交。')
        }
      }
    } catch (err) {
      setErrorMsg('網絡通訊錯誤，請稍後重試。')
    } finally {
      setLoading(false)
    }
  }

  // Group fields by grouping identifier
  const groupedFields = []
  let currentGroup = []
  let currentGroupId = null

  fields.forEach((field) => {
    if (field.isSystem || field.type === 'info') return

    if (field.grouping) {
      if (field.grouping === currentGroupId) {
        currentGroup.push(field)
      } else {
        if (currentGroup.length > 0) {
          groupedFields.push({ id: currentGroupId, fields: currentGroup })
        }
        currentGroup = [field]
        currentGroupId = field.grouping
      }
    } else {
      if (currentGroup.length > 0) {
        groupedFields.push({ id: currentGroupId, fields: currentGroup })
        currentGroup = []
        currentGroupId = null
      }
      groupedFields.push({ id: null, fields: [field] })
    }
  })
  if (currentGroup.length > 0) {
    groupedFields.push({ id: currentGroupId, fields: currentGroup })
  }

  return (
    <div>
      {/* Branded Navbar */}

      <div className='section'>
        <div className='container' style={{ maxWidth: '1000px' }}>
          {isLocked && (
            <div className='notification is-warning is-light mb-4'>
              回條內容已確定遞交，不予修改。
            </div>
          )}

          {errorMsg && (
            <div className='notification is-danger mb-5'>{errorMsg}</div>
          )}

          {successMsg && (
            <>
              <div className='notification is-warning is-light mb-4'>
                <div className='mb-2'>{successMsg}</div>
                <a
                  type='submit'
                  onClick={() => setSubmitAction('confirm')}
                  className={`button is-warning  ${loading && submitAction === 'confirm' ? 'is-loading' : ''}`}
                  disabled={loading}
                >
                  確認表格並遞交
                </a>
              </div>
            </>
          )}

          <div className='box mb-5'>
            <h1 className='title is-size-4 mb-4'>{formTitle}</h1>
            <hr className='my-3' />
            {formDescription && (
              <div
                className='content is-size-6 line-height-medium'
                dangerouslySetInnerHTML={{
                  __html: marked.parse(formDescription)
                }}
              />
            )}
          </div>

          <form onSubmit={handleSubmit} className='box' noValidate>
            <p className='title is-size-4 mb-4'>表格內容</p>
            <hr className='my-3' />

            {groupedFields.map((group, gIdx) => {
              if (group.id) {
                // Fields are grouped side-by-side
                return (
                  <div className='columns mb-4' key={`g-${gIdx}`}>
                    {group.fields.map((field) => (
                      <div className='column' key={field.key}>
                        <FormInput
                          field={field}
                          value={formData[field.key]}
                          onChange={(val) => handleInputChange(field.key, val)}
                          isLocked={isLocked}
                          signatureData={signatureData}
                          setSignatureData={setSignatureData}
                          error={fieldErrors[field.key]}
                        />
                      </div>
                    ))}
                  </div>
                )
              } else {
                // Single full width field
                const field = group.fields[0]
                return (
                  <div className='mb-4' key={field.key}>
                    <FormInput
                      field={field}
                      value={formData[field.key]}
                      onChange={(val) => handleInputChange(field.key, val)}
                      isLocked={isLocked}
                      signatureData={signatureData}
                      setSignatureData={setSignatureData}
                      error={fieldErrors[field.key]}
                    />
                  </div>
                )
              }
            })}

            {!isLocked && (
              <div className='field is-grouped mt-6 mb-4'>
                <div className='control is-expanded'>
                  <button
                    type='submit'
                    onClick={() => setSubmitAction('save')}
                    className={`button is-warning is-fullwidth ${loading && submitAction === 'save' ? 'is-loading' : ''}`}
                    disabled={loading}
                  >
                    暫存內容
                  </button>
                </div>
                <div className='control is-expanded'>
                  <button
                    type='submit'
                    onClick={() => setSubmitAction('confirm')}
                    className={`button is-link is-fullwidth ${loading && submitAction === 'confirm' ? 'is-loading' : ''}`}
                    disabled={loading}
                  >
                    確認表格並遞交
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
