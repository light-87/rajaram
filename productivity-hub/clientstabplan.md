# Clients Tab Implementation Plan

## Design: Revenue Dashboard + List/Details Hybrid
**"Complete Client Command Center"**

---

## Visual Layout

```
┌──────────────────────────────────────────────────────────────┐
│ 📊 KEY METRICS                                               │
│ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│ │ Total ARR   │ │ Active      │ │ This Month  │            │
│ │ ₹2,40,000   │ │ 12 Clients  │ │ ₹45,000     │            │
│ │ +₹30k YoY   │ │ 3 Pending   │ │ 3 Payments  │            │
│ └─────────────┘ └─────────────┘ └─────────────┘            │
├──────────────────────────────────────────────────────────────┤
│ 📅 UPCOMING PAYMENTS (Next 30 Days)                          │
│ • Dec 15 - Client A (ABC Solar) - ₹25,000 - Solar App       │
│ • Dec 20 - Client B (PMR Industries) - ₹30,000 - Factory    │
│ • Jan 5  - Client C (XYZ Solar) - ₹25,000 - Solar App       │
│                                          [View All Payments→]│
├──────────────────────────────────────────────────────────────┤
│ [+ New Client] [Search...] [Product: All▾] [Status: All▾]   │
├───────────────┬──────────────────────────────────────────────┤
│ CLIENTS (15)  │ CLIENT DETAILS                               │
│               │                                              │
│ ⭐ ABC Solar  │ 👤 Client A                                  │
│   ☀ Solar App │ 🏢 ABC Solar Pvt Ltd                         │
│   ₹25k/year   │ 📧 owner@abc.com | 📞 +91 98123 45678       │
│   Next: 15 Dec│ ─────────────────────────────────────────    │
│               │ 💼 Product: Solar App                        │
│ ⭐ PMR Ind.   │ 💰 Contract: ₹25,000/year                    │
│   🏭 Factory  │ 📅 Next Payment: Dec 15, 2025               │
│   ₹30k+₹12k   │ 📊 Status: Active                            │
│   Next: 20 Dec│ 📝 Notes: Onboarded Nov 2025. 5 workers.    │
│               │    Great feedback on mobile app.             │
│ ⏸ XYZ Solar  │ ─────────────────────────────────────────    │
│   ☀ Solar App │ 📋 PAYMENT HISTORY                           │
│   ₹25k/year   │ • Nov 15, 2025 - ₹25,000 (Setup)            │
│   PENDING     │ • Upcoming: Dec 15, 2025 - ₹25,000          │
│               │ ─────────────────────────────────────────    │
│ Search...     │ [✏️ Edit Client] [💰 Log Payment] [📞 Call]  │
│               │                                              │
└───────────────┴──────────────────────────────────────────────┘
```

---

## Components to Build

### 1. **KeyMetrics.tsx** (Top Dashboard)
- **3 Stat Cards:**
  - Total ARR (Annual Recurring Revenue)
  - Active Clients count + Pending count
  - Revenue This Month + Payment count
- Uses existing `StatCard` component
- Calculates metrics from clients data

### 2. **UpcomingPayments.tsx** (Payment Timeline)
- Shows next 30 days of scheduled payments
- Sorted by date (earliest first)
- Format: `Date - Client Name (Company) - Amount - Product`
- Click to view client details
- "View All Payments" link (future feature)

### 3. **ClientsFilters.tsx** (Search & Filter Bar)
- Add Client button
- Search input (filters by name, company, email, phone)
- Product dropdown: All, Solar App, Factory App
- Status dropdown: All, Active, Pending, Inactive

### 4. **ClientsList.tsx** (Left Sidebar)
- Scrollable list of clients
- Each item shows:
  - Product icon (☀ Solar, 🏭 Factory)
  - Client name + company (truncated)
  - Contract value
  - Next payment date
  - Status indicator
- Click to select and show details
- Active state highlighting

### 5. **ClientDetails.tsx** (Right Pane)
- Full client information display
- Contact details (email, phone)
- Contract info (product, value, frequency, next payment)
- Status badge
- Notes section
- Payment history list
- Action buttons: Edit, Log Payment, Call (opens tel: link)

