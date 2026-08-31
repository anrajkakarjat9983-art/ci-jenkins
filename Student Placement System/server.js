const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'store.json');

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

function readData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading store.json:', err);
    return {
      users: [], students: [], companies: [], drives: [],
      applications: [], shortlists: [], interviews: [],
      placements: [], notifications: [], documents: []
    };
  }
}

function writeData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing store.json:', err);
    return false;
  }
}

// -------------------------------------------------------------
// 0. AUTHENTICATION (LOGIN & SIGNUP / REGISTER)
// -------------------------------------------------------------
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const data = readData();
  const users = data.users || [];

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  res.json({
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      studentId: user.studentId || null,
      companyId: user.companyId || null
    }
  });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password, role, branch, cgpa, companyName } = req.body;
  const data = readData();

  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Name, email, password, and role are required.' });
  }

  // Check if email exists
  if (data.users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(400).json({ error: 'An account with this email already exists.' });
  }

  const userId = 'USR' + String(Date.now()).slice(-4);
  let studentId = null;
  let companyId = null;

  // Role specific entity creation
  if (role === 'student') {
    studentId = 'STU' + String(Date.now()).slice(-4);
    const newStudent = {
      id: studentId,
      name,
      email,
      phone: '+91 98000 00000',
      branch: branch || 'Computer Science',
      cgpa: parseFloat(cgpa) || 7.5,
      class10Pct: 90.0,
      class12Pct: 88.0,
      backlogs: 0,
      graduationYear: 2026,
      skills: ['Programming', 'Problem Solving'],
      resumeUrl: 'https://example.com/resumes/default.pdf',
      status: 'Unplaced',
      offerPackage: '-',
      placedCompany: '-'
    };
    data.students.push(newStudent);
  } else if (role === 'recruiter') {
    companyId = 'COMP' + String(Date.now()).slice(-4);
    const newComp = {
      id: companyId,
      name: companyName || 'New Hiring Partner',
      sector: 'Technology & Enterprise',
      website: 'https://example.com',
      hrName: name,
      hrEmail: email,
      hrPhone: '+91 98000 00000',
      location: 'Bengaluru / Remote',
      rating: 4.5,
      status: 'Approved Partner'
    };
    data.companies.push(newComp);
  }

  const newUser = {
    id: userId,
    name,
    email,
    password,
    role,
    studentId,
    companyId
  };

  data.users.push(newUser);
  writeData(data);

  res.status(201).json({
    success: true,
    message: 'Registration successful!',
    user: {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      studentId: newUser.studentId,
      companyId: newUser.companyId
    }
  });
});

// -------------------------------------------------------------
// 1. STATS & ANALYTICS API (Computes all 8 Key Dashboard Cards)
// -------------------------------------------------------------
app.get('/api/stats', (req, res) => {
  const data = readData();
  const students = data.students || [];
  const companies = data.companies || [];
  const drives = data.drives || [];
  const applications = data.applications || [];
  const shortlists = data.shortlists || [];
  const placements = data.placements || [];

  const totalStudents = students.length;
  const registeredStudents = students.filter(s => s.resumeUrl).length || totalStudents;
  const activeCompanies = companies.filter(c => c.status === 'Approved Partner').length;
  const activeDrives = drives.filter(d => d.status === 'Active').length;
  const totalApplications = applications.length;
  const shortlistedStudents = shortlists.length;
  const placedStudents = students.filter(s => s.status === 'Placed').length;

  const placementRate = totalStudents > 0 ? parseFloat(((placedStudents / totalStudents) * 100).toFixed(1)) : 0;

  let maxVal = 0;
  let sumVal = 0;
  let countVal = 0;

  students.filter(s => s.status === 'Placed').forEach(s => {
    if (s.offerPackage && s.offerPackage.includes('LPA')) {
      const v = parseFloat(s.offerPackage.replace('₹', '').replace('LPA', '').trim());
      if (!isNaN(v)) {
        if (v > maxVal) maxVal = v;
        sumVal += v;
        countVal++;
      }
    }
  });

  const avgPackage = countVal > 0 ? (sumVal / countVal).toFixed(2) + ' LPA' : '₹0.0 LPA';
  const highestPackage = maxVal > 0 ? `₹${maxVal.toFixed(1)} LPA` : '₹0.0 LPA';

  const branchMap = {};
  students.forEach(s => {
    if (!branchMap[s.branch]) {
      branchMap[s.branch] = { total: 0, placed: 0 };
    }
    branchMap[s.branch].total++;
    if (s.status === 'Placed') branchMap[s.branch].placed++;
  });

  const branchBreakdown = Object.keys(branchMap).map(b => ({
    branch: b,
    total: branchMap[b].total,
    placed: branchMap[b].placed,
    rate: ((branchMap[b].placed / branchMap[b].total) * 100).toFixed(0)
  }));

  res.json({
    totalStudents,
    registeredStudents,
    activeCompanies,
    activeDrives,
    totalApplications,
    shortlistedStudents,
    placedStudents,
    placementRate,
    highestPackage,
    avgPackage,
    branchBreakdown
  });
});

