import Head from 'next/head'

export default function SetupGuide() {
  return (
    <>
      <Head>
        <title>Google 試算表設定指南 | 學校通告及問卷系統</title>
      </Head>
      <div className='section'>
        <div className='container' style={{ maxWidth: '1000px' }}>
          <div className='card'>
            <header className='card-header has-background-link'>
              <p className='card-header-title has-text-white is-size-4'>
                Google 試算表設定指南與範本
              </p>
            </header>
            <div className='card-content'>
              <div className='content'>
                <p className='is-size-5'>
                  此系統支援將網頁表單直接與 Google
                  試算表同步。為了確保系統正常運行，每個表單需設定 2 個工作表
                  (頁籤)，分別是 <strong>info</strong> 與 <strong>data</strong>
                  。 您可以點擊下方按鈕複製預設範本，並直接在您的 Google
                  試算表（Cell A1）中貼上！
                </p>

                <hr />

                {/* Info Sheet Template */}
                <div className='mb-6'>
                  <div className='level'>
                    <div className='level-left'>
                      <h4 className='title is-size-4 mb-2'>
                        第一頁籤：基本資訊工作表 (工作表名稱需包含 "info")
                      </h4>
                    </div>
                    <div className='level-right'>
                      <button
                        onClick={() => {
                          const tsvContent = `FORM_TITLE\tF6 畢業通告及家長回條範本
FORM_DESC\t### 各位家長：請填妥以下回條，以確認 2026 年度畢業典禮之出席意向。
FORM_FOLDER\tGOOGLE_FOLDER_ID`
                          navigator.clipboard
                            .writeText(tsvContent)
                            .then(() =>
                              alert(
                                '「info」工作表範本已成功複製至剪貼簿！請在 Google 試算表的 A1 單格貼上即可。'
                              )
                            )
                            .catch(() => alert('複製失敗，請手動選取複製。'))
                        }}
                        className='button is-link'
                      >
                        複製「info」工作表範本
                      </button>
                    </div>
                  </div>
                  <p className='is-size-6 mb-3'>
                    此工作表格式如下，A 欄為固定標籤，B 欄為對應內容：
                  </p>
                  <div className='table-container'>
                    <table className='table is-bordered is-striped is-fullwidth is-hoverable is-narrow'>
                      <thead>
                        <tr>
                          <th style={{ width: '200px' }}>欄 A (Label)</th>
                          <th>欄 B (Value / 內容)</th>
                          <th>說明</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className='has-text-weight-bold'>
                            <code>FORM_TITLE</code>
                          </td>
                          <td>
                            <code>F6 畢業通告及家長回條範本</code>
                          </td>
                          <td>通告標題</td>
                        </tr>
                        <tr>
                          <td className='has-text-weight-bold'>
                            <code>FORM_DESC</code>
                          </td>
                          <td>
                            <code>
                              ###
                              各位家長：\n\n請填妥以下回條，以確認畢業典禮出席意向。
                            </code>
                          </td>
                          <td>通告內容 / 說明 (Markdown 格式)</td>
                        </tr>
                        <tr>
                          <td className='has-text-weight-bold'>
                            <code>FORM_FOLDER</code>
                          </td>
                          <td>
                            <code>GOOGLE_FOLDER_ID</code>
                          </td>
                          <td>
                            儲存上傳檔案的 Google 雲端硬碟資料夾 ID
                            (若有使用檔案上傳欄位，此項必填)
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <hr />

                {/* Data Sheet Template */}
                <div className='mb-6'>
                  <div className='level'>
                    <div className='level-left'>
                      <h4 className='title is-size-4 mb-2'>
                        第二頁籤：帳號與回條數據工作表 (工作表名稱需包含 "data")
                      </h4>
                    </div>
                    <div className='level-right'>
                      <button
                        onClick={() => {
                          const tsvContent =
                            'KEY\tregno\tclasscode\tclassno\tename\tcname\tsex\thouse\tpassword\ttimestamp\tis_locked\tattending\tdietary\tdoc\nTYPE\tinfo\tinfo\tinfo\tinfo\tinfo\tinfo\tinfo\tinfo\tinfo\tinfo\tselect\ttext\tfile\nGROUP\tLogin\tProfile\tProfile\tProfile\tProfile\tProfile\tProfile\tLogin\tSystem\tSystem\tReply\tReply\tReply\nIS_REQUIRED\tTRUE\tFALSE\tFALSE\tFALSE\tFALSE\tFALSE\tFALSE\tTRUE\tFALSE\tFALSE\tTRUE\tFALSE\tFALSE\nTITLE\tStudent ID\tClass Code\tClass No\tEnglish Name\tChinese Name\tGender\tHouse\tPIN Code\tSubmit Time\tLock Status\tWill you attend?\tDietary Requirements\tDocument Copy\nDESC\tEnter ID\tPre-filled\tPre-filled\tPre-filled\tPre-filled\tPre-filled\tPre-filled\tEnter PIN\tAuto\tLock student form\tPlease select\tPlease list if any\tUpload student ID card copy\nOPTIONS\t\t\t\t\t\t\t\t\t\t\t出席,不出席\t\t\n\t2026001\t6A\t1\tJohn Doe\t陳大文\tM\tRed\t123456\t\t\t\t\t\n\t2026002\t6A\t2\tJane Smith\t張小明\tF\tBlue\t234567\t\t\t\t\t'
                          navigator.clipboard
                            .writeText(tsvContent)
                            .then(() =>
                              alert(
                                '「data」工作表範本已成功複製至剪貼簿！請在 Google 試算表的 A1 單格貼上即可。'
                              )
                            )
                            .catch(() => alert('複製失敗，請手動選取複製。'))
                        }}
                        className='button is-link'
                      >
                        複製「data」工作表範本
                      </button>
                    </div>
                  </div>
                  <p className='is-size-6 mb-3'>
                    此工作表是核心數據表。
                    <strong>
                      Row 1 到 Row 7 是核心配置（不能刪除，必須保留 7 行）
                    </strong>
                    ：
                    <br />- <strong>欄 A</strong> 用於放置行標籤名稱：
                    <code>KEY</code>, <code>TYPE</code>, <code>GROUP</code>,{' '}
                    <code>IS_REQUIRED</code>, <code>TITLE</code>,{' '}
                    <code>DESC</code>, <code>OPTIONS</code>。
                    <br />- <strong>欄 B 至 K</strong>{' '}
                    為預設的固定學生資料與系統欄位（無法修改，其欄位類型一律為{' '}
                    <code>info</code>）：
                    <code>regno</code>, <code>classcode</code>,{' '}
                    <code>classno</code>, <code>ename</code>, <code>cname</code>
                    , <code>sex</code>, <code>house</code>,{' '}
                    <code>password</code>, <code>timestamp</code>,{' '}
                    <code>is_locked</code>。
                    <br />- <strong>欄 L 之後</strong> 為自訂問卷題目（如{' '}
                    <code>attending</code>, <code>dietary</code>,{' '}
                    <code>doc</code>）。
                  </p>
                  <div className='table-container'>
                    <table
                      className='table is-bordered is-striped is-hoverable is-size-7 is-narrow'
                      style={{ minWidth: '950px' }}
                    >
                      <thead>
                        <tr>
                          <th style={{ width: '100px' }}>欄 A (Label)</th>
                          <th>
                            欄 B (`regno`){' '}
                            <span className='has-text-danger'>*</span>
                          </th>
                          <th>欄 C (`classcode`)</th>
                          <th>欄 D (`classno`)</th>
                          <th>欄 E (`ename`)</th>
                          <th>欄 F (`cname`)</th>
                          <th>欄 G (`sex`)</th>
                          <th>欄 H (`house`)</th>
                          <th>
                            欄 I (`password`){' '}
                            <span className='has-text-danger'>*</span>
                          </th>
                          <th>
                            欄 J (`timestamp`){' '}
                            <span className='has-text-danger'>*</span>
                          </th>
                          <th>
                            欄 K (`is_locked`){' '}
                            <span className='has-text-danger'>*</span>
                          </th>
                          <th>欄 L (`attending`)</th>
                          <th>欄 M (`dietary`)</th>
                          <th>欄 N (`doc`)</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>
                            <strong>KEY</strong>
                          </td>
                          <td>
                            <code>regno</code>
                          </td>
                          <td>
                            <code>classcode</code>
                          </td>
                          <td>
                            <code>classno</code>
                          </td>
                          <td>
                            <code>ename</code>
                          </td>
                          <td>
                            <code>cname</code>
                          </td>
                          <td>
                            <code>sex</code>
                          </td>
                          <td>
                            <code>house</code>
                          </td>
                          <td>
                            <code>password</code>
                          </td>
                          <td>
                            <code>timestamp</code>
                          </td>
                          <td>
                            <code>is_locked</code>
                          </td>
                          <td>
                            <code>attending</code>
                          </td>
                          <td>
                            <code>dietary</code>
                          </td>
                          <td>
                            <code>doc</code>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <strong>TYPE</strong>
                          </td>
                          <td>
                            <code>info</code>
                          </td>
                          <td>
                            <code>info</code>
                          </td>
                          <td>
                            <code>info</code>
                          </td>
                          <td>
                            <code>info</code>
                          </td>
                          <td>
                            <code>info</code>
                          </td>
                          <td>
                            <code>info</code>
                          </td>
                          <td>
                            <code>info</code>
                          </td>
                          <td>
                            <code>info</code>
                          </td>
                          <td>
                            <code>info</code>
                          </td>
                          <td>
                            <code>info</code>
                          </td>
                          <td>
                            <code>select</code>
                          </td>
                          <td>
                            <code>text</code>
                          </td>
                          <td>
                            <code>file</code>
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <strong>GROUP</strong>
                          </td>
                          <td>Login</td>
                          <td>Profile</td>
                          <td>Profile</td>
                          <td>Profile</td>
                          <td>Profile</td>
                          <td>Profile</td>
                          <td>Profile</td>
                          <td>Login</td>
                          <td>System</td>
                          <td>System</td>
                          <td>Reply</td>
                          <td>Reply</td>
                          <td>Reply</td>
                        </tr>
                        <tr>
                          <td>
                            <strong>IS_REQUIRED</strong>
                          </td>
                          <td>TRUE</td>
                          <td>FALSE</td>
                          <td>FALSE</td>
                          <td>FALSE</td>
                          <td>FALSE</td>
                          <td>FALSE</td>
                          <td>FALSE</td>
                          <td>TRUE</td>
                          <td>FALSE</td>
                          <td>FALSE</td>
                          <td>TRUE</td>
                          <td>FALSE</td>
                          <td>FALSE</td>
                        </tr>
                        <tr>
                          <td>
                            <strong>TITLE</strong>
                          </td>
                          <td>學號 (Login ID)</td>
                          <td>班別</td>
                          <td>班號</td>
                          <td>英文姓名</td>
                          <td>中文姓名</td>
                          <td>性別</td>
                          <td>社別</td>
                          <td>PIN Code</td>
                          <td>提交時間</td>
                          <td>鎖定狀態</td>
                          <td>是否出席畢業典禮？</td>
                          <td>膳食要求 (如有)</td>
                          <td>學生證副本</td>
                        </tr>
                        <tr>
                          <td>
                            <strong>DESC</strong>
                          </td>
                          <td>請輸入學號</td>
                          <td>預填</td>
                          <td>預填</td>
                          <td>預填</td>
                          <td>預填</td>
                          <td>預填</td>
                          <td>預填</td>
                          <td>請輸入 PIN</td>
                          <td>自動記錄</td>
                          <td>鎖定後無法修改</td>
                          <td>請選擇出席意向</td>
                          <td></td>
                          <td>請上傳學生證副本 (必須設定 FORM_FOLDER)</td>
                        </tr>
                        <tr>
                          <td>
                            <strong>OPTIONS</strong>
                          </td>
                          <td>*(留空)*</td>
                          <td>*(留空)*</td>
                          <td>*(留空)*</td>
                          <td>*(留空)*</td>
                          <td>*(留空)*</td>
                          <td>*(留空)*</td>
                          <td>*(留空)*</td>
                          <td>*(留空)*</td>
                          <td>*(留空)*</td>
                          <td>*(留空)*</td>
                          <td>
                            <code>出席,不出席</code>
                          </td>
                          <td>*(留空)*</td>
                          <td>*(留空)*</td>
                        </tr>
                        <tr>
                          <td>
                            <strong>(Row 8: Data)</strong>
                          </td>
                          <td>2026001</td>
                          <td>6A</td>
                          <td>1</td>
                          <td>John Doe</td>
                          <td>陳大文</td>
                          <td>M</td>
                          <td>Red</td>
                          <td>123456</td>
                          <td>*(提交時寫入)*</td>
                          <td>*(提交時寫入)*</td>
                          <td>*(提交時寫入)*</td>
                          <td>*(提交時寫入)*</td>
                          <td>*(提交時寫入)*</td>
                        </tr>
                        <tr>
                          <td>
                            <strong>(Row 9: Data)</strong>
                          </td>
                          <td>2026002</td>
                          <td>6A</td>
                          <td>2</td>
                          <td>Jane Smith</td>
                          <td>張小明</td>
                          <td>F</td>
                          <td>Blue</td>
                          <td>234567</td>
                          <td>*(提交時寫入)*</td>
                          <td>*(提交時寫入)*</td>
                          <td>*(提交時寫入)*</td>
                          <td>*(提交時寫入)*</td>
                          <td>*(提交時寫入)*</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className='notification mt-3 py-2 px-3 is-size-7'>
                    <strong>💡 提示:</strong>{' '}
                    <span className='has-text-danger'>*</span> 標記的列 (regno,
                    password, timestamp, is_locked)
                    是系統登入與運算的核心，請務必按照範例完整保留。Row 8+
                    的學生名單請在匯入系統前先預填妥。
                  </div>

                  <div className='mt-5'>
                    <h5 className='title is-size-5 mb-2'>
                      問卷題目類型 (TYPE) 說明與範例
                    </h5>
                    <p className='is-size-6 mb-3'>
                      在 <code>TYPE</code>{' '}
                      列中，您可以為自訂欄位設定以下各種類型，並在{' '}
                      <code>OPTIONS</code> 列進行對應設定：
                    </p>
                    <div className='table-container'>
                      <table className='table is-bordered is-striped is-fullwidth is-hoverable is-size-7 is-narrow'>
                        <thead>
                          <tr>
                            <th style={{ width: '150px' }}>問卷類型 (TYPE)</th>
                            <th style={{ width: '200px' }}>說明</th>
                            <th>OPTIONS 設定要求</th>
                            <th>範例</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td>
                              <code>text</code>
                            </td>
                            <td>單行文字輸入欄</td>
                            <td>留空</td>
                            <td>
                              <code>姓名</code>、<code>備註</code>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <code>textarea</code>
                            </td>
                            <td>多行文字輸入欄</td>
                            <td>留空</td>
                            <td>
                              <code>意見回饋</code>、<code>詳細地址</code>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <code>number</code>
                            </td>
                            <td>數字輸入欄</td>
                            <td>留空</td>
                            <td>
                              <code>年齡</code>、<code>隨行人數</code>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <code>date</code>
                            </td>
                            <td>日期選擇欄</td>
                            <td>留空</td>
                            <td>
                              <code>出生日期</code>、<code>預計抵達日期</code>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <code>select</code>
                            </td>
                            <td>下拉選單</td>
                            <td>
                              以半形逗號 <code>,</code> 分隔各個選項
                            </td>
                            <td>
                              於 OPTIONS 填寫：<code>出席,不出席</code>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <code>radio</code>
                            </td>
                            <td>單選按鈕組</td>
                            <td>
                              以半形逗號 <code>,</code> 分隔各個選項
                            </td>
                            <td>
                              於 OPTIONS 填寫：<code>男,女</code> 或{' '}
                              <code>是,否</code>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <code>checkbox</code>
                            </td>
                            <td>單一剔選方塊 (同意/確認)</td>
                            <td>留空 (預設顯示於表單上為勾選同意)</td>
                            <td>
                              <code>我同意上述安排</code>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <code>file_download</code>
                            </td>
                            <td>檔案下載與詳閱確認 (附帶剔選框)</td>
                            <td>填寫要提供下載的檔案網址</td>
                            <td>
                              於 OPTIONS 填寫檔案 URL 連結：
                              <code>https://example.com/handbook.pdf</code>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <code>file</code>
                            </td>
                            <td>
                              檔案上傳欄位 (
                              <span className='has-text-danger'>
                                注意：必須在 <code>info</code> 工作表中填妥{' '}
                                <code>FORM_FOLDER</code> 雲端資料夾 ID
                              </span>
                              )
                            </td>
                            <td>留空</td>
                            <td>
                              <code>上傳學生證副本</code>、<code>上傳相片</code>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <code>signature</code>
                            </td>
                            <td>電子簽名板</td>
                            <td>留空</td>
                            <td>
                              <code>家長簽署</code>、<code>學生簽名</code>
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <code>info</code>
                            </td>
                            <td>唯讀資訊欄位 (僅顯示，不可修改)</td>
                            <td>留空</td>
                            <td>
                              <code>學號</code>、<code>中文姓名</code>{' '}
                              等預設匯入資料
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <hr />

                {/* Integration Details */}
                <div>
                  <h4 className='title is-size-4'>🔗 如何與系統整合</h4>
                  <ol>
                    <li>
                      建立一個新的 Google
                      試算表，並新增兩個工作表（工作表名稱必須包含{' '}
                      <code>info</code> 和 <code>data</code>，例如預設的{' '}
                      <code>info</code> 與 <code>data</code>）。
                    </li>
                    <li>
                      複製上方的範本並分別貼上到兩個工作表。在 <code>data</code>{' '}
                      工作表中，預填好學生名單（Row 8 開始）。
                    </li>
                    <li>
                      確保將該 Google 試算表的<strong>共用設定</strong>
                      ，分享給系統的服務帳戶（Service Account，通常是一個{' '}
                      <code>@...iam.gserviceaccount.com</code> 結尾的
                      Email）並賦予<strong>「編輯者 (Editor)」</strong>權限。
                    </li>
                    <li>
                      在首頁輸入您的<strong> Google 試算表 ID</strong>{' '}
                      (即試算表網址中 <code>/d/</code> 與 <code>/edit</code>{' '}
                      之間的一長串字元)。
                    </li>
                    <li>
                      系統將自動讀取您的試算表設定，並建立相對應的家長登入與問卷填寫頁面！
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
