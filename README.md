# Form System

A flexible, lightweight custom form system built with **Next.js**, **SQLite**, and **Google Sheets integration**. This application allows you to host dynamic web forms directly powered by Google Sheets. There is no complex administration dashboard or database migrations required; the entire form structure, user access control, and response storage are managed directly within your Google Spreadsheet.

## Features

- **Google Sheets as a CMS & Database**: Every Google Sheet is its own form. The URL slug of the form is the Google Spreadsheet ID itself.
- **Dynamic Form Generation**: Reads header metadata from the Google Sheet to automatically build form sections, fields, validations, and markdown notice descriptions.
- **Secure Student Authentication**: Authenticates users (students/parents) using credentials (registration number & PIN code) defined directly in the Google Sheet.
- **Local SQLite Signature Storage**: Securely stores submitted digital signatures locally in SQLite and links them to the student and form ID.
- **File Upload to Google Drive**: Automatically uploads files to a specified Google Drive folder for file-upload questions.
- **Submission Locking**: Supports locking submissions (`is_locked` column in the Google Sheet) to prevent users from altering submitted replies.
- **Auto-Resolution of Sheet Names**: Automatically finds sheets containing "info" and "data" in their tab names.

---

## Prerequisites

Before setting up, ensure you have the following installed:
- **Node.js**: Version 18.x or v20+ (Tested on Node.js v24)
- **npm**: Package manager (comes with Node.js)

You will also need a **Google Cloud Project** with:
1. **Google Sheets API** and **Google Drive API** enabled.
2. A **Service Account** with a JSON key file downloaded.
3. Access to share target Google Sheets with the Service Account email.

---

## Setup & Installation

### 1. Install Dependencies
In the root directory of the project, run:
```bash
npm install
```

### 2. Configure Environment Variables
Copy the `.env.example` file to create your own `.env` file:
```bash
cp .env.example .env
```
Open `.env` and fill in the required variables:

- `NEXT_PUBLIC_APP_URL`: The URL of your application (e.g., `http://localhost:3000`).
- `JWT_SECRET`: A secure random secret key used to sign JWT session cookies.
- `DATABASE_PATH`: The location where you want your SQLite database file to be saved (e.g., `./data/db.sqlite`).
- `GOOGLE_API_KEY_FILENAME`: The path to your Google Service Account JSON key file (e.g., `.env.key.json`).
- `GOOGLE_SUBJECT_EMAIL`: The Google Workspace administrator email to impersonate (optional/if applicable; usually left as-is if using direct service account sharing).

### 3. Place Google API Credentials & Share Spreadsheet
1. Place your Google Service Account JSON file in the project root and rename it to `.env.key.json`.
2. Open the JSON file, copy the `client_email` value.
3. **Important:** Share every Google Sheet you want to use with this `client_email` with **Editor** permissions.

### 4. Initialize the Database
Initialize your SQLite database (which stores digital signatures):
```bash
npm run init-db
```
This script ensures the target data directory exists and creates the local database file.

---

## Running the Application

### Development Mode
To start the application in development mode with hot-reloading:
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### Production Mode
To build the application for production and start the production server:
```bash
npm run build
npm start
```

---

## Google Spreadsheet Template & Schema

To use this system, each form requires a Google Sheet configured with exactly **two tabs/worksheets** (containing "info" and "data" in their names respectively).

### Tab 1: Info Sheet (e.g., `info`)
This sheet defines the header title, description, and target Google Drive folder shown or used on your form page. Column A contains labels and Column B contains their values.

| Column A (Label) | Column B (Value / 內容) | Explanation |
| :--- | :--- | :--- |
| **`FORM_TITLE`** | `F6 Annual School Picnic Reply Slip` | **Form Title** shown at the top of the webpage. |
| **`FORM_DESC`** | `### Dear Parents, \n Please indicate...` | **Form Description** supporting Markdown formatting. |
| **`FORM_FOLDER`** | `1a2b3c4d5e...` | **Google Drive Folder ID** for storing files uploaded by students (Required if using `file` questions). |

---

### Tab 2: Data Sheet (e.g., `data`)
This sheet holds both your student database (login config) and responses. It **must contain exactly 7 rows of metadata headers** in Column A before the actual student data starts on **Row 8**.

