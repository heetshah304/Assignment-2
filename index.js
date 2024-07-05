/* 
NAME: HEET SHAH
STUDENT NUMBER: N01580081
*/

const express = require("express");
const app = express();
const PORT = 8000;
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads");
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

// middleware:
app.use(express.urlencoded({ extended: true })); // handle normal forms -> url encoded
app.use(express.json()); // Handle raw json data

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "index.html"));
});

app
  .route("/upload")
  .get((req, res) => {
    res.sendFile(path.join(__dirname, "views", "upload.html"));
  })
  .post(upload.single("file"), (req, res) => {
    if (!req.file) {
      return res.status(400).send("No file uploaded.");
    }
    res.send(`File uploaded successfully: ${req.file.path}`);
  });

app
  .route("/upload-multiple")
  .get((req, res) => {
    res.sendFile(path.join(__dirname, "views", "upload-multiple.html"));
  })
  .post(upload.array("files", 100), (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).send("No files uploaded.");
    }
    const filePaths = req.files.map((file) => file.path);
    res
      .status(200)
      .send(`Files uploaded successfully: ${filePaths.join(", ")}`);
  });

app.get("/single", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "single.html"));
});

app.get("/fetch-single", (req, res) => {
  let upload_dir = path.join(__dirname, "uploads");

  // NOTE: This reads the directory, not the file, so think about how you can use this for the assignment
  let uploads = fs.readdirSync(upload_dir);
  console.log(uploads);
  // Add error handling
  if (uploads.length == 0) {
    return res.status(503).send({
      message: "No images",
    });
  }
  let max = uploads.length - 1;
  let min = 0;

  let index = Math.round(Math.random() * (max - min) + min);
  let randomImage = uploads[index];

  res.sendFile(path.join(upload_dir, randomImage));
});

app.get("/fetch-multiple", (req, res) => {
  let upload_dir = path.join(__dirname, "uploads");

  let uploads = fs.readdirSync(upload_dir);
  console.log(uploads);
  if (uploads.length == 0) {
    return res.status(503).send({
      message: "No images",
    });
  }

  let selectedImages = [];
  for (let i = 0; i < 3; i++) {
    let index = Math.floor(Math.random() * uploads.length);
    selectedImages.push(path.join("/uploads", uploads[index]));
    uploads.splice(index, 1);
  }

  res.json(selectedImages);
});

app.get("/multiple", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "multiple.html"));
});

app.use(express.static("uploads"));

const uploadFolder = path.join(__dirname, "uploads");

// Serve static files from the upload directory
app.use("/uploads", express.static(uploadFolder));

app.get("/gallery", (req, res) => {
  fs.readdir(uploadFolder, (err, files) => {
    if (err) {
      return res.status(500).send("Unable to scan directory: " + err);
    }

    const fileInfos = files.map((file) => ({
      name: file,
      url: `/uploads/${file}`,
    }));

    res.json(fileInfos);
  });
});

app.get("/fetch-images", async (req, res) => {
  try {
    const apiKey = req.query.apiKey || "your_api_key_here"; // Replace with your API key or use req.query.apiKey
    const query = "dogs"; // Example query
    const count = 20; // Number of images to fetch

    const response = await axios.get(`https://api.unsplash.com/search/photos`, {
      params: { query, per_page: count },
      headers: {
        Authorization: `Client-ID ${apiKey}`,
      },
    });

    const images = response.data.results.map((image) => image.urls.regular);
    res.json(images);
  } catch (error) {
    console.error("Error fetching images:", error);
    res.status(500).json({ error: "Error fetching images" });
  }
});

app.post("/upload-multiple", upload.array("files", 100), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).send("No files uploaded.");
  }
  const filePaths = req.files.map((file) => file.path);
  res.status(200).send(`Files uploaded successfully: ${filePaths.join(", ")}`);
});

app.use(express.static(path.join(__dirname, "public")));
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.get("/upload-multiple", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "upload-multiple.html"));
});

// Gallery page
app.get("/gallery", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "gallery.html"));
});

app.get("/fetch-all-images", (req, res) => {
  let uploadDir = path.join(__dirname, "uploads");

  fs.readdir(uploadDir, (err, files) => {
    if (err) {
      console.error("Error reading uploads directory:", err);
      return res.status(500).send("Internal Server Error");
    }

    const imagePaths = files.map((file) => path.join("/uploads", file));
    res.json(imagePaths);
  });
});

// Gallery with pagination
app.get("/gallery-pagination", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "gallery-pagination.html"));
});

app.get("/fetch-all-pagination/pages/:index", (req, res) => {
  const index = parseInt(req.params.index);
  const pageSize = 5; // Number of images per page
  const startIndex = index * pageSize;
  const endIndex = startIndex + pageSize;
  let uploadDir = path.join(__dirname, "uploads");

  fs.readdir(uploadDir, (err, files) => {
    if (err) {
      console.error("Error reading uploads directory:", err);
      return res.status(500).send("Internal Server Error");
    }

    const paginatedFiles = files.slice(startIndex, endIndex);
    const imagePaths = paginatedFiles.map((file) =>
      path.join("/uploads", file)
    );
    res.json(imagePaths);
  });
});
// catch all other requests
app.use((req, res) => {
  res.status(404).send("Route not found");
});
app.listen(PORT, () => {
  console.log(`http://localhost:${PORT}`);
});
