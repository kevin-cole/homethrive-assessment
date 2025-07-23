# HomeThrive Medication Manager Assignment

A POC medication management system built with SST (Serverless Stack) that allows caregivers to manage medications for care recipients. The system uses a file-based sql.js database with S3 synchronization for data persistence.

## Ruminations on project

- I decided to go with a more layman’s ui for medication dosing vs a medical professional ui, as my assumption is these will be entered after a script has been written, by the care giver who has read the more medical dosing and made it work for their loved one.
- The concept of a "daily" schedule is just UI sugar, as all schedules are normalized to weekly schedules in the backend. The schedule type is saved in the on the medication record in case of future editing.
- Ad-hoc scheduling should be implemented for non-chronic medications that do not recur and dosing is finite (like antibiotics.) In these cases medication_times are not necessary and all dosing can be created immediately.

## 🎯 Business Requirements Met

✅ **Add medications for care recipients** - Full CRUD operations for medications
✅ **Define medication schedules** - Support for daily and weekly recurrence patterns
✅ **View upcoming medication doses** - Dashboard with upcoming and overdue doses
✅ **Mark medications as taken** - Simple UI for tracking dose administration
✅ **Medications must have at least one scheduled dose** - Enforced during creation
✅ **Medications cannot be removed, only marked inactive** - Soft delete implementation
✅ **Support daily and weekly recurrence** - Flexible scheduling system

## 🏗️ Technical Architecture

### Backend (AWS Serverless)

- **SST Framework**: Serverless application framework
- **AWS Lambda**: Serverless compute functions
- **API Gateway**: RESTful API endpoints
- **S3 Bucket**: Database file storage and synchronization
- **SQL.js**: File-based database
- **TypeScript**: Type-safe development

### Frontend (React)

- **React 18**: Modern React with hooks
- **TypeScript**: Type-safe frontend development
- **Tailwind CSS**: Utility-first styling
- **React Query**: Server state management
- **React Router**: Client-side routing
- **Vite**: Fast build tool and dev server

## 📊 Database Schema

```sql
CREATE TABLE IF NOT EXISTS care_recipients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'America/Denver',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS medications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipient_id INTEGER NOT NULL,
  recurrence TEXT CHECK(recurrence IN ('daily','weekly','none')),
  name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  instructions TEXT,
  start_at DATETIME NOT NULL,
  end_at DATETIME DEFAULT NULL,
  inactive_at DATETIME DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (recipient_id) REFERENCES care_recipients (id)
);

CREATE TABLE IF NOT EXISTS medication_times (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  medication_id INT NOT NULL,
  weekday TEXT CHECK(weekday IN ('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday')) NOT NULL,
  time TIME NOT NULL,
  FOREIGN KEY (medication_id) REFERENCES medications(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS medication_doses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  medication_id INTEGER NOT NULL,
  medication_times_id INTEGER NOT NULL,
  scheduled_at DATETIME NOT NULL,
  date DATE NOT NULL,
  time DATETIME NOT NULL,
  taken_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (medication_id) REFERENCES medications (id),
  FOREIGN KEY (medication_times_id) REFERENCES medication_times (id)
);
```

## 🚀 API Endpoints

- **POST /login**
  Authenticate user and return JWT tokens.

- **GET /recipients**
  List all recipients.

- **GET /recipients/{recipient_id}**
  Get recipient details.

- **GET /recipients/{recipient_id}/medications**
  List all medications for a recipient.

- **POST /recipients/{recipient_id}/medications**
  Add a new medication for a recipient.

- **GET /recipients/{recipient_id}/medications/{medication_id}**
  Get details for a specific medication.

- **PATCH /recipients/{recipient_id}/medications/{medication_id}/archive**
  Archive (deactivate) a medication.

- **GET /recipients/{recipient_id}/medications/{medication_id}/schedule**
  Get the weekly schedule for a medication (times only).

- **GET /recipients/{recipient_id}/doses**
  List doses for a recipient, filterable by period (daily/weekly).

