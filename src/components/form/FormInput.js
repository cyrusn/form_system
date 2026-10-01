import SignatureInput from '@/components/form/SignatureInput';

export default function FormInput({ field, value, onChange, isLocked, signatureData, setSignatureData, error }) {
  if (field.type === 'signature') {
    return (
      <div className="field">
        <label className="label">
          {field.title} {field.isRequired && <span className="has-text-danger">*</span>}
        </label>
        {field.description && <p className="help mb-2">{field.description}</p>}
        {error && <p className="help is-danger mb-2 font-weight-bold">{error}</p>}
        <div className="control">
          <SignatureInput
            signatureData={signatureData}
            setSignatureData={setSignatureData}
            isLocked={isLocked}
          />
        </div>
      </div>
    );
  }

  if (field.type === 'file') {
    const isUrl = typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'));
    const fileName = value instanceof File ? value.name : '';

    return (
      <div className="field">
        <label className="label">
          {field.title} {field.isRequired && !value && <span className="has-text-danger">*</span>}
        </label>
        {field.description && <p className="help mb-2">{field.description}</p>}
        {error && <p className="help is-danger mb-2 font-weight-bold">{error}</p>}
        {isUrl && (
          <div className="notification px-3 mb-2 is-size-7">
            已上傳檔案：
            <a href={value} target="_blank" rel="noopener noreferrer" className="has-text-link font-weight-bold ml-1">
              [點此查看目前檔案]
            </a>
          </div>
        )}
        <div className="control">
          <div className="file has-name is-fullwidth">
            <label className="file-label">
              <input
                className="file-input"
                type="file"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    onChange(e.target.files[0]);
                  } else {
                    onChange('');
                  }
                }}
                disabled={isLocked}
                required={field.isRequired && !value}
              />
              <span className="file-cta">
                <span className="file-label">
                  {isLocked ? '🔒 唯讀' : '選擇檔案...'}
                </span>
              </span>
              {(fileName || isUrl) && (
                <span className="file-name">
                  {fileName || '已保留目前檔案'}
                </span>
              )}
            </label>
          </div>
        </div>
      </div>
    );
  }

  if (field.type === 'file_download') {
    const fileUrl = field.options[0] || '#';
    const checked = value === 'yes';
    
    return (
      <div className="field card py-4 px-4 has-background-white-ter">
        <label className="label mb-3">{field.title}</label>
        {field.description && <p className="help mb-3">{field.description}</p>}
        {error && <p className="help is-danger mb-2 font-weight-bold">{error}</p>}
        <div className="buttons mb-3">
          <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="button is-info is-small">
            📥 下載 / 閱讀相關文件 ({field.title})
          </a>
        </div>
        <div className="control">
          <label className="checkbox">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => onChange(e.target.checked ? 'yes' : '')}
              disabled={isLocked}
              required={field.isRequired}
            />{' '}
            我已下載並詳閱上述附件內容。
          </label>
        </div>
      </div>
    );
  }

  return (
    <div className="field">
      <label className="label">
        {field.title} {field.isRequired && <span className="has-text-danger">*</span>}
      </label>
      {field.description && <p className="help mb-2">{field.description}</p>}
      {error && <p className="help is-danger mb-2 font-weight-bold">{error}</p>}
      <div className="control">
        {field.type === 'textarea' ? (
          <textarea
            className="textarea"
            placeholder={field.description || `請輸入${field.title}`}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={isLocked}
            required={field.isRequired}
          />
        ) : field.type === 'select' ? (
          <div className="select is-fullwidth">
            <select
              value={value || ''}
              onChange={(e) => onChange(e.target.value)}
              disabled={isLocked}
              required={field.isRequired}
            >
              <option value="">-- 請選擇 --</option>
              {field.options.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        ) : field.type === 'radio' ? (
          <div className="control">
            {field.options.map(opt => (
              <label className="radio mr-4" key={opt}>
                <input
                  type="radio"
                  name={field.key}
                  value={opt}
                  checked={value === opt}
                  onChange={(e) => onChange(e.target.value)}
                  disabled={isLocked}
                  required={field.isRequired}
                />{' '}
                {opt}
              </label>
            ))}
          </div>
        ) : field.type === 'checkbox' ? (
          <div className="control">
            <label className="checkbox">
              <input
                type="checkbox"
                checked={value === 'yes'}
                onChange={(e) => onChange(e.target.checked ? 'yes' : '')}
                disabled={isLocked}
                required={field.isRequired}
              />{' '}
              {field.description || '同意 / 確定'}
            </label>
          </div>
        ) : (
          <input
            className="input"
            type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
            placeholder={field.description || `請輸入${field.title}`}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={isLocked}
            required={field.isRequired}
          />
        )}
      </div>
    </div>
  );
}
