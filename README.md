# InvoiceAZ - Professional Business Management Platform

InvoiceAZ is a comprehensive cloud-based SaaS platform designed to streamline financial operations, inventory management, and team activities for small to medium-sized businesses. Built with a modern tech stack, it provides a seamless and secure experience for business owners to digitize their operations.

## 🚀 Key Features

### 📊 Financial Dashboard
- **Real-time Overview:** Monitor revenue, expenses, net profit, and pending payments at a glance.
- **Performance Charts:** Interactive visualizations of cash flow trends and financial health.
- **Recent Activity:** Centralized log of 100+ latest transactions, invoices, and expense records.

### 📄 Intelligent Invoicing
- **Quick Creation:** Fast invoice generation with auto-filled product and client data.
- **Professional PDF:** Auto-generated, high-quality PDF documents with business branding and logos.
- **Public Tracking:** Shareable public links to invoices with "viewed/not viewed" tracking for transparency.
- **Lifecycle Management:** Track statuses from Draft and Sent to Paid and Overdue.

### 📦 Inventory & Product Management
- **QR/Barcode Scanning:** Instant product lookup and sales entry using mobile camera or scanner devices.
- **Stock Control:** Real-time stock quantity tracking with automated deduction on sales.
- **Critical Level Alerts:** Visual indicators and notifications when products fall below minimum stock levels.
- **Bulk Import/Export:** Seamlessly manage large inventory lists using Excel integration.

### 💰 Expense & Budget Tracking
- **Category Analysis:** Categorize spending (Rent, Salary, Marketing, etc.) for better cost control.
- **Smart Notifications:** Automated warnings when monthly spending approaches or exceeds predefined budget limits.
- **Proof of Purchase:** Digital archival of receipts and transaction documents.

### 📈 Advanced Analytics & AI
- **Smart Forecasting:** AI-driven revenue and cash flow projections for the next 3 months.
- **Tax Reporting:** Automatically generated summaries for quarterly and annual tax periods.
- **Problematic Invoice Analysis:** Identification of chronic late payers with automated reminder tools.

### 👥 Team & Role Management (RBAC)
- **Granular Permissions:** Predefined roles including Owner, Manager, Accountant, Inventory Manager, and Sales Representative.
- **Sales Rep Tracking:** Real-time GPS location tracking and monthly sales target management for field representatives.
- **Invitation System:** Secure email-based invitation flow to grow your professional organization.

## 🛠 Tech Stack

- **Frontend:** React 19, Vite, Tailwind CSS, Framer Motion, TanStack Query (React Query).
- **Backend:** Django 5.1, Django REST Framework (DRF), PostgreSQL.
- **Authentication:** JWT (JSON Web Tokens), Google OAuth integration, 2FA support.
- **State Management:** Zustand.
- **Deployment:** Vercel (Frontend), Render (Backend).

## 🧪 Testing & Quality Assurance

The project includes a robust testing suite focusing on business logic and security:
- **Functional Tests:** Comprehensive testing of the invitation system, role-based access controls, and core API operations.
- **Edge Case Testing:** Verification of plan limits, self-referencing safeguards, and data integrity boundaries.

Run tests using:
```bash
python manage.py test users.tests_sales_rep
python manage.py test users.tests_edge_cases
```

## 🏗 Installation

### Prerequisites
- Python 3.10+
- Node.js 18+

### Backend Setup
1. `cd backend`
2. `python -m venv venv`
3. `source venv/bin/activate` (or `venv\Scripts\activate` on Windows)
4. `pip install -r requirements.txt`
5. `python manage.py migrate`
6. `python manage.py runserver`

### Frontend Setup
1. `cd frontend`
2. `npm install`
3. `npm run dev`

---
*InvoiceAZ - Empowering businesses through digital excellence.*