### 6. **ClientModal.tsx** (Add/Edit Form)
- Modal overlay for creating/editing clients
- Form fields:
  - Name (required)
  - Company
  - Email
  - Phone
  - Product/Service dropdown (Solar App, Factory App, Other)
  - Contract Value
  - Payment Frequency (monthly, quarterly, annual, one-time)
  - Next Payment Date
  - Status (active, pending, inactive)
  - Notes (textarea)
- Validation
- Save to Supabase

---

## Database Schema (Already Exists)

```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  company TEXT,
  email TEXT,
  phone TEXT,
  product_service TEXT,
  contract_value DECIMAL(15, 2),
  payment_frequency TEXT CHECK (payment_frequency IN ('monthly', 'quarterly', 'annual', 'one-time')) NOT NULL DEFAULT 'monthly',
  next_payment_date DATE,
  status TEXT CHECK (status IN ('active', 'inactive', 'pending')) NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## TypeScript Types (Already Exists)

```typescript
export type ClientStatus = "active" | "inactive" | "pending";
export type PaymentFrequency = "monthly" | "quarterly" | "annual" | "one-time";

export interface Client {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  product_service?: string;
  contract_value?: number;
  payment_frequency: PaymentFrequency;
  next_payment_date?: string;
  status: ClientStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}
```

---

## Responsive Breakpoints

### Desktop (>1024px)
- Full layout: Metrics (3 columns) + Payments + Filters + List/Details side-by-side
- List sidebar: 320px fixed width
- Details pane: Flexible remaining width

### Tablet (768-1024px)
- Metrics: 3 columns (responsive)
- Payments: Collapsed to "X payments due" with expand option
- List + Details: Side-by-side with narrower list (240px)

### Mobile (<768px)
- Metrics: Stack vertically (1 column)
- Payments: Show only next 2, "+ X more" button
- List: Full width, tap to open details in slide-over/modal
- Filters: Stack vertically

---

## Color Coding & Icons

### Product Icons
- ☀️ **Solar App** - `text-yellow-500`
- 🏭 **Factory App** - `text-gray-400`
- 📦 **Other** - `text-blue-500`

### Status Indicators
- ⭐ **Active** - `text-green-500`
- ⏸️ **Pending** - `text-yellow-500`
- ⏹️ **Inactive** - `text-gray-500`

### Payment Frequency Colors
- Monthly: `bg-blue-500/10 text-blue-400`
- Quarterly: `bg-purple-500/10 text-purple-400`
- Annual: `bg-green-500/10 text-green-400`
- One-time: `bg-amber-500/10 text-amber-400`

---

## Implementation Steps

1. ✅ Create plan document
2. ⬜ Create `components/clients/` directory
3. ⬜ Build `KeyMetrics.tsx`
4. ⬜ Build `UpcomingPayments.tsx`
5. ⬜ Build `ClientsFilters.tsx`
6. ⬜ Build `ClientsList.tsx`
7. ⬜ Build `ClientDetails.tsx`
8. ⬜ Build `ClientModal.tsx`
9. ⬜ Update `app/clients/page.tsx` with new layout
10. ⬜ Test all CRUD operations
11. ⬜ Test responsive layouts
12. ⬜ Add loading states
13. ⬜ Add empty states

---

## Future Enhancements (Not in MVP)

- Payment logging system (separate from client creation)
- Payment history tracking table
- Reminders/notifications for upcoming payments
- Revenue charts and analytics
- Export to CSV
- Client communication log
- Contract renewal automation
- Multi-currency support

---

## Design System Consistency

Following existing app patterns:
- Dark theme: `bg-background` (#0A0E27), `bg-card` (#151821)
- Accent colors: `text-accent-secondary` (blue) for client-related elements
- Typography: Bold headings, regular body text
- Spacing: Consistent padding (p-6 for cards, gap-4 for grids)
- Animations: Smooth transitions on hover/click
- Empty states: Use existing `EmptyState` component
- Loading states: Use existing `Loading` component
- Modals: Use existing `Modal` component
- Buttons: Use existing `Button` component

---

**End of Plan**
