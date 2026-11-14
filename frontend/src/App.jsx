import { useEffect, useMemo, useState } from "react";
import "./App.css";

import {
  getCrops,
  estimateCropValue,
  signupUser,
  loginUser,
  getCurrentUser,
  createCropLot,
  getMyCropLots,
  updateCropLot,
  deleteCropLot,
} from "./api";

const demoCrops = [
  { name: "Wheat", hindi: "Gehu", price: 2450, change: 4.2, icon: "🌾", market: "Nashik" },
  { name: "Onion", hindi: "Pyaz", price: 1850, change: -2.1, icon: "🧅", market: "Lasalgaon" },
  { name: "Tomato", hindi: "Tamatar", price: 3200, change: 8.6, icon: "🍅", market: "Pune" },
  { name: "Soybean", hindi: "Soyabean", price: 4680, change: 3.4, icon: "🌱", market: "Latur" },
];

const navItems = [
  { label: "Overview", icon: "⌂" },
  { label: "Market Prices", icon: "↗" },
  { label: "Smart Sell", icon: "₹" },
  { label: "My Crop Lots", icon: "▤" },
  { label: "Buyers", icon: "♧" },
];

const SESSION_KEY = "agrisetu_session";

function readSavedSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

function saveSession(session, user) {
  localStorage.setItem(
    SESSION_KEY,
    JSON.stringify({
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
      user,
    })
  );
}

function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

function getProfileName(user, profile) {
  return (
    profile?.full_name ||
    profile?.fullName ||
    user?.user_metadata?.full_name ||
    user?.email ||
    "AgriSetu User"
  );
}

function getRole(user, profile) {
  return (
    profile?.role ||
    user?.user_metadata?.role ||
    "farmer"
  ).toLowerCase();
}