- **POST /recipients/{recipient_id}/doses/{dose_id}/take**
  Mark a dose as taken.

## 🎨 Frontend Features

- **Authentication**
  Secure login with JWT, automatic token refresh, and redirect on expiration.

- **Recipient Dashboard**
  View recipient's current medications.

- **Current Medications**
  - List all active medications.
  - Toggle to show/hide inactive (archived) medications.
  - Click a medication to view details.

- **Add Medication**
  - Add a new medication with name, dosage, recurrence, and schedule.
  - Redirects to dashboard after adding.

- **Medication Detail Page**
  - View medication info and weekly schedule.
  - Archive medication and reload list.

- **Upcoming Doses**
  - See upcoming doses for the recipient.
  - Mark doses as taken.

- **Navigation**
  - Clean, modern UI with navigation between dashboard, medication details, and add medication.

- **Global State Management**
  - Uses React Context for authentication and recipient data.
  - React Query for data fetching and cache invalidation.

- **Responsive Design**
  - Styled with Tailwind CSS for a responsive, accessible interface.

## 🛠️ Setup & Installation

### Prerequisites

- **Node.js** (v18 or later recommended)
- **pnpm** (used as the package manager)
- **AWS Account** (for deploying with SST)
- **SST CLI** (`npm install -g sst`)
- **(Optional) AWS CLI** (for local development and deployment)
- **(Optional) Docker** (for local Lambda emulation)

### 1. Install Dependencies

```bash
# Install root dependencies
npm install

# Install function dependencies
cd packages/functions && npm install && cd ../..

# Install frontend dependencies
cd packages/frontend && npm install && cd ../..
```

### 2. Configure AWS

```bash
aws configure
```

### 3. Deploy Backend

```bash
npm run deploy
```

### 4. Start Frontend Development

```bash
cd packages/frontend
npm run dev
```

## 🔧 Development

### Backend Development

```bash
# Start SST development environment
npm run dev

# View logs and manage resources
npm run console

# Deploy changes
npm run deploy
```

### Frontend Development

```bash
cd packages/frontend

# Start development server
npm run dev

# Build for production
npm run build

# Type checking
npm run typecheck
```

## 💡 Key Features Explained

### Database Persistence Strategy

Instead of using AWS RDS or DynamoDB, this application uses a **file-based sql.js database**.
The database file is:

1. Stored in S3 for persistence
2. Downloaded to Lambda `/tmp/` on function startup
3. All operations performed on local file
4. Uploaded back to S3 after write operations

### Medication Scheduling

The system supports two recurrence types on he front end:

- **Daily**: Medication taken every day at the same time
- **Weekly**: Medication taken on specific days of the week

The scheduled doses are normalized to the same structure on the front end before persistence as (weekday, time) tuple.

When a medication is created:

1. Schedules are created based on recurrence patterns
2. Doses are generated for the next 7 days
3. TODO: add chron job to create doses
4. TODO: add method for determining possible doses into the future

I determined actual dosing persistence is only necessary to persist state (as in taken.) Future dosing can be extrapolated from the medication_times table and any given timeframe

### Dose Tracking

- Doses are created for 7 days currently synchronously on save.
- Caregivers can mark doses as taken
- System tracks overdue and upcoming doses
- TODO: move dose creating to an event based architecture

## 🚀 Deployment

### Backend Deployment

```bash
npm run deploy
```

This creates:

- API Gateway with REST endpoints
- Lambda functions for each API route
- S3 bucket for database storage
- CloudFormation stack for resource management

### Frontend Deployment

```bash
cd packages/frontend
npm run build
```

The built files can be deployed to:

- AWS S3 + CloudFront
- Vercel
- Netlify
- Any static hosting service

## 🔒 Security Considerations

- S3 bucket is private by default
- API Gateway provides built-in DDoS protection
- Lambda functions run in isolated environments
- No sensitive data stored in client-side code