// -------------------------------------------------------------
// 2. COMPANIES MANAGEMENT API
// -------------------------------------------------------------
app.get('/api/companies', (req, res) => {
  const data = readData();
  res.json(data.companies || []);
});

app.post('/api/companies', (req, res) => {
  const data = readData();
  const newComp = {
    id: 'COMP' + String(Date.now()).slice(-4),
    name: req.body.name,
    sector: req.body.sector || 'Technology',
    website: req.body.website || 'https://example.com',
    hrName: req.body.hrName || 'HR Manager',
    hrEmail: req.body.hrEmail || 'hr@company.com',
    hrPhone: req.body.hrPhone || '+91 98000 00000',
    location: req.body.location || 'Remote',
    rating: parseFloat(req.body.rating) || 4.5,
    status: 'Approved Partner'
  };
  data.companies.unshift(newComp);
  writeData(data);
  res.status(201).json(newComp);
});

// -------------------------------------------------------------
// 3. PLACEMENT DRIVES API
// -------------------------------------------------------------
app.get('/api/drives', (req, res) => {
  const data = readData();
  const { companyId } = req.query;
  let drives = data.drives || [];
  if (companyId) {
    drives = drives.filter(d => d.companyId === companyId);
  }
  res.json(drives);
});

app.post('/api/drives', (req, res) => {
  const data = readData();
  const { company, companyId, role, ctc, minCgpa, maxBacklogs, eligibleBranches, location, deadline, description } = req.body;

  const newDrive = {
    id: 'DRV' + String(Date.now()).slice(-4),
    companyId: companyId || 'COMP001',
    company: company || 'Partner Company',
    role,
    ctc: ctc.includes('LPA') ? ctc : `₹${ctc} LPA`,
    minCgpa: parseFloat(minCgpa) || 6.0,
    maxBacklogs: parseInt(maxBacklogs, 10) || 0,
    eligibleBranches: Array.isArray(eligibleBranches) ? eligibleBranches : [eligibleBranches || 'All Branches'],
    location: location || 'Remote',
    deadline: deadline || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    status: 'Active',
    description: description || 'No detailed description provided.',
    rounds: ['Resume Screening', 'Online Assessment', 'Tech Interview 1', 'HR Round']
  };

  data.drives.unshift(newDrive);
  writeData(data);
  res.status(201).json(newDrive);
});