function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("farmer");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setMessage("");

    if (mode === "signup" && !fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (mode === "signup" && password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "signup") {
        const result = await signupUser({
          fullName: fullName.trim(),
          email: email.trim(),
          password,
          phone: phone.trim(),
          role,
        });

        const session = result.session || result.data?.session;
        const user = result.user || result.data?.user;

        if (session?.access_token && user) {
          saveSession(session, user);

          onAuthenticated({
            accessToken: session.access_token,
            user,
            profile: result.profile || null,
          });
        } else {
          setMessage(
            result.message ||
              "Registration submitted. Check your email if email verification is enabled, then log in."
          );
          setMode("login");
        }
      } else {
        const result = await loginUser(email.trim(), password);

        const session = result.session || result.data?.session;
        const user = result.user || result.data?.user;

        if (!session?.access_token || !user) {
          throw new Error(
            "Login succeeded but no session was returned. Please check your backend response."
          );
        }

        saveSession(session, user);

        onAuthenticated({
          accessToken: session.access_token,
          user,
          profile: result.profile || null,
        });
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const fieldStyle = {
    width: "100%",
    padding: "12px 14px",
    border: "1px solid #dce5dc",
    borderRadius: "9px",
    fontSize: "14px",
    marginTop: "7px",
    boxSizing: "border-box",
    outlineColor: "#397b4d",
  };

  const labelStyle = {
    display: "block",
    fontSize: "13px",
    fontWeight: 600,
    color: "#314638",
    marginBottom: "15px",
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div style={{ textAlign: "center", marginBottom: "25px" }}>
          <div
            style={{
              width: "54px",
              height: "54px",
              margin: "0 auto 12px",
              borderRadius: "15px",
              background: "#e8f3e8",
              color: "#287044",
              display: "grid",
              placeItems: "center",
              fontSize: "28px",
              fontWeight: 800,
            }}
          >
            A
          </div>

          <h1 style={{ color: "#244b32", margin: "0 0 6px" }}>
            AgriSetu
          </h1>

          <p style={{ color: "#778477", fontSize: "13px", margin: 0 }}>
            Sell Where. Sell When. Sell Better.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", marginBottom: "24px" }}>
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setError("");
              setMessage("");
            }}
            style={{
              flex: 1,
              padding: "11px",
              borderRadius: "9px",
              border: "1px solid #dce5dc",
              background: mode === "login" ? "#28633d" : "#fff",
              color: mode === "login" ? "#fff" : "#405342",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Login
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setError("");
              setMessage("");
            }}
            style={{
              flex: 1,
              padding: "11px",
              borderRadius: "9px",
              border: "1px solid #dce5dc",
              background: mode === "signup" ? "#28633d" : "#fff",
              color: mode === "signup" ? "#fff" : "#405342",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Register
          </button>
        </div>

        <h2 style={{ color: "#253d2c", marginBottom: "7px" }}>
          {mode === "login" ? "Welcome back" : "Create your account"}
        </h2>

        <p style={{ color: "#778477", fontSize: "13px", marginTop: 0 }}>
          {mode === "login"
            ? "Log in to continue to your AgriSetu workspace."
            : "Join AgriSetu as a farmer or buyer."}
        </p>

        <form onSubmit={handleSubmit}>
          {mode === "signup" && (
            <>
              <label style={labelStyle}>
                Full name
                <input
                  style={fieldStyle}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  required
                />
              </label>

              <label style={labelStyle}>
                Phone number
                <input
                  style={fieldStyle}
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter your phone number"
                />
              </label>

              <label style={labelStyle}>
                Register as
                <select
                  style={fieldStyle}
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="farmer">Farmer</option>
                  <option value="buyer">Buyer</option>
                </select>
              </label>
            </>
          )}

          <label style={labelStyle}>
            Email address
            <input
              style={fieldStyle}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </label>

          <label style={labelStyle}>
            Password
            <input
              style={fieldStyle}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </label>

          {error && (
            <p
              style={{
                color: "#b42318",
                background: "#fff0ef",
                padding: "10px",
                borderRadius: "8px",
                fontSize: "13px",
              }}
            >
              {error}
            </p>
          )}

          {message && (
            <p
              style={{
                color: "#28633d",
                background: "#edf7ed",
                padding: "10px",
                borderRadius: "8px",
                fontSize: "13px",
              }}
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              marginTop: "8px",
              background: loading ? "#78927e" : "#28633d",
              color: "#fff",
              border: "none",
              borderRadius: "9px",
              fontWeight: 700,
              cursor: loading ? "wait" : "pointer",
            }}
          >
            {loading
              ? "Please wait..."
              : mode === "login"
                ? "Login to AgriSetu →"
                : "Create account →"}
          </button>
        </form>

        <p
          style={{
            color: "#879187",
            textAlign: "center",
            fontSize: "11px",
            marginTop: "22px",
          }}
        >
          Your account is managed through secure authentication.
        </p>
      </div>
    </div>
  );
}


function App() {
  const [activePage, setActivePage] = useState("Overview");

  // Authentication
  const [auth, setAuth] = useState(readSavedSession);
  const [authChecking, setAuthChecking] = useState(true);
  const [profile, setProfile] = useState(
    () => readSavedSession()?.profile || null
  );

  const accessToken = auth?.accessToken;
  const user = auth?.user;
  const role = getRole(user, profile);
  const displayName = getProfileName(user, profile);

  // Market data
  const [crops, setCrops] = useState(demoCrops);
  const [marketLoading, setMarketLoading] = useState(true);
  const [marketError, setMarketError] = useState("");

  // Smart Sell
  const [crop, setCrop] = useState("Tomato");
  const [quantity, setQuantity] = useState("1000");
  const [quality, setQuality] = useState("Grade A");
  const [location, setLocation] = useState("Pune");
  const [harvestDate, setHarvestDate] = useState("");

  const [showResult, setShowResult] = useState(false);
  const [sellLoading, setSellLoading] = useState(false);
  const [sellError, setSellError] = useState("");
  const [sellResult, setSellResult] = useState(null);

  // Market search
  const [search, setSearch] = useState("");

  // Crop lot management
  const [cropLots, setCropLots] = useState([]);
  const [lotsLoading, setLotsLoading] = useState(false);
  const [lotsError, setLotsError] = useState("");
  const [lotMessage, setLotMessage] = useState("");
  const [lotSaving, setLotSaving] = useState(false);

  const [lotForm, setLotForm] = useState({
    cropName: "Wheat",
    quantityKg: "",
    qualityGrade: "A",
    location: "",
    harvestDate: "",
    expectedPricePerQuintal: "",
  });

  // Validate saved login session
  useEffect(() => {
    let cancelled = false;

    async function validateSession() {
      if (!auth?.accessToken) {
        setAuthChecking(false);
        return;
      }

      try {
        const result = await getCurrentUser(auth.accessToken);

        if (cancelled) return;

        const currentUser = result.user || auth.user;
        const currentProfile = result.profile || result;

        setAuth({
          ...auth,
          user: currentUser,
          profile: currentProfile,
        });

        setProfile(currentProfile);

        localStorage.setItem(
          SESSION_KEY,
          JSON.stringify({
            ...auth,
            user: currentUser,
            profile: currentProfile,
          })
        );
      } catch (error) {
        if (!cancelled) {
          clearSession();
          setAuth(null);
          setProfile(null);
        }
      } finally {
        if (!cancelled) setAuthChecking(false);
      }
    }

    validateSession();

    return () => {
      cancelled = true;
    };
  }, []);

  // Load market prices
  useEffect(() => {
    let cancelled = false;

    async function loadCrops() {
      try {
        const apiCrops = await getCrops();

        if (cancelled) return;

        const mergedCrops = apiCrops.map((item) => {
          const demo = demoCrops.find(
            (c) => c.name.toLowerCase() === item.name.toLowerCase()
          );

          return {
            ...demo,
            ...item,
            icon: demo?.icon || "🌱",
          };
        });

        setCrops(mergedCrops);
        setMarketError("");
      } catch (error) {
        if (!cancelled) {
          setMarketError(
            "Could not connect to the API. Showing demonstration data."
          );
        }
      } finally {
        if (!cancelled) setMarketLoading(false);
      }
    }

    loadCrops();

    return () => {
      cancelled = true;
    };
  }, []);

  // Load crop lots belonging to the logged-in farmer
 async function loadCropLots() {
  if (!accessToken) return;

  setLotsLoading(true);
  setLotsError("");
  setLotMessage("");

  try {
    const records = await getMyCropLots(accessToken);

    setCropLots(Array.isArray(records) ? records : []);
  } catch (error) {
    setLotsError(error.message || "Unable to load your crop lots.");
  } finally {
    setLotsLoading(false);
  }
}

  useEffect(() => {
    if (accessToken && role === "farmer") {
      loadCropLots();
    }
  }, [accessToken, role]);

  const selectedCrop =
    crops.find((item) => item.name === crop) || crops[0];

  const filteredCrops = useMemo(
    () =>
      crops.filter((item) =>
        `${item.name} ${item.hindi || ""} ${item.market || ""}`
          .toLowerCase()
          .includes(search.toLowerCase())
      ),
    [search, crops]
  );

  const netEstimate = selectedCrop
    ? (Math.max(0, Number(quantity) || 0) / 100) *
      selectedCrop.price
    : 0;

  const formattedMoney = (value) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(value) || 0);

  function navigate(page) {
    setActivePage(page);
    setShowResult(false);
    setSellError("");
    setSellResult(null);
    setLotMessage("");
  }

  function handleAuthenticated(sessionData) {
    setAuth(sessionData);
    setProfile(sessionData.profile || null);
    setActivePage("Overview");
    setAuthChecking(false);
  }

  function handleLogout() {
    clearSession();
    setAuth(null);
    setProfile(null);
    setCropLots([]);
    setActivePage("Overview");
  }

  async function handleSellSubmit(event) {
    event.preventDefault();

    if (
      !quantity ||
      !Number.isFinite(Number(quantity)) ||
      Number(quantity) <= 0
    ) {
      setSellError("Please enter a quantity greater than zero.");
      return;
    }

    if (!crop) {
      setSellError("Please select a crop.");
      return;
    }

    setSellLoading(true);
    setSellError("");
    setSellResult(null);
    setShowResult(false);

    try {
      const result = await estimateCropValue(crop, Number(quantity));
      setSellResult(result);
      setShowResult(true);
    } catch (error) {
      setSellError(error.message || "Could not calculate the estimate.");
    } finally {
      setSellLoading(false);
    }
  }

  function updateLotForm(field, value) {
    setLotForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function handleCreateLot(event) {
    event.preventDefault();

    if (!accessToken) {
      setLotsError("Please log in again.");
      return;
    }

    if (
      !lotForm.quantityKg ||
      Number(lotForm.quantityKg) <= 0
    ) {
      setLotsError("Enter a quantity greater than zero.");
      return;
    }

    if (!lotForm.location.trim()) {
      setLotsError("Please enter the crop location.");
      return;
    }

    setLotSaving(true);
    setLotsError("");
    setLotMessage("");

    try {
      await createCropLot(accessToken, {
        cropName: lotForm.cropName,
        quantityKg: Number(lotForm.quantityKg),
        qualityGrade: lotForm.qualityGrade,
        location: lotForm.location.trim(),
        harvestDate: lotForm.harvestDate || null,
        expectedPricePerQuintal:
          lotForm.expectedPricePerQuintal === ""
            ? null
            : Number(lotForm.expectedPricePerQuintal),
      });

      setLotMessage("Your crop lot has been created successfully.");

      setLotForm({
        cropName: "Wheat",
        quantityKg: "",
        qualityGrade: "A",
        location: "",
        harvestDate: "",
        expectedPricePerQuintal: "",
      });

      await loadCropLots();
    } catch (error) {
      setLotsError(error.message || "Unable to create crop lot.");
    } finally {
      setLotSaving(false);
    }
  }

  async function handleLotStatusChange(lotId, status) {
    setLotsError("");
    setLotMessage("");

    try {
      await updateCropLot(accessToken, lotId, { status });
      setLotMessage("Crop lot status updated.");
      await loadCropLots();
    } catch (error) {
      setLotsError(error.message || "Unable to update crop lot.");
    }
  }

  async function handleDeleteLot(lotId) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this crop lot?"
    );

    if (!confirmed) return;

    setLotsError("");
    setLotMessage("");

    try {
      await deleteCropLot(accessToken, lotId);
      setLotMessage("Crop lot deleted successfully.");
      await loadCropLots();
    } catch (error) {
      setLotsError(error.message || "Unable to delete crop lot.");
    }
  }

  if (authChecking) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          color: "#28633d",
          fontWeight: 600,
        }}
      >
        Loading AgriSetu...
      </div>
    );
  }

  if (!auth?.accessToken) {
    return <AuthScreen onAuthenticated={handleAuthenticated} />;
  }

  const getLotValue = (lot, snakeCase, camelCase) =>
    lot?.[snakeCase] ?? lot?.[camelCase] ?? "";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button
          className="brand"
          onClick={() => navigate("Overview")}
        >
          <span className="brand-mark">A</span>
          <span className="brand-copy">
            <strong>AgriSetu</strong>
            <small>FARMER FIRST</small>
          </span>
        </button>

        <div className="workspace-label">WORKSPACE</div>

        <nav className="navigation">
          {navItems
            .filter(
              (item) =>
                !(item.label === "My Crop Lots" && role !== "farmer")
            )
            .map((item) => (
              <button
                key={item.label}
                onClick={() => navigate(item.label)}
                className={`nav-item ${
                  activePage === item.label ? "active" : ""
                }`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>

                {item.label === "Smart Sell" && (
                  <span className="new-tag">NEW</span>
                )}
              </button>
            ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="help-card">
            <span className="help-icon">✳</span>
            <strong>Need a hand?</strong>
            <p>
              We're here to help you make better selling decisions.
            </p>
            <button
              onClick={() =>
                alert("Support contact details will be added soon.")
              }
            >
              Get support ↗
            </button>
          </div>

          <div className="profile">
            <div className="avatar">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div>
              <strong>{displayName}</strong>
              <small>{role === "buyer" ? "Buyer account" : "Farmer account"}</small>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              title="Logout"
              style={{
                marginLeft: "auto",
                border: "none",
                background: "transparent",
                color: "inherit",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span> <strong>{activePage}</strong>
          </div>

          <div className="topbar-right">
            <span className="market-status">
              <span />
              {marketLoading
                ? "Connecting to API..."
                : marketError
                  ? "API unavailable · Demo data"
                  : "API connected · Demo prices"}
            </span>

            <div className="top-avatar">
              {displayName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {/* OVERVIEW */}
        {activePage === "Overview" && (
          <div className="page-container">
            <section className="welcome-row">
              <div>
                <div className="eyebrow">
                  <span /> YOUR AGRICULTURAL COMPANION
                </div>

                <h1>
                  Grow smarter. <span>Sell better.</span>
                </h1>

                <p className="page-subtitle">
                  Welcome, {displayName}. Make informed decisions for your
                  crops with market insights and smarter selling tools.
                </p>
              </div>

              {role === "farmer" && (
                <button
                  className="primary-button"
                  onClick={() => navigate("My Crop Lots")}
                >
                  + List your crop <span>↗</span>
                </button>
              )}
            </section>

            <section className="hero-banner">
              <div className="hero-content">
                <span className="hero-pill">
                  ✦ SMART AGRICULTURE
                </span>

                <h2>
                  Your harvest deserves
                  <br />
                  the <em>right market.</em>
                </h2>

                <p>
                  Compare indicative prices, explore potential buyers,
                  and discover which selling option could work best
                  for you.
                </p>

                <button
                  onClick={() => navigate("Smart Sell")}
                  className="hero-button"
                >
                  Explore Smart Sell <span>→</span>
                </button>
              </div>

              <div className="hero-art" aria-hidden="true">
                <div className="sun" />
                <div className="field field-back" />
                <div className="field field-mid" />
                <div className="field field-front" />
                <div className="plant plant-one">♣</div>
                <div className="plant plant-two">♣</div>
                <div className="plant plant-three">♣</div>

                <div className="floating-price">
                  <span>MARKET INSIGHT</span>
                  <strong>+8.6%</strong>
                  <small>Illustrative price movement</small>
                </div>
              </div>
            </section>

            <section className="section-heading">
              <div>
                <h2>Market at a glance</h2>
                <p>A quick look at selected crop prices.</p>
              </div>

              <button
                className="text-button"
                onClick={() => navigate("Market Prices")}
              >
                View all markets <span>→</span>
              </button>
            </section>

            <section className="stats-grid">
              <article className="stat-card">
                <div className="stat-top">
                  <span>Selected crops</span>
                  <span className="stat-icon green">⌁</span>
                </div>
                <strong>{String(crops.length).padStart(2, "0")}</strong>
                <p>Sample market listings</p>
              </article>

              <article className="stat-card">
                <div className="stat-top">
                  <span>Markets covered</span>
                  <span className="stat-icon yellow">⌖</span>
                </div>
                <strong>
                  {new Set(crops.map((item) => item.market)).size
                    .toString()
                    .padStart(2, "0")}
                </strong>
                <p>Across selected Maharashtra markets</p>
              </article>

              <article className="stat-card">
                <div className="stat-top">
                  <span>Smart Sell estimate</span>
                  <span className="stat-icon purple">₹</span>
                </div>
                <strong>{formattedMoney(netEstimate)}</strong>
                <p>
                  Example value for {quantity || 0} kg of {crop}
                </p>
              </article>
            </section>

            <section className="section-heading crop-heading">
              <div>
                <h2>Today's crop watch</h2>
                <p>Indicative prices for exploring the dashboard.</p>
              </div>

              <span className="data-note">
                ⓘ Sample data · Not live prices
              </span>
            </section>

            <section className="crop-grid">
              {crops.map((item) => (
                <article className="crop-card" key={item.name}>
                  <div className="crop-card-top">
                    <span className="crop-emoji">{item.icon}</span>

                    <span
                      className={`change-pill ${
                        item.change >= 0 ? "up" : "down"
                      }`}
                    >
                      {item.change > 0 ? "↗" : "↘"}{" "}
                      {Math.abs(item.change)}%
                    </span>
                  </div>

                  <h3>{item.name}</h3>

                  <p className="crop-hindi">
                    {item.hindi} · {item.market}
                  </p>

                  <div className="crop-price">
                    {formattedMoney(item.price)} <small>/ quintal</small>
                  </div>

                  <div className="mini-chart" aria-hidden="true">
                    {[25, 42, 34, 55, 45, 68, 52, 77, 63, 85, 71, 94].map(
                      (height, index) => (
                        <span
                          key={index}
                          style={{ height: `${height}%` }}
                          className={item.change < 0 ? "bar-negative" : ""}
                        />
                      )
                    )}
                  </div>

                  <button
                    className="crop-link"
                    onClick={() => {
                      setCrop(item.name);
                      navigate("Smart Sell");
                    }}
                  >
                    Compare selling options <span>→</span>
                  </button>
                </article>
              ))}
            </section>

            <footer className="page-footer">
              <span>
                © 2026 AgriSetu · Built for better agricultural decisions.
              </span>
              <span>Indicative demonstration data only</span>
            </footer>
          </div>
        )}

        {/* MARKET PRICES */}
        {activePage === "Market Prices" && (
          <div className="page-container">
            <section className="page-title-block">
              <div className="eyebrow">
                <span /> MARKET INTELLIGENCE
              </div>

              <h1>
                Know your <span>market.</span>
              </h1>

              <p className="page-subtitle">
                Explore indicative prices and compare crops across selected
                markets.
              </p>
            </section>

            <div className="search-box">
              <span>⌕</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search crops or markets..."
              />
            </div>

            <div className="table-wrap">
              <table className="market-table">
                <thead>
                  <tr>
                    <th>Crop</th>
                    <th>Market</th>
                    <th>Indicative price / quintal</th>
                    <th>Movement</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredCrops.map((item) => (
                    <tr key={item.name}>
                      <td>
                        <span className="table-crop-icon">{item.icon}</span>
                        <strong>{item.name}</strong>
                        <small>{item.hindi}</small>
                      </td>

                      <td>{item.market}, Maharashtra</td>

                      <td className="table-price">
                        {formattedMoney(item.price)}
                      </td>

                      <td>
                        <span
                          className={`change-pill ${
                            item.change >= 0 ? "up" : "down"
                          }`}
                        >
                          {item.change > 0 ? "+" : ""}
                          {item.change}%
                        </span>
                      </td>

                      <td>
                        <button
                          className="table-action"
                          onClick={() => {
                            setCrop(item.name);
                            navigate("Smart Sell");
                          }}
                        >
                          Compare →
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filteredCrops.length === 0 && (
                    <tr>
                      <td colSpan="5" className="empty-state">
                        No matching crops found. Try another search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <p className="data-disclaimer">
              These are illustrative values for the prototype. They are not
              verified live mandi prices.
            </p>
          </div>
        )}

        {/* SMART SELL */}
        {activePage === "Smart Sell" && (
          <div className="page-container">
            <section className="page-title-block">
              <div className="eyebrow">
                <span /> SMART SELL ENGINE
              </div>

              <h1>
                Make every harvest <span>count.</span>
              </h1>

              <p className="page-subtitle">
                Enter your crop details to estimate its gross value using
                demonstration prices.
              </p>
            </section>

            <div className="sell-layout">
              <form className="sell-form" onSubmit={handleSellSubmit}>
                <div className="form-heading">
                  <span className="form-heading-icon">▤</span>
                  <div>
                    <h2>Your crop lot</h2>
                    <p>Tell us what you're planning to sell.</p>
                  </div>
                </div>

                <label>
                  Crop type
                  <select
                    value={crop}
                    onChange={(event) => {
                      setCrop(event.target.value);
                      setShowResult(false);
                      setSellResult(null);
                      setSellError("");
                    }}
                  >
                    {crops.map((item) => (
                      <option key={item.name} value={item.name}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>

                <div className="form-row">
                  <label>
                    Quantity (kg)
                    <input
                      type="number"
                      min="1"
                      required
                      value={quantity}
                      onChange={(event) => {
                        setQuantity(event.target.value);
                        setShowResult(false);
                        setSellResult(null);
                        setSellError("");
                      }}
                    />
                  </label>

                  <label>
                    Crop quality
                    <select
                      value={quality}
                      onChange={(event) => {
                        setQuality(event.target.value);
                        setShowResult(false);
                        setSellResult(null);
                      }}
                    >
                      <option>Grade A</option>
                      <option>Grade B</option>
                      <option>Grade C</option>
                    </select>
                  </label>
                </div>

                <label>
                  Preferred market / location
                  <select
                    value={location}
                    onChange={(event) => {
                      setLocation(event.target.value);
                      setShowResult(false);
                      setSellResult(null);
                    }}
                  >
                    {["Pune", "Nashik", "Lasalgaon", "Latur"].map(
                      (place) => (
                        <option key={place}>{place}</option>
                      )
                    )}
                  </select>
                </label>

                <label>
                  Expected harvest date{" "}
                  <span className="optional-label">Optional</span>
                  <input
                    type="date"
                    value={harvestDate}
                    onChange={(event) => setHarvestDate(event.target.value)}
                  />
                </label>

                <button
                  className="primary-button submit-button"
                  type="submit"
                  disabled={sellLoading}
                >
                  {sellLoading ? "Calculating..." : "Estimate crop value →"}
                </button>

                {sellError && (
                  <p className="data-disclaimer">{sellError}</p>
                )}

                <p className="form-footnote">
                  ⓘ This is a gross estimate, not a guaranteed offer or final
                  net return.
                </p>
              </form>

              <aside className="estimate-panel">
                <div className="estimate-icon">₹</div>

                <span className="estimate-label">
                  ESTIMATED GROSS VALUE
                </span>

                <h2>
                  {showResult && sellResult
                    ? formattedMoney(sellResult.estimatedGrossValue)
                    : formattedMoney(netEstimate)}
                </h2>

                <p>
                  Based on {selectedCrop?.name || crop} at{" "}
                  {formattedMoney(selectedCrop?.price || 0)} per quintal.
                </p>

                <div className="estimate-divider" />

                <div className="estimate-line">
                  <span>Crop</span>
                  <strong>{selectedCrop?.name || crop}</strong>
                </div>

                <div className="estimate-line">
                  <span>Quantity</span>
                  <strong>
                    {Number(quantity || 0).toLocaleString("en-IN")} kg
                  </strong>
                </div>

                <div className="estimate-line">
                  <span>Quality</span>
                  <strong>{quality}</strong>
                </div>

                <div className="estimate-line">
                  <span>Preferred market</span>
                  <strong>{location}</strong>
                </div>

                {showResult && sellResult && (
                  <div className="result-message">
                    <strong>Estimate prepared ✓</strong>
                    <p>
                      Your estimated gross value is{" "}
                      {formattedMoney(sellResult.estimatedGrossValue)}.
                      Transport, fees, quality adjustments and other costs
                      are not included.
                    </p>
                  </div>
                )}

                <div className="estimate-note">
                  <span>✦</span>
                  <p>
                    Next step: connect verified market feeds and transport
                    costs to compare actual net returns.
                  </p>
                </div>
              </aside>
            </div>
          </div>
        )}

        {/* MY CROP LOTS */}
        {activePage === "My Crop Lots" && (
          <div className="page-container">
            <section className="page-title-block">
              <div className="eyebrow">
                <span /> CROP MANAGEMENT
              </div>

              <h1>
                My <span>crop lots.</span>
              </h1>

              <p className="page-subtitle">
                Create and manage your crop listings. Your records are stored
                in your account.
              </p>
            </section>

            <section
              className="sell-form"
              style={{ maxWidth: "none", marginBottom: "28px" }}
            >
              <div className="form-heading">
                <span className="form-heading-icon">＋</span>
                <div>
                  <h2>Create a crop lot</h2>
                  <p>Add details about the produce you want to list.</p>
                </div>
              </div>

              <form onSubmit={handleCreateLot}>
                <div className="form-row">
                  <label>
                    Crop name
                    <select
                      value={lotForm.cropName}
                      onChange={(e) =>
                        updateLotForm("cropName", e.target.value)
                      }
                    >
                      {crops.map((item) => (
                        <option key={item.name} value={item.name}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Quantity (kg)
                    <input
                      type="number"
                      min="1"
                      required
                      value={lotForm.quantityKg}
                      onChange={(e) =>
                        updateLotForm("quantityKg", e.target.value)
                      }
                      placeholder="e.g. 500"
                    />
                  </label>
                </div>

                <div className="form-row">
                  <label>
                    Quality grade
                    <select
                      value={lotForm.qualityGrade}
                      onChange={(e) =>
                        updateLotForm("qualityGrade", e.target.value)
                      }
                    >
                      <option value="A">Grade A</option>
                      <option value="B">Grade B</option>
                      <option value="C">Grade C</option>
                      <option value="Not Graded">Not Graded</option>
                    </select>
                  </label>

                  <label>
                    Location
                    <input
                      required
                      value={lotForm.location}
                      onChange={(e) =>
                        updateLotForm("location", e.target.value)
                      }
                      placeholder="Village, district or market"
                    />
                  </label>
                </div>

                <div className="form-row">
                  <label>
                    Harvest date
                    <input
                      type="date"
                      value={lotForm.harvestDate}
                      onChange={(e) =>
                        updateLotForm("harvestDate", e.target.value)
                      }
                    />
                  </label>

                  <label>
                    Expected price per quintal (₹)
                    <input
                      type="number"
                      min="0"
                      value={lotForm.expectedPricePerQuintal}
                      onChange={(e) =>
                        updateLotForm(
                          "expectedPricePerQuintal",
                          e.target.value
                        )
                      }
                      placeholder="Optional"
                    />
                  </label>
                </div>

                <button
                  className="primary-button submit-button"
                  type="submit"
                  disabled={lotSaving}
                >
                  {lotSaving ? "Saving..." : "Create crop lot →"}
                </button>
              </form>
            </section>

            {lotsError && (
              <p className="data-disclaimer" style={{ color: "#b42318" }}>
                {lotsError}
              </p>
            )}

            {lotMessage && (
              <p className="data-disclaimer" style={{ color: "#287044" }}>
                {lotMessage}
              </p>
            )}

            <section className="section-heading">
              <div>
                <h2>Your listings</h2>
                <p>Crop lots saved to your account.</p>
              </div>

              <button
                className="text-button"
                onClick={loadCropLots}
                disabled={lotsLoading}
              >
                {lotsLoading ? "Refreshing..." : "Refresh ↻"}
              </button>
            </section>

            {lotsLoading ? (
              <p>Loading your crop lots...</p>
            ) : cropLots.length === 0 ? (
              <div className="empty-panel">
                <span className="empty-illustration">🌾</span>
                <h2>No crop lots yet</h2>
                <p>
                  Your crop listings will appear here after you create your
                  first crop lot.
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                  gap: "18px",
                }}
              >
                {cropLots.map((lot) => {
                  const lotId = lot.id;
                  const lotName = getLotValue(lot, "crop_name", "cropName");
                  const lotQuantity = getLotValue(
                    lot,
                    "quantity_kg",
                    "quantityKg"
                  );
                  const lotGrade = getLotValue(
                    lot,
                    "quality_grade",
                    "qualityGrade"
                  );
                  const lotLocation = lot.location || "Not specified";
                  const lotStatus = lot.status || "Available";
                  const lotPrice = getLotValue(
                    lot,
                    "expected_price_per_quintal",
                    "expectedPricePerQuintal"
                  );

                  return (
                    <article
                      key={lotId}
                      className="crop-card"
                      style={{ minWidth: 0 }}
                    >
                      <div className="crop-card-top">
                        <span className="crop-emoji">🌾</span>
                        <span className="change-pill up">
                          {lotStatus}
                        </span>
                      </div>

                      <h3>{lotName}</h3>

                      <p className="crop-hindi">{lotLocation}</p>

                      <div className="estimate-line">
                        <span>Quantity</span>
                        <strong>{Number(lotQuantity).toLocaleString("en-IN")} kg</strong>
                      </div>

                      <div className="estimate-line">
                        <span>Quality</span>
                        <strong>{lotGrade || "Not Graded"}</strong>
                      </div>

                      <div className="estimate-line">
                        <span>Expected price</span>
                        <strong>
                          {lotPrice !== "" && lotPrice !== null
                            ? `${formattedMoney(lotPrice)} / quintal`
                            : "Not provided"}
                        </strong>
                      </div>

                      <div style={{ marginTop: "16px" }}>
                        <label
                          style={{
                            display: "block",
                            fontSize: "12px",
                            marginBottom: "6px",
                          }}
                        >
                          Update status
                        </label>

                        <select
                          value={lotStatus}
                          onChange={(e) =>
                            handleLotStatusChange(lotId, e.target.value)
                          }
                          style={{
                            width: "100%",
                            padding: "10px",
                            borderRadius: "8px",
                            border: "1px solid #dce5dc",
                          }}
                        >
                          <option value="Available">Available</option>
                          <option value="Reserved">Reserved</option>
                          <option value="Sold">Sold</option>
                          <option value="Withdrawn">Withdrawn</option>
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteLot(lotId)}
                        style={{
                          marginTop: "12px",
                          width: "100%",
                          padding: "10px",
                          borderRadius: "8px",
                          border: "1px solid #e6b9b5",
                          color: "#a52b23",
                          background: "#fff",
                          cursor: "pointer",
                        }}
                      >
                        Delete crop lot
                      </button>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* BUYERS */}
        {activePage === "Buyers" && (
          <div className="page-container">
            <section className="page-title-block">
              <div className="eyebrow">
                <span /> BUYER NETWORK
              </div>

              <h1>
                Find the right <span>buyer.</span>
              </h1>

              <p className="page-subtitle">
                Buyer discovery and matching will be connected in a later
                development phase.
              </p>
            </section>

            <div className="buyer-feature-grid">
              <article>
                <span>⌕</span>
                <h3>Buyer matching</h3>
                <p>
                  Match crop type, quantity, quality, and location with buyer
                  requirements.
                </p>
                <small>PLANNED FEATURE</small>
              </article>

              <article>
                <span>✓</span>
                <h3>Buyer reliability</h3>
                <p>
                  Compare verified buyer records and transaction histories
                  when available.
                </p>
                <small>PLANNED FEATURE</small>
              </article>

              <article>
                <span>⇄</span>
                <h3>Better selling choices</h3>
                <p>
                  Compare offers alongside logistics and expected costs.
                </p>
                <small>PLANNED FEATURE</small>
              </article>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;