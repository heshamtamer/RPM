const express = require("express");
const errorHandler = require("./middleware/errorHandler");
const {connectDb} = require("./config/dbConnection");
const dotenv = require("dotenv").config();
connectDb();
const app = express();

const port = process.env.PORT || 3000;
app.use(express.json());

app.use("/api/patients", require("./routes/patientRoutes"));
app.use("/api/users", require("./routes/userRoutes"));

app.get("/test", (req, res) => {
    res.send("Hello World");
});


app.use(errorHandler)
app.listen(port , () => {
    console.log(`server running on port ${port}`);
});