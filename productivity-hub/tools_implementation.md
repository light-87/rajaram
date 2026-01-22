# Tools Implementation Deep-Dive

This document provides an exhaustive technical and functional guide for the **Productivity Hub Tools**. It details the workflows for both Admins and Employees, button-level actions, and the full lifecycle of data.

---

## 1. Role-Based Access Control (RBAC)

The system distinguishes between **Admin** and **Employee** roles via the `role` column in the `profiles` table.

### Employee Permissions
- Access to **Kuberbook** and **Solar Vendor** brand dashboards.
- Create, View, Update status, and Assign leads.
- Convert leads to clients.
- View clients on the list and map.
- Edit client location and financial details.

### Admin-Only Permissions
- Everything an Employee can do.
- **Employee Management**: Create new employee accounts, change roles, and manage access.
- **Sales Agents**: Create and manage external sales agents and their default commission incentives.
- **Finance Dashboard**: View cross-brand profitability, project revenue, and business expenses.

---

## 2. The Tools Hub (Main Portal)

**Path:** `/tools`

### Stats Header
- **Total Leads**: Calculated dynamically where `status != 'converted'`. 
- **Active Clients**: Count of all rows in `business_clients`.
- **Est. Revenue**: Total sum of `setup_profit` + `recurring_profit` across all brands, divided to show in Lakhs (L).

### Brand Selectors
- **Kuberbook Card**: Navigates to the Kuberbook-specific dashboard.
- **Solar Vendor Card**: Navigates to the Solar-specific dashboard.
- *Visual Cue*: Hovering over these cards provides a subtle lift animation and glows with the brand's primary color (Sky for Kuberbook, Yellow for Solar).

---

## 3. Brand Dashboards (Kuberbook & Solar)

**Paths:** `/tools/kuberbook`, `/tools/solar`

### Tab 1: Leads Management
This is where the sales pipeline is managed.

#### Key Actions & Buttons:
| Button / Action | Visibility | Functional Detail |
|-----------------|------------|-------------------|
| **Add New Lead** | All | Opens a modal. Requires Name and Address. Automatically attempts to geocode the address unless manual Lat/Lng is provided. |
| **Status Dropdown** | All | Transitions lead through `New`, `Contacted`, `Qualified`, and `Lost`. **Note**: `Converted` is hidden here to prevent data loss. |
| **Assign To...** | All | Choose an employee to handle the lead. Updates the `assigned_to` field in the DB. |
| **Convert to Client**| All | **Only appears when status is 'Qualified'**. Triggers the financial setup modal. |

### Tab 2: Clients (List & Map Views)
Once converted, data moves here.

#### View Modes:
- **List View**: A high-level overview of revenue per client.
- **Map View**: A leaflet-based interactive map. Markers are color-coded (Blue = Kuberbook, Yellow = Solar).

#### Key Actions & Buttons:
| Button / Action | Visibility | Functional Detail |
|-----------------|------------|-------------------|
| **Edit (Pencil Icon)**| All | Opens the **Full Edit Modal**. Allows updating: Setup Profit, MRR, Agent Name, Agent Incentive, Physical Address, Manual Coordinates, and Google Maps Link. |
| **View on Maps** | All | Opens `google_maps_link` in a new browser tab for navigation. |
| **Marker Popup** | Map | Shows client name, brand, calculated profit (`setup + recurring`), and a "Navigation" link. |

---

## 4. Admin Management Modules

### Employee Management (`/tools/admin/employees`)
- **Add Employee**: Admins can register new staff.
- **Role Toggle**: Promote/Demote between 'employee' and 'admin'.

### Sales Agents (`/tools/agents`)
- **Agent Directory**: Manage external partners who bring in leads.
- **Default Incentives**: Set a default ₹ amount that pre-fills when converting a lead referred by that agent.

### Finance Hub (`/tools/finance`)
- **Total Portfolio Value**: Real-time sum of all active client contracts.
- **Expense Tracking**: Subtracts agent incentives and operational costs from total profits to show Net Margin.

---

## 5. Technical Workflow: The "Perfect Lead" Lifecycle

1. **Inception**: Employee adds a lead for "Solar Vendor". They paste a Google Maps link from their phone.
2. **Nurturing**: Employee updates status to `Contacted` then `Qualified` after a site visit.
3. **The Pivot**: Employee clicks **Convert to Client**. They enter:
   - Setup Profit: ₹50,000
   - MRR: ₹2,000
   - Agent: "Rahul" (referral).
4. **The Transfer**:
   - DB creates a client row.
   - DB marks lead as `converted`.
   - Dashboard Stats refresh: Total Leads -1, Active Clients +1.
5. **Execution**: The team now uses the **Map View** and the stored **Google Maps Link** to navigate to the site for installation.
6. **Maintenance**: If the client upgrades their plan, the Employee clicks **Edit** in the Clients list to update the `recurring_profit`.

---

## 6. Error Prevention & Data Integrity
- **Geocoding Fallback**: If an address cannot be found, coordinates default to `[0,0]` but the manual `google_maps_link` ensures the team doesn't get lost.
- **Enforced Conversion**: By locking the `converted` status behind a modal, the system ensures that NO client is created without financial data.
- **Real-Time UI**: Every major action (Status change, Assignment, Conversion) logs an entry in `activity_logs` for accountability.
