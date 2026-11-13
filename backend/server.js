
const express = require("express");
const cors = require("cors");
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

// --------------------------------------------------
// 1. SUPABASE CONFIGURATION
// --------------------------------------------------

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error(
    "Missing SUPABASE_URL or SUPABASE_ANON_KEY in backend/.env"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// --------------------------------------------------
// 2. DEMONSTRATION CROP PRICE DATA
// These are NOT live mandi prices.
// --------------------------------------------------

const crops = [
  {
    id: 1,
    name: "Wheat",
    hindi: "Gehu",
    price: 2450,
    change: 4.2,
    market: "Nashik",
  },
  {
    id: 2,
    name: "Onion",
    hindi: "Pyaz",
    price: 1850,
    change: -2.1,
    market: "Lasalgaon",
  },
  {
    id: 3,
    name: "Tomato",
    hindi: "Tamatar",
    price: 3200,
    change: 8.6,
    market: "Pune",
  },
  {
    id: 4,
    name: "Soybean",
    hindi: "Soyabean",
    price: 4680,
    change: 3.4,
    market: "Latur",
  },
];

// --------------------------------------------------
// 3. AUTHENTICATION MIDDLEWARE
// Verify the Supabase access token.
// --------------------------------------------------

async function authenticateUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication required. Please log in.",
      });
    }

    const token = authHeader.split(" ")[1];

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired login session. Please log in again.",
      });
    }

    req.user = data.user;

    // Use the logged-in user's token for database requests.
    // Supabase RLS will enforce the user's permissions.
    req.userSupabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    next();
  } catch (error) {
    console.error("Authentication error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to verify your login session.",
    });
  }
}

// --------------------------------------------------
// 4. HEALTH CHECK
// --------------------------------------------------

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "AgriSetu API is running!",
  });
});

// --------------------------------------------------
// 5. CROP PRICE ROUTES
// --------------------------------------------------

app.get("/api/crops", (req, res) => {
  res.json({
    success: true,
    source: "demonstration-data",
    note: "Sample prices only; not live market data.",
    count: crops.length,
    crops,
  });
});

app.get("/api/crops/:name", (req, res) => {
  const crop = crops.find(
    (item) =>
      item.name.toLowerCase() === req.params.name.toLowerCase()
  );

  if (!crop) {
    return res.status(404).json({
      success: false,
      message: "Crop not found.",
    });
  }

  res.json({
    success: true,
    crop,
  });
});

// --------------------------------------------------
// 6. SMART SELL ROUTE
// --------------------------------------------------

app.post("/api/smart-sell", (req, res) => {
  const { cropName, quantityKg } = req.body;

  if (
    typeof cropName !== "string" ||
    !Number.isFinite(quantityKg) ||
    quantityKg <= 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Provide a valid cropName and a positive quantityKg.",
    });
  }

  const crop = crops.find(
    (item) =>
      item.name.toLowerCase() === cropName.trim().toLowerCase()
  );

  if (!crop) {
    return res.status(404).json({
      success: false,
      message: "Crop not found.",
    });
  }

  const grossValue = (quantityKg / 100) * crop.price;

  res.json({
    success: true,
    crop: crop.name,
    quantityKg,
    indicativePricePerQuintal: crop.price,
    estimatedGrossValue: Math.round(grossValue * 100) / 100,
    currency: "INR",
    note: "Demonstration estimate only. Transport, fees, and other costs are excluded.",
  });
});

// --------------------------------------------------
// 7. USER REGISTRATION
// --------------------------------------------------

app.post("/api/auth/signup", async (req, res) => {
  try {
    const { fullName, email, password, phone, role } = req.body;

    if (
      typeof fullName !== "string" ||
      !fullName.trim() ||
      typeof email !== "string" ||
      !email.trim() ||
      typeof password !== "string" ||
      password.length < 8
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Enter your full name, a valid email and a password of at least 8 characters.",
      });
    }

    const selectedRole = role || "farmer";

    if (!["farmer", "buyer"].includes(selectedRole)) {
      return res.status(400).json({
        success: false,
        message: "Role must be farmer or buyer.",
      });
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: {
          full_name: fullName.trim(),
          phone: typeof phone === "string" ? phone.trim() : null,
          role: selectedRole,
        },
      },
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(201).json({
      success: true,
      message: data.session
        ? "Registration successful."
        : "Registration received. Please verify your email before logging in.",
      user: data.user,
      session: data.session,
    });
  } catch (error) {
    console.error("Signup error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to register your account.",
    });
  }
});

