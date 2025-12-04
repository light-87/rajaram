# Personal Productivity Hub

A comprehensive personal productivity web application for tracking finances (loan management), time/productivity, business clients, and daily journaling. Built with Next.js 15, TypeScript, Tailwind CSS, and Supabase.

> _"I'm not building a business today. I'm buying my freedom."_

## Features

### ✅ Loan Tracker (Complete)
- **Loan Management**: Track your loan principal, current balance, and interest rate
- **Payment Logging**: Record payments with automatic interest calculation
- **Freedom Progress**: Visual progress bar showing how much of your loan is paid off
- **EMI Calculator**: Calculate payoff time with or without extra payments
- **Payment History**: Detailed table showing all payments with interest/principal breakdown
- **Interest Tracking**: Monitor total interest paid vs principal paid

### ✅ Time Tracker (Complete)
- **Quick Logging**: Fast entry form for logging time across different categories
- **Effort Points System**: Track daily effort with a goal of 50 points
- **Today's Summary**: Real-time view of today's progress
- **Weekly View**: Bar chart visualization of the current week's productivity
- **Category Breakdown**: See time distribution across UK Job, Solar App, Factory App, Personal, Uni, and Gym
- **Gym Tracking**: Special handling for gym sessions (automatic 1 point)
- **Comprehensive List**: Filterable table of all time entries

### 🚧 Coming Soon
- **Clients Module**: Manage business clients, contracts, and payment schedules
- **Journal Module**: Daily journaling with mood and energy tracking
- **Full Dashboard**: Aggregated view of all modules with quick actions
- **Streak Tracking**: Monitor consecutive days of productivity
- **Two-Day Rule Alerts**: Get notified if you miss 2 days
- **CSV Export**: Export all data to CSV files

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Neon PostgreSQL (Serverless)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **Hosting**: Vercel-ready

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Neon account (free tier works great)
- Git

### 1. Clone the Repository

```bash
cd productivity-hub
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up Neon PostgreSQL Database

1. Create a new project on [Neon](https://neon.tech) (free tier available)
2. Create a new database in your Neon project
3. Go to SQL Editor in your Neon dashboard
4. Run the SQL migration script from `supabase-migration.sql`:

```bash
# Copy the contents of supabase-migration.sql and run it in Neon SQL Editor
```

This will create all necessary tables:
- `loans` - Store loan information
- `loan_payments` - Track all loan payments
- `time_entries` - Log time/productivity entries
- `clients` - Manage business clients (ready for future use)
- `journal_entries` - Daily journal entries (ready for future use)

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:

```env
# Neon PostgreSQL Configuration
NEXT_PUBLIC_DATABASE_URL=postgresql://user:password@host.neon.tech/dbname?sslmode=require

# Authentication (5-digit PIN)
APP_PIN=your_5_digit_pin
```

**Getting Neon Credentials:**
1. Go to your Neon project dashboard
2. Click on "Connection Details"
3. Copy the connection string (make sure to select "Pooled connection")
4. Replace `[user]`, `[password]`, `[host]`, and `[dbname]` with your actual values

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. First Login

Enter your 5-digit PIN (set in `.env.local` as `APP_PIN`)

## Project Structure

```
productivity-hub/
├── app/                      # Next.js App Router pages
│   ├── dashboard/           # Dashboard page
│   ├── loans/               # Loan tracker page
│   ├── time/                # Time tracker page
│   ├── clients/             # Clients page
│   ├── journal/             # Journal page
│   ├── api/                 # API routes (auth)
│   ├── layout.tsx           # Root layout with providers
│   ├── page.tsx             # Root redirect
│   └── globals.css          # Global styles
├── components/              # React components
│   ├── ui/                  # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Modal.tsx
│   │   ├── Badge.tsx
│   │   ├── ProgressBar.tsx
│   │   ├── Toast.tsx
│   │   ├── Loading.tsx
│   │   ├── EmptyState.tsx
│   │   └── PINEntry.tsx
│   ├── loans/               # Loan tracker components
│   ├── time/                # Time tracker components
│   ├── Navigation.tsx       # Main navigation
│   └── AuthGuard.tsx        # Authentication wrapper
├── lib/                     # Utilities and config
│   ├── supabase.ts          # Supabase client
│   ├── auth.tsx             # Authentication context
│   └── utils.ts             # Helper functions
├── types/                   # TypeScript types
│   └── database.ts          # Database entity types
├── supabase-migration.sql   # Database setup script
└── README.md               # This file
```

## Usage Guide

### Loan Tracker

**Initial Setup:**
1. Navigate to "Loan Tracker"
2. Fill in your loan details (principal, interest rate, start date)
3. Click "Initialize Loan"

**Logging Payments:**
1. Click "Log Payment" button
2. Enter payment date and amount
3. Select payment type (Regular EMI or Extra Payment)
4. Optionally add notes
5. System automatically calculates interest and principal breakdown

**Using EMI Calculator:**
1. Click "Show Calculator"
2. Enter your monthly EMI amount
3. Optionally enter extra payment amount
4. Click "Calculate Payoff" to see:
   - Months to payoff
   - Total interest payable
   - Payoff date
   - Savings with extra payments

### Time Tracker

**Logging Time:**
1. Navigate to "Time Tracker"
2. Select date, category, and hours
3. For Gym: No need to enter hours (automatic 1 point)
4. Optionally add description
5. Click "Log" button

**Understanding Effort Points:**
- Work categories (UK Job, Solar App, etc.): 1 point per hour
- Gym: Fixed 1 point regardless of duration
- Daily goal: 50 points
- Weekly tracking shows color-coded progress

**Viewing Analytics:**
- Today's Summary: Real-time progress toward 50-point goal
- Weekly View: Bar chart of last 7 days
- Time Entries: Filterable list of all entries

## Deployment to Vercel

### Option 1: Via Vercel Dashboard

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `APP_PIN`
6. Click "Deploy"

### Option 2: Via Vercel CLI

```bash
npm install -g vercel
vercel login
vercel
# Follow prompts and add environment variables
```

## Design System

### Color Palette (Dark Mode)
- Background: `#0A0E27` (deep navy)
- Card Background: `#151821`
- Primary Accent: `#F59E0B` (amber/orange) - for financial elements
- Secondary Accent: `#3B82F6` (blue) - for productivity
- Success: `#10B981` (green) - for positive metrics
- Text Primary: `#E8E8E8` (off-white)
- Text Secondary: `#9CA3AF` (gray)

