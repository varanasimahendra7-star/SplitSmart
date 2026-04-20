# 💸 SplitSmart

> Split expenses, not friendships.

A production-level expense splitting web app for trips, flatmates, and group events — built with React, Firebase, and Recharts.

---

## 🎯 Problem Statement

When friends travel together or share a flat, expenses get chaotic. People pay at different times, for different people, and tracking who owes whom across WhatsApp messages leads to confusion and awkwardness. SplitSmart gives groups a single place to log expenses, automatically calculate net balances, and track settlements — eliminating the mental load of shared finances.

---

## ✨ Features

- 🔐 **Google Authentication** — seamless one-click sign in
- 👥 **Group Management** — create trip, home, event, or general groups
- 💰 **Expense Tracking** — add, edit, and delete expenses with category tags
- 🧮 **Debt Simplification** — minimizes the total transactions needed to settle up using a greedy algorithm
- 📊 **Spending Analytics** — visual category breakdowns, member spending, and daily trend charts
- ✅ **Settlements** — mark debts as paid and track settlement history via an Audit Trail
- 🔄 **Real-Time Sync** — Firestore `onSnapshot` keeps the UI instantly updated across all devices
- 📱 **Fully Responsive** — optimized for both mobile and desktop experiences

---

## 🛠 Tech Stack

| Layer       | Technology                    |
|-------------|-------------------------------|
| **Frontend** | React 18, Vite                |
| **Routing** | React Router v6               |
| **State** | Context API, Custom Hooks     |
| **Backend** | Firebase (Auth + Firestore)   |
| **Charts** | Recharts                      |
| **Styling** | Tailwind CSS                  |
| **Toasts** | react-hot-toast               |
| **Icons** | lucide-react                  |

---

## ⚙️ Architecture & Technical Highlights

To ensure scalability and performance, this project heavily leverages modern React patterns:

* **State Optimization:** Complex math (like balance computation and chart data parsing) is wrapped in `useMemo` to prevent expensive recalculations during UI renders.
* **Custom Hooks:** Business logic and Firebase subscriptions are abstracted into reusable custom hooks (`useExpenses`, `useBalances`, `useSettlements`).
* **Real-Time Database:** Utilizes Firebase's `onSnapshot` for bi-directional, real-time data flow without manual refetching.
* **Code Splitting:** Implements `React.lazy` and `Suspense` for route-based chunking (Dashboard, GroupDetail, Login) to improve initial load times.
* **Separation of Concerns:** Strict folder architecture separating UI components, global context, and backend service layers.

---

## 🧮 Debt Simplification Algorithm

Located in `src/utils/debtSimplifier.js`.

**How it works:**
1. Computes each member's **net balance** (total paid − total owed).
2. Separates the group into **creditors** (positive balance) and **debtors** (negative balance).
3. Greedily matches the largest debtor with the largest creditor.
4. Records the transaction, reduces both balances, and repeats the cycle.

This minimizes the number of transactions required to settle all debts — for example, 5 people with 10 tangled debts might only need 4 simple transactions to get completely even.

---

## 📁 Folder Structure

```text
src/
├── components/
│   ├── analytics/    # AnalyticsDashboard (Recharts)
│   ├── expenses/     # ExpenseCard, ExpenseForm
│   ├── groups/       # AddMemberModal
│   ├── layout/       # AppLayout, ProtectedRoute
│   ├── settlements/  # BalanceSummary
│   └── ui/           # Modal, Loader, EmptyState, CategoryBadge
├── context/
│   ├── AuthContext.jsx
│   └── GroupContext.jsx
├── hooks/
│   ├── useExpenses.js
│   ├── useGroups.js
│   ├── useBalances.js
│   └── useSettlements.js
├── pages/
│   ├── Login.jsx
│   ├── Dashboard.jsx
│   ├── GroupDetail.jsx
│   └── Groups.jsx
├── services/
│   ├── firebase.js
│   └── expenseService.js
└── utils/
    └── debtSimplifier.js
````

-----

## 🚀 Setup Instructions

### 1\. Clone the repository

```bash
git clone [https://github.com/varanasimahendra7-star/SplitSmart.git](https://github.com/varanasimahendra7-star/SplitSmart.git)
cd splitsmart
```

### 2\. Install dependencies

```bash
npm install
```

### 3\. Set up Firebase

1.  Go to [Firebase Console](https://console.firebase.google.com)
2.  Create a new project and enable **Authentication** (Google Sign-in)
3.  Create a **Firestore Database**
4.  Register a **Web App** and copy the config object.

### 4\. Add Firebase config

Open `src/services/firebase.js` and replace the placeholder values:

```js
const firebaseConfig = {
  apiKey:            "YOUR_API_KEY",
  authDomain:        "YOUR_AUTH_DOMAIN",
  projectId:         "YOUR_PROJECT_ID",
  storageBucket:     "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId:             "YOUR_APP_ID",
}
```

### 5\. Firestore Security Rules

To secure the database, apply these rules in the Firebase Console → Firestore → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /groups/{groupId} {
      allow read, write: if request.auth != null
        && resource.data.members.map(m => m.uid).hasAny([request.auth.uid]);
      allow create: if request.auth != null;

      match /expenses/{expenseId} {
        allow read, write: if request.auth != null;
      }
      match /settlements/{settlementId} {
        allow read, write: if request.auth != null;
      }
    }
  }
}
```

### 6\. Run the app

```bash
npm run dev
```

The app will run locally at `http://localhost:5173`

-----

## 🌐 Deployment

This application is configured for seamless deployment on [Vercel](https://vercel.com).

```bash
npm run build
```

**Note on Routing:** A `vercel.json` file is included in the root directory to rewrite all traffic to `index.html`. This ensures that protected routes resolve correctly upon page refresh in the React Single Page Application (SPA).

-----

## 👨‍💻 Author

**Varanasi Mahendra**

  * [GitHub Profile](https://www.google.com/search?q=https://github.com/varanasimahendra7-star)

<!-- end list -->

```
```