// --------------------------------------------------
// 8. USER LOGIN
// --------------------------------------------------

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

    if (error) {
      return res.status(401).json({
        success: false,
        message: error.message,
      });
    }

    res.json({
      success: true,
      message: "Login successful.",
      user: data.user,
      session: data.session,
    });
  } catch (error) {
    console.error("Login error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to log in.",
    });
  }
});

// --------------------------------------------------
// 9. GET LOGGED-IN USER PROFILE
// --------------------------------------------------

app.get("/api/auth/me", authenticateUser, async (req, res) => {
  try {
    const { data, error } = await req.userSupabase
      .from("profiles")
      .select("id, full_name, phone, role, created_at")
      .eq("id", req.user.id)
      .single();

    if (error) {
      return res.status(404).json({
        success: false,
        message: "Profile not found.",
      });
    }

    res.json({
      success: true,
      user: data,
    });
  } catch (error) {
    console.error("Profile error:", error.message);

    res.status(500).json({
      success: false,
      message: "Unable to fetch your profile.",
    });
  }
});

// --------------------------------------------------
// 10. CREATE A CROP LOT
// --------------------------------------------------

app.post("/api/crop-lots", authenticateUser, async (req, res) => {
  try {
    const {
      cropName,
      quantityKg,
      qualityGrade,
      location,
      harvestDate,
      expectedPricePerQuintal,
    } = req.body;

    const validGrades = ["A", "B", "C", "Not Graded"];

    if (
      typeof cropName !== "string" ||
      !cropName.trim() ||
      typeof location !== "string" ||
      !location.trim() ||
      !Number.isFinite(Number(quantityKg)) ||
      Number(quantityKg) <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Provide a crop name, valid quantity and location.",
      });
    }

    const grade = qualityGrade || "Not Graded";

    if (!validGrades.includes(grade)) {
      return res.status(400).json({
        success: false,
        message: "Invalid quality grade.",
      });
    }

    if (
      expectedPricePerQuintal !== undefined &&
      expectedPricePerQuintal !== null &&
      (
        !Number.isFinite(Number(expectedPricePerQuintal)) ||
        Number(expectedPricePerQuintal) < 0
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Expected price must be zero or a positive number.",
      });
    }

    const newLot = {
      farmer_id: req.user.id,
      crop_name: cropName.trim(),
      quantity_kg: Number(quantityKg),
      quality_grade: grade,
      location: location.trim(),
      harvest_date: harvestDate || null,
      expected_price_per_quintal:
        expectedPricePerQuintal === undefined ||
        expectedPricePerQuintal === null ||
        expectedPricePerQuintal === ""
          ? null
          : Number(expectedPricePerQuintal),
    };

    const { data, error } = await req.userSupabase
      .from("crop_lots")
      .insert(newLot)
      .select()
      .single();

    if (error) {
      console.error("Create crop lot error:", error.message);

      return res.status(400).json({
        success: false,
        message: "Unable to save crop lot.",
      });
    }

    res.status(201).json({
      success: true,
      message: "Crop lot created successfully.",
      cropLot: data,
    });
  } catch (error) {
    console.error("Create crop lot error:", error.message);

    res.status(500).json({
      success: false,
      message: "Something went wrong while creating the crop lot.",
    });
  }
});

// --------------------------------------------------
// 11. GET THE LOGGED-IN FARMER'S CROP LOTS
// --------------------------------------------------

app.get("/api/crop-lots", authenticateUser, async (req, res) => {
  try {
    const { data, error } = await req.userSupabase
      .from("crop_lots")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fetch crop lots error:", error.message);

      return res.status(400).json({
        success: false,
        message: "Unable to fetch crop lots.",
      });
    }

    res.json({
      success: true,
      count: data.length,
      cropLots: data,
    });
  } catch (error) {
    console.error("Fetch crop lots error:", error.message);

    res.status(500).json({
      success: false,
      message: "Something went wrong while fetching crop lots.",
    });
  }
});

// --------------------------------------------------
// 12. UPDATE A CROP LOT
// --------------------------------------------------

