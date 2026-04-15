const db = require("./config/db");
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const session = require("express-session");

const app = express();

// view engine set karna (EJS use karne ke liye)
app.set("view engine", "ejs");

app.use(express.static("public"));

// views folder ka path set karna
app.set("views", path.join(__dirname, "views"));

// public folder static banana (CSS load karne ke liye)
app.use(express.static(path.join(__dirname, "public")));

// form data read karne ke liye
app.use(bodyParser.urlencoded({ extended: true }));

// session setup
app.use(
  session({
    secret: "studentmanagementsecret",
    resave: false,
    saveUninitialized: true,
  })
);

// login page open karne ka route
app.get("/", (req, res) => {
  res.render("login");
});

// dashboard route 
app.get("/dashboard", (req, res) => {
  if (!req.session.admin) {
    return res.redirect("/");
  }

  const studentQuery = "SELECT COUNT(*) AS totalStudents FROM students";
  const attendanceQuery = "SELECT COUNT(*) AS totalAttendance FROM attendance";
  const marksQuery = "SELECT COUNT(*) AS totalMarks FROM marks";

  db.query(studentQuery, (err, studentResult) => {
    if (err) throw err;

    db.query(attendanceQuery, (err, attendanceResult) => {
      if (err) throw err;

      db.query(marksQuery, (err, marksResult) => {
        if (err) throw err;

        res.render("dashboard", {
          admin: req.session.admin,
          totalStudents: studentResult[0].totalStudents,
          totalAttendance: attendanceResult[0].totalAttendance,
          totalMarks: marksResult[0].totalMarks
        });
      });
    });
  });
});


app.get("/add-student", (req, res) => {
  if (!req.session.admin) {
    return res.redirect("/");
  }

  res.render("add-student");
});

// student list route
app.get("/students", (req, res) => {
  if (!req.session.admin) {
    return res.redirect("/");
  }

  const sql = "SELECT * FROM students";

  db.query(sql, (err, result) => {
    if (err) {
      console.log(err);
      return res.send("Database error");
    }

    res.render("students", { students: result });
  });
});

// Student save route
app.post("/add-student", (req, res) => {
  const { name, roll_no, course, semester, email } = req.body;

  const sql = "INSERT INTO students (name, roll_no, course, semester, email) VALUES (?, ?, ?, ?, ?)";

  db.query(sql, [name, roll_no, course, semester, email], (err, result) => {
    if (err) {
      console.log(err);
      return res.send("Database error");
    }

    res.redirect("/dashboard");
  });
});

// edit-students route
app.get("/edit-student/:id", (req, res) => {
  if (!req.session.admin) {
    return res.redirect("/");
  }

  const studentId = req.params.id;
  const sql = "SELECT * FROM students WHERE id = ?";

  db.query(sql, [studentId], (err, result) => {
    if (err) {
      console.log(err);
      return res.send("Database error");
    }

    res.render("edit-student", { student: result[0] });
  });
});

// delete-student route
app.get("/delete-student/:id", (req, res) => {
  if (!req.session.admin) {
    return res.redirect("/");
  }

  const studentId = req.params.id;
  const sql = "DELETE FROM students WHERE id = ?";

  db.query(sql, [studentId], (err, result) => {
    if (err) {
      console.log(err);
      return res.send("Database error");
    }

    res.redirect("/students");
  });
});


// logout route add
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

// login check karne ka route
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  const sql = "SELECT * FROM admin WHERE username = ? AND password = ?";

  db.query(sql, [username, password], (err, result) => {
    if (err) {
      console.log(err);
      return res.send("Database error");
    }

    if (result.length > 0) {
      req.session.admin = username;
      res.redirect("/dashboard");
    } else {
      res.send("Invalid Username or Password");
    }
  });
});

// update route
app.post("/edit-student/:id", (req, res) => {
  if (!req.session.admin) {
    return res.redirect("/");
  }

  const studentId = req.params.id;
  const { name, roll_no, course, semester, email } = req.body;

  const sql = `
    UPDATE students
    SET name = ?, roll_no = ?, course = ?, semester = ?, email = ?
    WHERE id = ?
  `;

  db.query(sql, [name, roll_no, course, semester, email, studentId], (err, result) => {
    if (err) {
      console.log(err);
      return res.send("Database error");
    }

    res.redirect("/students");
  });
});

// add attendance route
app.get("/add-attendance", (req, res) => {
  if (!req.session.admin) {
    return res.redirect("/");
  }

  const sql = "SELECT * FROM students";

  db.query(sql, (err, result) => {
    if (err) {
      console.log(err);
      return res.send("Database error");
    }

    res.render("add-attendance", { students: result });
  });
});

// Attendance save karne ka route
app.post("/add-attendance", (req, res) => {
  if (!req.session.admin) {
    return res.redirect("/");
  }

  const { student_id, date, status } = req.body;

  const sql = "INSERT INTO attendance (student_id, date, status) VALUES (?, ?, ?)";

  db.query(sql, [student_id, date, status], (err, result) => {
    if (err) {
      console.log(err);
      return res.send("Database error");
    }

    res.redirect("/dashboard");
  });
});

// attendance-list route
app.get("/attendance", (req, res) => {
  if (!req.session.admin) {
    return res.redirect("/");
  }

  const sql = `
    SELECT attendance.id, students.name, students.roll_no, attendance.date, attendance.status
    FROM attendance
    JOIN students ON attendance.student_id = students.id
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.log(err);
      return res.send("Database error");
    }

    res.render("attendance-list", { attendance: result });
  });
});

// add marks page route
app.get("/add-marks", (req, res) => {
  if (!req.session.admin) {
    return res.redirect("/");
  }

  const sql = "SELECT * FROM students";

  db.query(sql, (err, result) => {
    if (err) {
      console.log(err);
      return res.send("Database error");
    }

    res.render("add-marks", { students: result });
  });
});

// marks save route
app.post("/add-marks", (req, res) => {
  if (!req.session.admin) {
    return res.redirect("/");
  }

  const { student_id, subject_name, marks } = req.body;

  const sql = "INSERT INTO marks (student_id, subject_name, marks) VALUES (?, ?, ?)";

  db.query(sql, [student_id, subject_name, marks], (err, result) => {
    if (err) {
      console.log(err);
      return res.send("Database error");
    }

    res.redirect("/dashboard");
  });
});

// marks list route
app.get("/marks", (req, res) => {
  if (!req.session.admin) {
    return res.redirect("/");
  }

  const sql = `
    SELECT marks.id, students.name, students.roll_no, marks.subject_name, marks.marks
    FROM marks
    JOIN students ON marks.student_id = students.id
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.log(err);
      return res.send("Database error");
    }

    res.render("marks-list", { marks: result });
  });
});

// attendance delete route
app.get("/delete-attendance/:id", (req, res) => {
  if (!req.session.admin) {
    return res.redirect("/");
  }

  const attendanceId = req.params.id;
  const sql = "DELETE FROM attendance WHERE id = ?";

  db.query(sql, [attendanceId], (err, result) => {
    if (err) {
      console.log(err);
      return res.send("Database error");
    }

    res.redirect("/attendance");
  });
});

// marks delete route
app.get("/delete-marks/:id", (req, res) => {
  if (!req.session.admin) {
    return res.redirect("/");
  }

  const marksId = req.params.id;
  const sql = "DELETE FROM marks WHERE id = ?";

  db.query(sql, [marksId], (err, result) => {
    if (err) {
      console.log(err);
      return res.send("Database error");
    }

    res.redirect("/marks");
  });
});

// server start
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});