#### Row Label Specifications (Column A:A)
1. **Row 1 (KEY)**: The system-level variable name.
2. **Row 2 (TYPE)**: The HTML input field type for questions. Standard profile columns **must use `info`**. Questions use `text`, `select`, `file`, etc.
3. **Row 3 (GROUP)**: The grouping category to visually structure the web form (e.g., `Login`, `Profile`, `Reply`).
4. **Row 4 (IS_REQUIRED)**: Set to `TRUE`, `YES`, or `1` if a field is mandatory; otherwise, leave blank.
5. **Row 5 (TITLE)**: The user-friendly label displayed on the web form.
6. **Row 6 (DESC)**: Help text/instructions shown beneath the question.
7. **Row 7 (OPTIONS)**: Comma-separated selection values if Row 2 type is `select`, `radio`, or `checkbox` (e.g., `Yes, No`).

#### Mandatory Student Profile & System Columns (Columns B to K with TYPE `info`)
Columns B through K are strictly required standard columns. Their `TYPE` row value must be set to `info`. These fields are pre-filled by the administrator and **cannot be updated** via the web form (except `timestamp`, which is populated automatically by the system upon submission):
- **Column B**: `regno` (Student Login ID / Reg No)
- **Column C**: `classcode` (Student Class)
- **Column D**: `classno` (Student Class Number)
- **Column E**: `ename` (Student English Name)
- **Column F**: `cname` (Student Chinese Name)
- **Column G**: `sex` (Student Gender)
- **Column H**: `house` (Student House)
- **Column I**: `password` (Student PIN Code for Login)
- **Column J**: `timestamp` (Auto-filled submit timestamp)
- **Column K**: `is_locked` (Lock Status - set to `TRUE` to freeze the form for a student)

#### Custom Questions (Column L onwards)
Custom reply slip questions start from **Column L** (e.g., `attending`, `dietary`, etc.).

#### Example Visual Layout of Data Sheet:

| Row Label (Col A) | Col B (`regno`) | Col C (`classcode`) | ... | Col I (`password`) | Col J (`timestamp`) | Col K (`is_locked`) | Col L (`attending`) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **KEY** | `regno` | `classcode` | ... | `password` | `timestamp` | `is_locked` | `attending` |
| **TYPE** | `info` | `info` | ... | `info` | `info` | `info` | `select` |
| **GROUP**| Login | Profile | ... | Login | System | System | Reply Slip |
| **IS_REQUIRED**| TRUE | FALSE | ... | TRUE | FALSE | FALSE | TRUE |
| **TITLE** | Student ID | Class Code | ... | PIN Code | Submit Time | Lock Status | Will you attend? |
| **DESC** | Enter ID | Pre-filled | ... | Enter PIN | Auto | Lock Form | Please select |
| **OPTIONS** | | | ... | | | | Yes, No |
| **Row 8 (Record)** | `2026001` | `6A` | ... | `123456` | *(Auto-filled)* | `FALSE` | *(Filled on submit)* |
| **Row 9 (Record)** | `2026002` | `6A` | ... | `234567` | *(Auto-filled)* | `TRUE` | *(Form Locked)* |

---

## Usage Guide

### 1. Accessing a Form
1. Copy the Google Spreadsheet ID of your shared spreadsheet.
   *(E.g., for `https://docs.google.com/spreadsheets/d/1A2B3C4D5E.../edit`, the ID is `1A2B3C4D5E...`)*
2. Go to the Home Page: `http://localhost:3000/`.
3. Paste the Spreadsheet ID into the box and click **"進入表格" (Enter Form)**.
4. Alternatively, go directly to:
   ```
   http://localhost:3000/login/[SPREADSHEET_ID]
   ```

### 2. Form Login & Submission
- Enter the Student Registration ID (`regno`) and PIN code (`password`) as configured in the Spreadsheet (Row 8 onwards).
- Fill out the generated form, upload any requested files, sign the signature pad, and submit.
- The responses will be appended to the student's corresponding row in the Google Sheet.
- The signature is securely saved locally in the SQLite database and can be reviewed.

---

## Troubleshooting

### "Could not locate the bindings file" (`better-sqlite3` compile error)
If you see an error stating `Error: Could not locate the bindings file` when launching or initializing the database, it means the compiled C++ binaries for `better-sqlite3` do not match your current system architecture (e.g., moving between Intel and Apple Silicon macs) or Node.js version.

To resolve this, run:
```bash
npm rebuild better-sqlite3
```
If it still fails, perform a clean reinstall of dependencies:
```bash
rm -rf node_modules package-lock.json
npm install
```