app.patch("/api/crop-lots/:id", authenticateUser, async (req, res) => {
  try {
    const allowedFields = {
      cropName: "crop_name",
      quantityKg: "quantity_kg",
      qualityGrade: "quality_grade",
      location: "location",
      harvestDate: "harvest_date",
      expectedPricePerQuintal: "expected_price_per_quintal",
      status: "status",
    };

    const updates = {};

    for (const [inputField, databaseField] of Object.entries(allowedFields)) {
      if (Object.prototype.hasOwnProperty.call(req.body, inputField)) {
        updates[databaseField] = req.body[inputField];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update.",
      });
    }

    if (
      updates.quantity_kg !== undefined &&
      (!Number.isFinite(Number(updates.quantity_kg)) ||
        Number(updates.quantity_kg) <= 0)
    ) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than zero.",
      });
    }

    if (
      updates.quality_grade !== undefined &&
      !["A", "B", "C", "Not Graded"].includes(updates.quality_grade)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid quality grade.",
      });
    }

    if (
      updates.status !== undefined &&
      !["Available", "Reserved", "Sold", "Withdrawn"].includes(updates.status)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid crop lot status.",
      });
    }

    if (updates.quantity_kg !== undefined) {
      updates.quantity_kg = Number(updates.quantity_kg);
    }

    if (updates.crop_name !== undefined) {
      if (typeof updates.crop_name !== "string" || !updates.crop_name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Crop name cannot be empty.",
        });
      }
      updates.crop_name = updates.crop_name.trim();
    }

    if (updates.location !== undefined) {
      if (typeof updates.location !== "string" || !updates.location.trim()) {
        return res.status(400).json({
          success: false,
          message: "Location cannot be empty.",
        });
      }
      updates.location = updates.location.trim();
    }

    if (updates.expected_price_per_quintal !== undefined) {
      if (
        updates.expected_price_per_quintal !== null &&
        (
          !Number.isFinite(Number(updates.expected_price_per_quintal)) ||
          Number(updates.expected_price_per_quintal) < 0
        )
      ) {
        return res.status(400).json({
          success: false,
          message: "Expected price must be zero or a positive number.",
        });
      }

      if (updates.expected_price_per_quintal !== null) {
        updates.expected_price_per_quintal =
          Number(updates.expected_price_per_quintal);
      }
    }

    const { data, error } = await req.userSupabase
      .from("crop_lots")
      .update(updates)
      .eq("id", req.params.id)
      .select()
      .maybeSingle();

    if (error) {
      console.error("Update crop lot error:", error.message);

      return res.status(400).json({
        success: false,
        message: "Unable to update crop lot.",
      });
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Crop lot not found.",
      });
    }

    res.json({
      success: true,
      message: "Crop lot updated successfully.",
      cropLot: data,
    });
  } catch (error) {
    console.error("Update crop lot error:", error.message);

    res.status(500).json({
      success: false,
      message: "Something went wrong while updating the crop lot.",
    });
  }
});

// --------------------------------------------------
// 13. DELETE A CROP LOT
// --------------------------------------------------

app.delete("/api/crop-lots/:id", authenticateUser, async (req, res) => {
  try {
    const { data, error } = await req.userSupabase
      .from("crop_lots")
      .delete()
      .eq("id", req.params.id)
      .select("id")
      .maybeSingle();

    if (error) {
      console.error("Delete crop lot error:", error.message);

      return res.status(400).json({
        success: false,
        message: "Unable to delete crop lot.",
      });
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Crop lot not found.",
      });
    }

    res.json({
      success: true,
      message: "Crop lot deleted successfully.",
    });
  } catch (error) {
    console.error("Delete crop lot error:", error.message);

    res.status(500).json({
      success: false,
      message: "Something went wrong while deleting the crop lot.",
    });
  }
});

// --------------------------------------------------
// 14. UNKNOWN API ROUTES
// --------------------------------------------------

app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found.",
  });
});

// --------------------------------------------------
// 15. GENERAL ERROR HANDLER
// --------------------------------------------------

app.use((error, req, res, next) => {
  console.error("Unexpected server error:", error.message);

  res.status(500).json({
    success: false,
    message: "An unexpected server error occurred.",
  });
});

// --------------------------------------------------
// 16. START SERVER
// --------------------------------------------------

app.listen(PORT, () => {
  console.log(`AgriSetu API running at http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});