app.put('/api/drives/:id', (req, res) => {
  const data = readData();
  const idx = data.drives.findIndex(d => d.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Drive not found.' });

  data.drives[idx] = { ...data.drives[idx], ...req.body };
  writeData(data);
  res.json(data.drives[idx]);
});

// -------------------------------------------------------------
// 4. STUDENTS API & EXPORT
// -------------------------------------------------------------
app.get('/api/students', (req, res) => {
  const data = readData();
  let students = data.students || [];

  const { branch, minCgpa, status, search } = req.query;

  if (branch) students = students.filter(s => s.branch.toLowerCase() === branch.toLowerCase());
  if (minCgpa) students = students.filter(s => s.cgpa >= parseFloat(minCgpa));
  if (status) students = students.filter(s => s.status.toLowerCase() === status.toLowerCase());
  if (search) {
    const q = search.toLowerCase();
    students = students.filter(s => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || s.id.toLowerCase().includes(q));
  }

  res.json(students);
});

app.get('/api/students/export', (req, res) => {
  const data = readData();
  const students = data.students || [];

  let csv = 'ID,Name,Email,Phone,Branch,CGPA,Class10 %,Class12 %,Backlogs,Status,Placed Company,Offer Package\n';
  students.forEach(s => {
    csv += `"${s.id}","${s.name}","${s.email}","${s.phone}","${s.branch}",${s.cgpa},${s.class10Pct || 90},${s.class12Pct || 88},${s.backlogs},"${s.status}","${s.placedCompany}","${s.offerPackage}"\n`;
  });

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="Placement_Students_Report.csv"');
  res.status(200).send(csv);
});

app.put('/api/students/:id', (req, res) => {
  const data = readData();
  const idx = data.students.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Student not found.' });

  data.students[idx] = { ...data.students[idx], ...req.body };
  writeData(data);
  res.json(data.students[idx]);
});

// -------------------------------------------------------------
// 5. APPLICATIONS & SHORTLISTING API
// -------------------------------------------------------------
app.get('/api/applications', (req, res) => {
  const data = readData();
  const { studentId, driveId, company } = req.query;

  let apps = data.applications || [];
  if (studentId) apps = apps.filter(a => a.studentId === studentId);
  if (driveId) apps = apps.filter(a => a.driveId === driveId);
  if (company) apps = apps.filter(a => a.company.toLowerCase() === company.toLowerCase());

  res.json(apps);
});

app.post('/api/applications', (req, res) => {
  const data = readData();
  const { studentId, driveId } = req.body;

  const student = data.students.find(s => s.id === studentId);
  const drive = data.drives.find(d => d.id === driveId);

  if (!student || !drive) return res.status(400).json({ error: 'Invalid Student ID or Drive ID.' });

  const existing = data.applications.find(a => a.studentId === studentId && a.driveId === driveId);
  if (existing) return res.status(400).json({ error: 'Already applied to this drive.' });

  if (student.cgpa < drive.minCgpa) return res.status(400).json({ error: `CGPA requirement not met (${student.cgpa} < Min ${drive.minCgpa})` });
  if (student.backlogs > drive.maxBacklogs) return res.status(400).json({ error: `Backlog limit exceeded (${student.backlogs} > Max ${drive.maxBacklogs})` });

  const today = new Date().toISOString().split('T')[0];
  const newApp = {
    id: 'APP' + String(Date.now()).slice(-4),
    studentId,
    driveId,
    company: drive.company,
    role: drive.role,
    appliedDate: today,
    status: 'Applied',
    currentStage: drive.rounds[0] || 'Applied',
    stageIndex: 0,
    history: [{ stage: drive.rounds[0] || 'Applied', date: today, note: 'Application submitted.' }]
  };

  data.applications.unshift(newApp);
  if (student.status === 'Unplaced') student.status = 'In Progress';

  writeData(data);
  res.status(201).json(newApp);
});

app.put('/api/applications/:id/status', (req, res) => {
  const data = readData();
  const { status, stage, note, offerPackage } = req.body;
  const appItem = data.applications.find(a => a.id === req.params.id);

  if (!appItem) return res.status(404).json({ error: 'Application not found.' });

  const today = new Date().toISOString().split('T')[0];
  if (status) appItem.status = status;
  if (stage) appItem.currentStage = stage;

  appItem.history.push({
    stage: stage || status || 'Updated',
    date: today,
    note: note || `Status updated to ${status || stage}`
  });

  if (status === 'Shortlisted') {
    const student = data.students.find(s => s.id === appItem.studentId);
    if (student) student.status = 'Shortlisted';
    if (!data.shortlists.find(sh => sh.driveId === appItem.driveId && sh.studentId === appItem.studentId)) {
      data.shortlists.push({
        id: 'SHL' + String(Date.now()).slice(-4),
        driveId: appItem.driveId,
        studentId: appItem.studentId,
        studentName: student ? student.name : appItem.studentId,
        company: appItem.company,
        status: 'Shortlisted'
      });
    }
  }

  if (status === 'Offer Accepted' || status === 'Selected') {
    const student = data.students.find(s => s.id === appItem.studentId);
    const drive = data.drives.find(d => d.id === appItem.driveId);
    if (student) {
      student.status = 'Placed';
      student.placedCompany = appItem.company;
      student.offerPackage = offerPackage || (drive ? drive.ctc : '₹12.0 LPA');

      data.placements.unshift({
        id: 'PLC' + String(Date.now()).slice(-4),
        studentId: student.id,
        studentName: student.name,
        branch: student.branch,
        company: appItem.company,
        role: appItem.role,
        package: student.offerPackage,
        placedDate: today,
        status: 'Offer Accepted'
      });
    }
  }

  writeData(data);
  res.json(appItem);
});

// -------------------------------------------------------------
// 6. SHORTLISTS API
// -------------------------------------------------------------
app.get('/api/shortlists', (req, res) => {
  const data = readData();
  res.json(data.shortlists || []);
});

// -------------------------------------------------------------
// 7. INTERVIEWS SCHEDULER API
// -------------------------------------------------------------
app.get('/api/interviews', (req, res) => {
  const data = readData();
  const { studentId, driveId } = req.query;
  let ints = data.interviews || [];
  if (studentId) ints = ints.filter(i => i.studentId === studentId);
  if (driveId) ints = ints.filter(i => i.driveId === driveId);
  res.json(ints);
});

app.post('/api/interviews', (req, res) => {
  const data = readData();
  const { driveId, studentId, studentName, company, roundName, date, time, meetingLink, interviewer } = req.body;

  const newInt = {
    id: 'INT' + String(Date.now()).slice(-4),
    driveId: driveId || 'DRV001',
    studentId: studentId || 'STU001',
    studentName: studentName || 'Candidate',
    company: company || 'Company',
    roundName: roundName || 'Technical Interview',
    date: date || new Date().toISOString().split('T')[0],
    time: time || '10:00 AM - 11:00 AM',
    meetingLink: meetingLink || 'https://meet.google.com/demo',
    interviewer: interviewer || 'Recruiter Lead',
    status: 'Scheduled'
  };

  data.interviews.unshift(newInt);

  data.notifications.unshift({
    id: 'NTC' + String(Date.now()).slice(-4),
    title: `${company} Interview Allotted`,
    target: studentId,
    date: new Date().toISOString().split('T')[0],
    message: `${roundName} scheduled on ${date} at ${time}. Link: ${meetingLink}`
  });

  writeData(data);
  res.status(201).json(newInt);
});

// -------------------------------------------------------------
// 8. PLACEMENTS RESULTS API
// -------------------------------------------------------------
app.get('/api/placements', (req, res) => {
  const data = readData();
  res.json(data.placements || []);
});

// -------------------------------------------------------------
// 9. NOTIFICATIONS API
// -------------------------------------------------------------
app.get('/api/notifications', (req, res) => {
  const data = readData();
  const { target } = req.query;
  let notes = data.notifications || [];
  if (target) {
    notes = notes.filter(n => n.target === target || n.target === 'All Students' || n.target === 'All Users');
  }
  res.json(notes);
});

app.post('/api/notifications', (req, res) => {
  const data = readData();
  const newNote = {
    id: 'NTC' + String(Date.now()).slice(-4),
    title: req.body.title,
    target: req.body.target || 'All Students',
    date: new Date().toISOString().split('T')[0],
    message: req.body.message
  };

  data.notifications.unshift(newNote);
  writeData(data);
  res.status(201).json(newNote);
});

// -------------------------------------------------------------
// 10. STUDENT DOCUMENTS MANAGEMENT API (STRICT <5 MB LIMIT)
// -------------------------------------------------------------
app.get('/api/documents', (req, res) => {
  const data = readData();
  const { studentId, category } = req.query;
  let docs = data.documents || [];

  if (studentId) {
    docs = docs.filter(d => d.studentId === studentId);
  }
  if (category && category !== 'all') {
    docs = docs.filter(d => d.category === category);
  }

  res.json(docs);
});

app.post('/api/documents', (req, res) => {
  const data = readData();
  const { studentId, category, title, fileName, fileType, fileSize, fileData, notes, score } = req.body;

  if (!studentId || !title || !category) {
    return res.status(400).json({ error: 'Student ID, document category, and title are required.' });
  }

  // Strict file size limit validation: < 5 MB (5 * 1024 * 1024 bytes)
  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  if (fileSize && fileSize > MAX_FILE_SIZE) {
    return res.status(400).json({ error: 'File size exceeds 5 MB limit. Please upload a file smaller than 5 MB.' });
  }

  const student = (data.students || []).find(s => s.id === studentId);
  const studentName = student ? student.name : 'Student';

  // Automatically update student profile marks based on document category & score
  let updatedScoreMsg = '';
  if (student && score !== undefined && score !== null && score !== '') {
    const numericScore = parseFloat(score);
    if (!isNaN(numericScore)) {
      if (category === '10th_marksheet') {
        student.class10Pct = numericScore;
        updatedScoreMsg = `Class 10th Score updated to ${numericScore}%`;
      } else if (category === '12th_marksheet') {
        student.class12Pct = numericScore;
        updatedScoreMsg = `Class 12th Score updated to ${numericScore}%`;
      } else if (category === 'degree_certificate') {
        student.cgpa = numericScore;
        updatedScoreMsg = `Graduation CGPA updated to ${numericScore}`;
      }
    }
  }

  // Format file size
  let fileSizeFormatted = '1.2 MB';
  if (fileSize) {
    if (fileSize < 1024 * 1024) {
      fileSizeFormatted = (fileSize / 1024).toFixed(1) + ' KB';
    } else {
      fileSizeFormatted = (fileSize / (1024 * 1024)).toFixed(2) + ' MB';
    }
  }

  const newDoc = {
    id: 'DOC' + String(Date.now()).slice(-6),
    studentId,
    studentName,
    category: category || 'other',
    title,
    fileName: fileName || `${title.toLowerCase().replace(/\s+/g, '_')}.pdf`,
    fileType: fileType || 'application/pdf',
    fileSize: fileSize || 1500000,
    fileSizeFormatted,
    fileData: fileData || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    uploadDate: new Date().toISOString().split('T')[0],
    status: 'Pending Verification',
    notes: notes || 'Uploaded by candidate • Pending Admin Approval',
    extractedScore: score || null
  };

  if (!data.documents) data.documents = [];
  data.documents.unshift(newDoc);
  writeData(data);

  res.status(201).json({ ...newDoc, updatedScoreMsg: 'Document uploaded and submitted for Admin Approval!', student });
});

app.put('/api/documents/:id/status', (req, res) => {
  const data = readData();
  const doc = (data.documents || []).find(d => d.id === req.params.id);
  if (!doc) {
    return res.status(404).json({ error: 'Document not found' });
  }

  const newStatus = req.body.status || 'Verified';
  doc.status = newStatus;
  if (req.body.notes) doc.notes = req.body.notes;

  // If Admin Approves & Verifies document, sync score to student profile
  const { syncScore } = req.body;
  let updatedScoreMsg = '';
  const targetScore = syncScore || doc.extractedScore;

  if (newStatus === 'Verified' && targetScore !== undefined && targetScore !== null && targetScore !== '') {
    const numericScore = parseFloat(targetScore);
    if (!isNaN(numericScore)) {
      const student = (data.students || []).find(s => s.id === doc.studentId);
      if (student) {
        if (doc.category === '10th_marksheet') {
          student.class10Pct = numericScore;
          updatedScoreMsg = `Class 10th score verified & updated to ${numericScore}%`;
        } else if (doc.category === '12th_marksheet') {
          student.class12Pct = numericScore;
          updatedScoreMsg = `Class 12th score verified & updated to ${numericScore}%`;
        } else if (doc.category === 'degree_certificate') {
          student.cgpa = numericScore;
          updatedScoreMsg = `CGPA verified & updated to ${numericScore}`;
        }
        doc.extractedScore = numericScore;
      }
    }
  }

  writeData(data);
  res.json({ doc, updatedScoreMsg });
});

app.delete('/api/documents/:id', (req, res) => {
  const data = readData();
  const index = (data.documents || []).findIndex(d => d.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Document not found' });
  }

  const deletedDoc = data.documents.splice(index, 1)[0];
  writeData(data);
  res.json({ success: true, deletedDoc });
});

// Start Server
app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(` Enterprise 4-Panel Placement Platform Active`);
  console.log(` Listening on: http://localhost:${PORT}`);
  console.log(`=================================================`);
});