### Typography
- Headings: Inter (bold)
- Body: System font stack
- Numbers: Monospace (for tabular data)

## Database Schema

### Loans Table
```sql
id: uuid (PK)
name: text
initial_principal: decimal
current_balance: decimal
interest_rate: decimal
start_date: date
created_at: timestamp
updated_at: timestamp
```

### Loan Payments Table
```sql
id: uuid (PK)
loan_id: uuid (FK)
payment_date: date
amount_paid: decimal
payment_type: 'regular' | 'extra' | 'adjustment'
notes: text
balance_after_payment: decimal
interest_accrued: decimal
principal_paid: decimal
created_at: timestamp
```

### Time Entries Table
```sql
id: uuid (PK)
date: date
category: 'UK Job' | 'Solar App' | 'Factory App' | 'Personal' | 'Uni' | 'Gym'
hours: decimal
effort_points: integer
description: text
created_at: timestamp
```

## Calculations

### Interest Calculation
Simple interest formula:
```
interest = principal × (rate / 100) × (days / 365)
```

### Effort Points
- Work categories: `points = hours × 1`
- Gym: `points = 1` (fixed)
- Daily goal: `50 points`

### EMI Payoff Calculator
```
monthly_rate = annual_rate / 12 / 100
emi = (principal × monthly_rate × (1 + monthly_rate)^months) / ((1 + monthly_rate)^months - 1)
```

## Security Notes

- **PIN Authentication**: Simple 5-digit PIN stored in environment variable (suitable for single-user)
- **Session Management**: Uses localStorage for auth state
- **Supabase RLS**: Row Level Security can be enabled if needed
- **No Sensitive Data**: App doesn't store passwords or financial account details

## Troubleshooting

### Build Errors
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

### Supabase Connection Issues
1. Verify environment variables are set correctly
2. Check Supabase project is active
3. Ensure API keys have correct permissions

### Authentication Issues
1. Clear browser localStorage
2. Verify `APP_PIN` matches in `.env.local`
3. Check API route `/api/auth/verify` is accessible

## Future Enhancements

- [ ] Complete Clients module
- [ ] Complete Journal module
- [ ] Complete Dashboard with all widgets
- [ ] Add streak tracking for time entries
- [ ] Implement two-day rule monitoring
- [ ] Add CSV export for all modules
- [ ] Dark/Light theme toggle
- [ ] Mobile app version
- [ ] Email/SMS reminders
- [ ] Data backup/restore
- [ ] Goal setting per category
- [ ] Advanced analytics and insights

## Contributing

This is a personal project, but suggestions and feedback are welcome!

## License

This project is created for personal use. Feel free to fork and adapt for your own needs.

## Acknowledgments

- Design inspired by Claude AI/Anthropic aesthetic
- Built with modern React and Next.js best practices
- Powered by Supabase for database and real-time capabilities

---

**Made with determination to achieve financial freedom.** 🚀
