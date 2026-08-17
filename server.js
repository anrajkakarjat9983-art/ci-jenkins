const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

const file = path.join(__dirname, "students.json");

app.use(express.json());
app.use(express.static(__dirname));

app.post("/register", (req, res) => {

    const { studentName, email, mobile, branch, password } = req.body;

    // Validation
    if (!studentName || !email || !mobile || !branch || !password) {
        return res.status(400).json({
            success: false,
            message: "All fields are required"
        });
    }

    if (!email.includes("@")) {
        return res.status(400).json({
            success: false,
            message: "Invalid email"
        });
    }

    if (!/^\d{10}$/.test(mobile)) {
        return res.status(400).json({
            success: false,
            message: "Mobile must contain 10 digits"
        });
    }

    if (password.length < 6) {
        return res.status(400).json({
            success: false,
            message: "Password must contain at least 6 characters"
        });
    }

    try {

        // Create file if it doesn't exist
        if (!fs.existsSync(file)) {
            fs.writeFileSync(file, "[]", "utf8");
        }

        // Read students
        let text = fs.readFileSync(file, "utf8").trim();

        // Empty file = empty array
        let students = text ? JSON.parse(text) : [];

        if (!Array.isArray(students)) {
            students = [];
        }

        // New student
        const student = {
            id: students.length + 1,
            name: studentName.trim(),
            email: email.trim(),
            mobile: mobile,
            branch: branch,
            password: password
        };

        students.push(student);

        // Save
        fs.writeFileSync(
            file,
            JSON.stringify(students, null, 4),
            "utf8"
        );

        console.log("Student saved:", student.name);

        res.json({
            success: true,
            message: "Registration Successful"
        });

    } catch (error) {

        console.log("ERROR:", error);

        res.status(500).json({
            success: false,
            message: "Unable to save student data"
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});