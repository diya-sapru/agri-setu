# 🌾 AgriSetu

### Sell Where. Sell When. Sell Better.

**An Agricultural Market Intelligence & Marketplace Platform**

🌐 **Live Website:** https://agri-setu-diya.netlify.app/

💻 **GitHub Repository:** https://github.com/diya-sapru/agri-setu

AgriSetu is a digital agricultural marketplace designed to help farmers and Farmer Producer Organizations (FPOs) make informed selling decisions through market information, crop valuation and digital crop-lot management.

---

## 🎯 Problem Statement

Farmers often face challenges due to limited access to:

- Reliable market price information
- Potential buyers and buyer demand
- Crop quality requirements
- Transport and storage options
- Market trends and selling opportunities

This information gap can lead to weak bargaining power and lower price realization.

## 💡 My Solution

AgriSetu aims to bridge this gap by bringing agricultural market intelligence and digital marketplace capabilities together.

The platform's vision is to help farmers understand:

- **WHERE** to sell their produce
- **WHEN** to sell their produce
- **TO WHOM** they should sell

## 🚀 Key Features

### Implemented Features

- 🔐 **User Authentication:** Separate farmer and buyer registration and login.
- 👨‍🌾 **Role-Based Access:** Farmer and buyer interfaces.
- 📊 **Crop Market Prices:** Display of crop prices using demonstration data.
- 🧮 **Smart Sell Calculator:** Estimates crop value based on quantity and price per quintal.
- 🌾 **Crop Lot Management:** Farmers can create, view, update and delete crop listings.
- 🔄 **Listing Status Management:** Update the status of crop lots.
- 🗄️ **Database Integration:** Persistent storage using Supabase.
- 🔒 **Protected APIs:** Authenticated backend routes and database access policies.

### Planned Enhancements

- 📈 Live mandi price API integration and price trends.
- 🤝 Intelligent buyer matching.
- 🌾 FPO crop-lot aggregation.
- ⭐ Buyer trust and reliability scoring.
- 🚚 Logistics and storage coordination.
- 💰 Digital offer management.
- 💳 Payment tracking.
- ⚖️ Dispute and grievance management.
- 🤖 AI-based crop price prediction and selling recommendations.

## 🧠 Smart Sell Engine

The current Smart Sell calculator estimates the expected crop value using:

**Estimated Value = (Quantity in kg ÷ 100) × Price per Quintal**

For example:

| Parameter | Value |
|---|---:|
| Crop | Tomato |
| Quantity | 1,000 kg |
| Price | ₹2,700/quintal |
| Estimated Value | ₹27,000 |

*Illustrative calculation only. The current calculator does not account for transportation charges, commissions or other deductions.*

The broader vision is to enhance this calculator with price trends, buyer demand, crop quality, logistics and storage information to recommend better selling opportunities.

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React.js, Vite, CSS |
| Backend | Node.js, Express.js |
| Database | Supabase PostgreSQL |
| Authentication | Supabase Auth |
| Security | JWT-based token validation, Row Level Security (RLS) |
| API Communication | REST APIs |
| Version Control | Git, GitHub |
| Frontend Deployment | Netlify |
| Backend Deployment | Render |

## 🏗️ System Architecture

AgriSetu follows a full-stack architecture:

1. **Frontend:** React provides the user interface and handles user interactions.
2. **Backend:** Express.js provides REST API endpoints and application logic.
3. **Authentication:** Supabase Auth manages user registration and login.
4. **Database:** PostgreSQL stores user profiles and crop-lot information.
5. **Security:** Authenticated API requests and Row Level Security help protect user-specific records.
6. **Deployment:** Netlify hosts the frontend, Render hosts the backend, and Supabase provides database and authentication services.

## 📁 Project Structure

```text
agri-setu/
│
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── package-lock.json
│   └── .env.example
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── api.js
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── database/
├── docs/
├── ml-engine/
├── screenshots/
└── README.md
```

## ⚙️ Getting Started Locally

### Prerequisites

- Node.js
- npm
- Git
- A Supabase account and project

### 1. Clone the repository

```bash
git clone https://github.com/diya-sapru/agri-setu.git
cd agri-setu
```

### 2. Set up the backend

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` directory using `.env.example`.

Add your own Supabase project configuration:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_publishable_key
PORT=5000
```

Start the backend:

```bash
npm run dev
```

### 3. Set up the frontend

Open a second terminal:

```bash
cd frontend
npm install
```

Configure the frontend API base URL to point to your local backend (`http://localhost:5000/api`) in `src/api.js`, if it is not already configured.

Start the frontend:

```bash
npm run dev
```

Open the local URL displayed by Vite in your terminal.

## 🔐 Security Considerations

- Sensitive configuration is stored in environment variables.
- Actual `.env` files are excluded from Git.
- Authenticated backend routes validate access tokens.
- Row Level Security helps enforce user-specific database access.
- Never commit private keys, passwords or service-role credentials.

## 🔮 Future Vision

AgriSetu aims to evolve into a comprehensive agricultural marketplace that empowers farmers with transparent market information, better buyer access and data-driven selling decisions.

## 👩‍💻 Developer

**Diya Sapru**

- GitHub: https://github.com/diya-sapru
- Project Repository: https://github.com/diya-sapru/agri-setu

---

### 🌱 AgriSetu
*Empowering farmers through market intelligence and smarter selling decisions.*
