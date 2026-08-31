/* Recruiter / Company Panel Logic & Views */

const RecruiterPortal = {
  // 1. RECRUITER DASHBOARD
  async renderDashboardView(companyId) {
    const container = document.getElementById('viewContainer');
    container.innerHTML = `<div class="loading-state">Loading Recruiter Portal...</div>`;

    try {
      const companies = await API.getCompanies();
      const currentComp = companies.find(c => c.id === companyId) || companies[0];
      const drives = await API.getDrives({ companyId: currentComp.id });
      const apps = await API.getApplications({ company: currentComp.name });
      const interviews = await API.getInterviews({ company: currentComp.name });

      const totalApplicants = apps.length;
      const shortlistedCount = apps.filter(a => a.status === 'Shortlisted' || a.status === 'Technical Interview').length;
      const selectedCount = apps.filter(a => a.status === 'Selected' || a.status === 'Offer Accepted').length;

      let activeDrivesHtml = drives.map(d => `
        <div class="panel-card" style="margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <h3 style="color: #fff;">${d.role}</h3>
              <p style="color: var(--text-muted); font-size: 0.85rem;">CTC: <strong style="color: var(--success);">${d.ctc}</strong> • Min CGPA: ${d.minCgpa}</p>
            </div>
            ${renderStatusBadge(d.status)}
          </div>
          <div style="display: flex; gap: 12px; margin-top: 14px;">
            <button class="btn btn-secondary btn-sm" onclick="App.navigateTo('recruiter-applicants', { driveId: '${d.id}' })">
              <i class="ri-user-shared-line"></i> View Applicants (${apps.filter(a => a.driveId === d.id).length})
            </button>
            <button class="btn btn-primary btn-sm" onclick="RecruiterPortal.openScheduleModal('${d.id}', '${d.company}')">
              <i class="ri-calendar-event-line"></i> Schedule Interview
            </button>
          </div>
        </div>
      `).join('');

      container.innerHTML = `
        <div class="page-header">
          <div class="page-title">
            <h2>${currentComp.name} Recruiter Workspace</h2>
            <p>Manage job drive postings, inspect candidate resumes, shortlist applicants, and conduct interviews.</p>
          </div>
          <button class="btn btn-primary" onclick="RecruiterPortal.openNewDriveModal('${currentComp.id}', '${currentComp.name}')">
            <i class="ri-add-line"></i> Create New Drive
          </button>
        </div>

        <div class="metrics-grid">
          ${renderMetricCard('Active Drives', drives.length, `${currentComp.name} Drives`, 'ri-briefcase-line', 'icon-purple')}
          ${renderMetricCard('Total Applicants', totalApplicants, 'Candidates Applied', 'ri-team-line', 'icon-indigo')}
          ${renderMetricCard('Shortlisted', shortlistedCount, 'Passed Initial Screening', 'ri-user-star-line', 'icon-cyan')}
          ${renderMetricCard('Selected Offers', selectedCount, 'Accepted / Issued Offers', 'ri-trophy-line', 'icon-emerald')}
        </div>

        <div class="panel-card">
          <div class="panel-title">
            <h3><i class="ri-building-line" style="color: var(--primary);"></i> Active Placement Drives</h3>
          </div>
          <div>
            ${activeDrivesHtml || '<p style="color: var(--text-muted);">No active drives posted yet.</p>'}
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="error-state">Failed to load recruiter dashboard: ${err.message}</div>`;
    }
  },

  // 2. VIEW APPLICANTS & RESUME REVIEWER
  async renderApplicantsView(params = {}) {
    const container = document.getElementById('viewContainer');
    container.innerHTML = `<div class="loading-state">Loading Candidates...</div>`;

    try {
      const apps = await API.getApplications(params);
      const students = await API.getStudents();

      let rowsHtml = '';
      if (!apps.length) {
        rowsHtml = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No candidates have applied to this drive yet.</td></tr>`;
      } else {
        rowsHtml = apps.map(a => {
          const student = students.find(s => s.id === a.studentId) || {};
          return `
            <tr>
              <td><strong>${a.studentId}</strong></td>
              <td>
                <div style="font-weight: 600; color: #fff;">${student.name || a.studentId}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">${student.email || ''}</div>
              </td>
              <td>${student.branch || '-'}</td>
              <td><span style="color: var(--accent-cyan); font-weight: 700;">${student.cgpa || '-'}</span></td>
              <td>${renderStatusBadge(a.status)}</td>
              <td>
                <div style="display: flex; gap: 6px; flex-wrap: wrap;">
                  <button class="btn btn-secondary btn-sm" onclick="RecruiterPortal.viewCandidateResume('${a.studentId}')">
                    <i class="ri-file-pdf-line"></i> View Resume
                  </button>
                  <button class="btn btn-secondary btn-sm" onclick="RecruiterPortal.viewCandidateDocs('${a.studentId}')">
                    <i class="ri-folder-user-line"></i> All Docs
                  </button>
                </div>
              </td>
              <td>
                <div style="display: flex; gap: 6px;">
                  <button class="btn btn-primary btn-sm" onclick="RecruiterPortal.handleShortlist('${a.id}')">
                    Shortlist
                  </button>
                  <button class="btn btn-secondary btn-sm" onclick="RecruiterPortal.openScheduleModal('${a.driveId}', '${a.company}', '${a.studentId}', '${student.name}')">
                    Schedule
                  </button>
                </div>
              </td>
            </tr>
          `;
        }).join('');
      }

      container.innerHTML = `
        <div class="page-header">
          <div class="page-title">
            <h2>Applicant Resume Desk</h2>
            <p>Review candidate academic scores, inspect verified resumes, and schedule interviews.</p>
          </div>
        </div>

        <div class="panel-card">
          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Roll No</th>
                  <th>Candidate Name</th>
                  <th>Branch</th>
                  <th>CGPA</th>
                  <th>Status</th>
                  <th>Resume</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="error-state">Failed to load applicants: ${err.message}</div>`;
    }
  },

  async handleShortlist(appId) {
    try {
      await API.updateApplicationStatus(appId, {
        status: 'Shortlisted',
        stage: 'Online Assessment',
        note: 'Shortlisted by Recruiter for Interview'
      });
      showToast('Candidate shortlisted successfully!', 'success');
      this.renderApplicantsView();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  openNewDriveModal(companyId, companyName) {
    const formHtml = `
      <form onsubmit="RecruiterPortal.handleCreateDrive(event, '${companyId}', '${companyName}')">
        <div class="form-group">
          <label>Company Name</label>
          <input type="text" class="form-control" value="${companyName}" disabled>
        </div>
        <div class="form-group">
          <label>Job Designation / Role</label>
          <input type="text" id="recRole" class="form-control" placeholder="e.g. Cloud Solutions Architect" required>
        </div>
        <div class="form-group" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label>CTC Package</label>
            <input type="text" id="recCtc" class="form-control" placeholder="e.g. ₹20.0 LPA" required>
          </div>
          <div>
            <label>Min CGPA Required</label>
            <input type="number" step="0.1" id="recMinCgpa" class="form-control" value="7.5" required>
          </div>
        </div>
        <div class="form-group" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label>Max Backlogs Allowed</label>
            <input type="number" id="recMaxBacklogs" class="form-control" value="0" required>
          </div>
          <div>
            <label>Deadline</label>
            <input type="date" id="recDeadline" class="form-control" required>
          </div>
        </div>
        <div class="form-group">
          <label>Job Description & Requirements</label>
          <textarea id="recDesc" class="form-control" rows="3" placeholder="Describe key responsibilities..." required></textarea>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px;">
          <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Publish Placement Drive</button>
        </div>
      </form>
    `;
    openModal('Create Recruiter Placement Drive', formHtml);
  },

  async handleCreateDrive(e, companyId, companyName) {
    e.preventDefault();
    const driveData = {
      companyId,
      company: companyName,
      role: document.getElementById('recRole').value,
      ctc: document.getElementById('recCtc').value,
      minCgpa: parseFloat(document.getElementById('recMinCgpa').value),
      maxBacklogs: parseInt(document.getElementById('recMaxBacklogs').value, 10),
      deadline: document.getElementById('recDeadline').value,
      description: document.getElementById('recDesc').value,
      eligibleBranches: ['Computer Science', 'Information Technology', 'Electronics & Comm']
    };

    try {
      await API.createDrive(driveData);
      showToast('Recruitment Drive created and live!', 'success');
      closeModal();
      this.renderDashboardView(companyId);
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  openScheduleModal(driveId, company, studentId = 'STU004', studentName = 'Ananya Roy') {
    const formHtml = `
      <form onsubmit="RecruiterPortal.handleScheduleInterview(event, '${driveId}', '${company}')">
        <div class="form-group">
          <label>Candidate Student ID</label>
          <input type="text" id="intStudentId" class="form-control" value="${studentId}" required>
        </div>
        <div class="form-group">
          <label>Candidate Name</label>
          <input type="text" id="intStudentName" class="form-control" value="${studentName}" required>
        </div>
        <div class="form-group">
          <label>Interview Round</label>
          <input type="text" id="intRound" class="form-control" value="Technical Interview 1 (Coding & System Design)">
        </div>
        <div class="form-group" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label>Interview Date</label>
            <input type="date" id="intDate" class="form-control" required>
          </div>
          <div>
            <label>Time Slot</label>
            <input type="text" id="intTime" class="form-control" value="11:00 AM - 12:00 PM" required>
          </div>
        </div>
        <div class="form-group">
          <label>Virtual Meeting Link (Google Meet / MS Teams)</label>
          <input type="url" id="intLink" class="form-control" value="https://meet.google.com/demo-slot" required>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px;">
          <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Send Interview Slot</button>
        </div>
      </form>
    `;
    openModal('Schedule Candidate Interview', formHtml);
  },

  async handleScheduleInterview(e, driveId, company) {
    e.preventDefault();
    const interviewData = {
      driveId,
      company,
      studentId: document.getElementById('intStudentId').value,
      studentName: document.getElementById('intStudentName').value,
      roundName: document.getElementById('intRound').value,
      date: document.getElementById('intDate').value,
      time: document.getElementById('intTime').value,
      meetingLink: document.getElementById('intLink').value,
      interviewer: `${company} Recruiting Lead`
    };

    try {
      await API.scheduleInterview(interviewData);
      showToast('Interview slot scheduled & student notified!', 'success');
      closeModal();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async viewCandidateDocs(studentId) {
    try {
      const students = await API.getStudents();
      const student = students.find(s => s.id === studentId);
      const docs = await API.getDocuments({ studentId });

      let docsHtml = !docs.length ? `
        <p style="color: var(--text-muted); text-align: center; padding: 20px;">No uploaded credentials found for candidate ${student ? student.name : studentId}.</p>
      ` : docs.map(d => `
        <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); padding: 12px 16px; border-radius: var(--radius-md); margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h4 style="color: #fff; font-size: 0.9rem;">${d.title}</h4>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${d.fileName} • ${d.fileSizeFormatted || '1.5 MB'} • Uploaded: ${d.uploadDate}</div>
          </div>
          <div style="display: flex; gap: 8px; align-items: center;">
            <span class="badge ${d.status === 'Verified' ? 'badge-placed' : (d.status === 'Rejected' ? 'badge-unplaced' : 'badge-inprogress')}">
              ${d.status === 'Verified' ? 'Verified by Admin' : d.status}
            </span>
            <button class="btn btn-secondary btn-sm" onclick="StudentPortal.previewDocument('${d.id}')">
              <i class="ri-eye-line"></i> Inspect
            </button>
          </div>
        </div>
      `).join('');

      openModal(`Candidate Verified Credentials: ${student ? student.name : studentId}`, `
        <div style="max-height: 500px; overflow-y: auto;">
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px;">Candidate's verified documents (10th/12th marksheets, Degree, Identity, and Internship/Course Certificates):</p>
          ${docsHtml}
        </div>
      `);
    } catch (err) {
      showToast('Failed to load candidate documents', 'error');
    }
  },

  async viewCandidateResume(studentId) {
    try {
      const students = await API.getStudents();
      const student = students.find(s => s.id === studentId);
      if (!student) return showToast('Candidate record not found', 'error');

      const docs = await API.getDocuments({ studentId });
      const resumeDoc = docs.find(d => d.category === 'resume' || d.title.toLowerCase().includes('resume'));
      const resumePdfUrl = (resumeDoc && resumeDoc.fileData) ? resumeDoc.fileData : (student.resumeUrl && !student.resumeUrl.includes('example.com') ? student.resumeUrl : null);

      const contentHtml = `
        <div style="padding: 10px;">
          <!-- Candidate Summary Banner -->
          <div style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.1)); border: 1px solid var(--border-glow); padding: 18px; border-radius: var(--radius-lg); margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <h3 style="color: #fff; font-size: 1.3rem; font-weight: 700;">${student.name}</h3>
                <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 2px;">${student.branch} • Candidate Roll ID: <strong>${student.id}</strong> • Class of ${student.graduationYear || 2026}</p>
              </div>
              <span class="badge ${student.status === 'Placed' ? 'badge-placed' : 'badge-inprogress'}">${student.status}</span>
            </div>

            <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-top: 16px; pt: 14px; border-top: 1px solid var(--border-color);">
              <div><span style="font-size: 0.75rem; color: var(--text-muted);">Current CGPA:</span> <div style="font-size: 1.1rem; color: var(--accent-cyan); font-weight: 700;">${student.cgpa || '-'}</div></div>
              <div><span style="font-size: 0.75rem; color: var(--text-muted);">10th Score:</span> <div style="font-size: 1.1rem; color: var(--success); font-weight: 700;">${student.class10Pct || 92.0}%</div></div>
              <div><span style="font-size: 0.75rem; color: var(--text-muted);">12th Score:</span> <div style="font-size: 1.1rem; color: var(--success); font-weight: 700;">${student.class12Pct || 90.0}%</div></div>
              <div><span style="font-size: 0.75rem; color: var(--text-muted);">Backlogs:</span> <div style="font-size: 1.1rem; color: ${student.backlogs === 0 ? 'var(--success)' : 'var(--danger)'}; font-weight: 700;">${student.backlogs}</div></div>
            </div>

            <div style="margin-top: 14px;">
              <span style="font-size: 0.75rem; color: var(--text-muted);">Verified Candidate Skills:</span>
              <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: 4px;">
                ${(student.skills || ['Node.js', 'React', 'Python', 'SQL']).map(sk => `<span class="drive-tag">${sk}</span>`).join('')}
              </div>
            </div>
          </div>

          <!-- Document Viewer / Verification Card -->
          <div style="border: 1px solid var(--border-color); border-radius: var(--radius-md); background: #0f172a; overflow: hidden;">
            ${resumePdfUrl ? `
              <object data="${resumePdfUrl}" type="application/pdf" style="width: 100%; height: 400px; border: none; display: block;">
                <div style="padding: 24px; text-align: center;">
                  <i class="ri-file-text-fill" style="font-size: 3rem; color: var(--primary);"></i>
                  <h4 style="color: #fff; margin-top: 10px;">${student.name}_Official_Resume.pdf</h4>
                  <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 4px;">Verified by Training & Placement Cell</p>
                  <a href="${resumePdfUrl}" target="_blank" download="${student.name}_Resume.pdf" class="btn btn-primary btn-sm" style="margin-top: 14px;">
                    <i class="ri-download-line"></i> Download Verified Resume PDF
                  </a>
                </div>
              </object>
            ` : `
              <div style="padding: 32px; text-align: center; background: radial-gradient(circle at center, rgba(99, 102, 241, 0.15) 0%, rgba(15, 23, 42, 0.95) 100%);">
                <div style="width: 64px; height: 64px; background: rgba(99, 102, 241, 0.2); border: 2px solid var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 14px; font-size: 2rem; color: #fff;">
                  <i class="ri-file-pdf-fill"></i>
                </div>
                <div style="display: inline-block; background: rgba(16, 185, 129, 0.15); color: var(--success); border: 1px solid var(--success); padding: 4px 14px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; margin-bottom: 12px;">
                  <i class="ri-shield-check-fill"></i> VERIFIED RESUME CREDENTIAL
                </div>
                <h4 style="color: #fff; font-size: 1.15rem; margin-bottom: 6px;">${student.name}_Official_Resume.pdf</h4>
                <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 16px;">
                  Branch: ${student.branch} • Academic CGPA: ${student.cgpa} • Email: ${student.email}
                </p>
                <div style="display: flex; gap: 10px; justify-content: center;">
                  <button class="btn btn-primary btn-sm" onclick="RecruiterPortal.viewCandidateDocs('${student.id}')">
                    <i class="ri-folder-user-line"></i> Inspect Candidate Documents & Certificates
                  </button>
                </div>
              </div>
            `}
          </div>
        </div>
      `;

      openModal(`Candidate Profile & Resume Document: ${student.name}`, contentHtml);
    } catch (err) {
      showToast('Failed to load candidate resume', 'error');
    }
  }
};


