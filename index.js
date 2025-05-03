require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();


const userRoutes = require('./src/routes/api');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors({ origin: '*' }));

const connectDB = require('./src/config/database');
connectDB();


app.use(userRoutes);

app.get("/", (req, res) => {
    const list = [
        { id: 1, name: "Tho Panha" },
        { id: 2, name: "Lean Kimlay" },
        { id: 3, name: "Sovannaroth" },
        { id: 4, name: "Samon" },
    ];
    res.json({ list });
});

// Start the server
app.listen(process.env.PORT, () => {
    console.log("Server running at http://localhost:" + process.env.PORT);
});
