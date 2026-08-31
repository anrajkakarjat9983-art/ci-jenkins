/* Admin Panel Logic & View Renderers - Complete 8 Metric Cards & Modules */

const AdminPortal = {
  // 1. ANALYTICS OVERVIEW DASHBOARD WITH ALL 8 METRIC CARDS
  async renderAnalyticsView() {
    const container = document.getElementById('viewContainer');
    container.innerHTML = `<div class="loading-state"><i class="ri-loader-4-line ri-spin"></i> Loading Executive Dashboard...</div>`;

    try {
      const stats = await API.getStats();
      const drives = await API.getDrives();
      const placements = await API.getPlacements();

      let branchBarsHtml = stats.branchBreakdown.map(b => `
        <div class="chart-bar-item">
          <div class="chart-label">
            <span>${b.branch}</span>
            <bold>${b.placed} / ${b.total} Placed (${b.rate}%)</bold>
          </div>
          <div class="chart-track">
            <div class="chart-fill" style="width: ${b.rate}%;"></div>
          </div>
        </div>
      `).join('');

      let activeDrivesListHtml = drives.slice(0, 3).map(d => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--border-color);">
          <div>
            <strong style="color: #fff;">${d.company}</strong>
            <div style="font-size: 0.8rem; color: var(--text-muted);">${d.role} • ${d.location}</div>
          </div>
          <div style="text-align: right;">
            <span style="color: var(--success); font-weight: 700;">${d.ctc}</span>
            <div style="font-size: 0.75rem; color: var(--text-dim);">Min CGPA: ${d.minCgpa}</div>
          </div>
        </div>
      `).join('');

      container.innerHTML = `
        <div class="page-header">
          <div class="page-title">
            <h2>Campus Placement Executive Dashboard</h2>
            <p>Real-time campus placement metrics, hiring drive statistics, and branch performance.</p>
          </div>
          <div style="display: flex; gap: 12px;">
            <a href="${API.exportStudentsUrl()}" class="btn btn-secondary">
              <i class="ri-file-download-line"></i> Export Reports
            </a>
            <button class="btn btn-primary" onclick="AdminPortal.openNewDriveModal()">
              <i class="ri-add-line"></i> New Placement Drive
            </button>
          </div>
        </div>

        <!-- 8 Required Metric Cards Grid -->
        <div class="metrics-grid">
          ${renderMetricCard('1. Total Students', stats.totalStudents, 'Enrolled Candidates', 'ri-group-line', 'icon-indigo')}
          ${renderMetricCard('2. Registered Students', stats.registeredStudents, 'Profiles & Resumes Complete', 'ri-user-check-line', 'icon-purple')}
          ${renderMetricCard('3. Active Companies', stats.activeCompanies, 'Approved Recruiter Partners', 'ri-building-4-line', 'icon-cyan')}
          ${renderMetricCard('4. Active Drives', stats.activeDrives, 'Live Hiring Drives', 'ri-briefcase-4-line', 'icon-amber')}
          ${renderMetricCard('5. Total Applications', stats.totalApplications, 'Submitted Applications', 'ri-send-plane-line', 'icon-indigo')}
          ${renderMetricCard('6. Shortlisted Candidates', stats.shortlistedStudents, 'In Selection Rounds', 'ri-user-star-line', 'icon-purple')}
          ${renderMetricCard('7. Students Placed', stats.placedStudents, `Highest: ${stats.highestPackage}`, 'ri-trophy-line', 'icon-emerald')}
          ${renderMetricCard('8. Placement Rate', `${stats.placementRate}%`, `Avg Package: ${stats.avgPackage}`, 'ri-pie-chart-2-line', 'icon-emerald')}
        </div>

        <!-- Dashboard Main Grid -->
        <div class="dashboard-row">
          <div class="panel-card">
            <div class="panel-title">
              <h3><i class="ri-bar-chart-grouped-line" style="color: var(--primary);"></i> Branch-Wise Placement Breakdown</h3>
              <span style="font-size: 0.8rem; color: var(--text-muted);">Batch 2026</span>
            </div>
            <div class="branch-chart-list">
              ${branchBarsHtml}
            </div>
          </div>

          <div class="panel-card">
            <div class="panel-title">
              <h3><i class="ri-briefcase-4-line" style="color: var(--secondary);"></i> Active Placement Drives</h3>
              <button class="btn btn-secondary btn-sm" onclick="App.navigateTo('admin-drives')">View All</button>
            </div>
            <div>
              ${activeDrivesListHtml || '<p style="color: var(--text-muted);">No active drives.</p>'}
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="error-state">Failed to load dashboard: ${err.message}</div>`;
    }
  },

  // 2. RECRUITMENT DRIVES MANAGEMENT VIEW
  async renderDrivesView() {
    const container = document.getElementById('viewContainer');
    container.innerHTML = `<div class="loading-state">Loading Drives...</div>`;

    try {
      const drives = await API.getDrives();

      let cardsHtml = drives.map(d => `
        <div class="drive-card">
          <div class="drive-header">
            <div class="company-title">
              <h4>${d.company}</h4>
              <p>${d.role}</p>
            </div>
            <div class="ctc-badge">${d.ctc}</div>
          </div>

          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 14px;">
            ${d.description}
          </p>

          <div class="drive-requirements">
            <div class="req-item"><i class="ri-map-pin-line"></i> <span>Location: ${d.location}</span></div>
            <div class="req-item"><i class="ri-award-line"></i> <span>Min CGPA: <strong>${d.minCgpa}</strong></span></div>
            <div class="req-item"><i class="ri-shield-cross-line"></i> <span>Max Backlogs Allowed: <strong>${d.maxBacklogs}</strong></span></div>
            <div class="req-item"><i class="ri-calendar-event-line"></i> <span>Deadline: ${d.deadline}</span></div>
          </div>

          <div class="drive-tags">
            ${d.eligibleBranches.map(b => `<span class="drive-tag">${b}</span>`).join('')}
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between; pt: 12px; border-top: 1px solid var(--border-color);">
            ${renderStatusBadge(d.status)}
            <div style="display: flex; gap: 8px;">
              <button class="btn btn-secondary btn-sm" onclick="AdminPortal.toggleDriveStatus('${d.id}', '${d.status === 'Active' ? 'Closed' : 'Active'}')">
                ${d.status === 'Active' ? 'Close Drive' : 'Re-Open'}
              </button>
              <button class="btn btn-primary btn-sm" onclick="App.navigateTo('admin-applications', { driveId: '${d.id}' })">
                Applicants
              </button>
            </div>
          </div>
        </div>
      `).join('');

      container.innerHTML = `
        <div class="page-header">
          <div class="page-title">
            <h2>Placement & Hiring Drives</h2>
            <p>Manage visiting companies, job postings, eligibility criteria, and drive deadlines.</p>
          </div>
          <button class="btn btn-primary" onclick="AdminPortal.openNewDriveModal()">
            <i class="ri-add-line"></i> Post New Drive
          </button>
        </div>

        <div class="drives-grid">
          ${cardsHtml}
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="error-state">Failed to load drives: ${err.message}</div>`;
    }
  },

  openNewDriveModal() {
    const formHtml = `
      <form onsubmit="AdminPortal.handleCreateDrive(event)">
        <div class="form-group">
          <label>Company Name</label>
          <input type="text" id="driveCompany" class="form-control" placeholder="e.g. Amazon, Oracle, Adobe" required>
        </div>
        <div class="form-group">
          <label>Job Role / Designation</label>
          <input type="text" id="driveRole" class="form-control" placeholder="e.g. Software Development Engineer 1" required>
        </div>
        <div class="form-group" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label>CTC Package</label>
            <input type="text" id="driveCtc" class="form-control" placeholder="e.g. ₹18.0 LPA" required>
          </div>
          <div>
            <label>Min CGPA Requirement</label>
            <input type="number" step="0.1" id="driveMinCgpa" class="form-control" value="7.0" required>
          </div>
        </div>
        <div class="form-group" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label>Max Allowed Backlogs</label>
            <input type="number" id="driveMaxBacklogs" class="form-control" value="0" required>
          </div>
          <div>
            <label>Application Deadline</label>
            <input type="date" id="driveDeadline" class="form-control" required>
          </div>
        </div>
        <div class="form-group">
          <label>Eligible Branches (Comma Separated)</label>
          <input type="text" id="driveBranches" class="form-control" value="Computer Science, Information Technology, Electronics & Comm">
        </div>
        <div class="form-group">
          <label>Location</label>
          <input type="text" id="driveLocation" class="form-control" value="Bengaluru / Hyderabad">
        </div>
        <div class="form-group">
          <label>Job Description</label>
          <textarea id="driveDescription" class="form-control" rows="3" placeholder="Overview of role, responsibilities, and requirements..."></textarea>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px;">
          <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Publish Drive</button>
        </div>
      </form>
    `;
    openModal('Create New Placement Drive', formHtml);
  },

  async handleCreateDrive(e) {
    e.preventDefault();
    const driveData = {
      company: document.getElementById('driveCompany').value,
      role: document.getElementById('driveRole').value,
      ctc: document.getElementById('driveCtc').value,
      minCgpa: parseFloat(document.getElementById('driveMinCgpa').value),
      maxBacklogs: parseInt(document.getElementById('driveMaxBacklogs').value, 10),
      deadline: document.getElementById('driveDeadline').value,
      eligibleBranches: document.getElementById('driveBranches').value.split(',').map(s => s.trim()),
      location: document.getElementById('driveLocation').value,
      description: document.getElementById('driveDescription').value
    };

    try {
      await API.createDrive(driveData);
      showToast('Placement Drive published successfully!', 'success');
      closeModal();
      this.renderDrivesView();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async toggleDriveStatus(id, newStatus) {
    try {
      await API.updateDrive(id, { status: newStatus });
      showToast(`Drive status updated to ${newStatus}`, 'success');
      this.renderDrivesView();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  // 3. STUDENT DIRECTORY VIEW
  async renderStudentsView() {
    const container = document.getElementById('viewContainer');
    container.innerHTML = `<div class="loading-state">Loading Student Master Directory...</div>`;

    try {
      const students = await API.getStudents();

      container.innerHTML = `
        <div class="page-header">
          <div class="page-title">
            <h2>Student Master Directory</h2>
            <p>Filter candidates, view CGPA & backlog details, and export student placement reports.</p>
          </div>
          <a href="${API.exportStudentsUrl()}" class="btn btn-secondary">
            <i class="ri-file-download-line"></i> Export CSV Report
          </a>
        </div>

        <div class="filter-bar">
          <div class="search-input-box">
            <i class="ri-search-line search-icon"></i>
            <input type="text" id="studentSearchInput" placeholder="Search by Student Name, ID, or Email..." onkeyup="AdminPortal.filterStudentTable()">
          </div>
          <select id="branchFilter" class="select-filter" onchange="AdminPortal.filterStudentTable()">
            <option value="">All Branches</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Information Technology">Information Technology</option>
            <option value="Electronics & Comm">Electronics & Comm</option>
            <option value="Mechanical Engineering">Mechanical Engineering</option>
          </select>
          <select id="statusFilter" class="select-filter" onchange="AdminPortal.filterStudentTable()">
            <option value="">All Placement Statuses</option>
            <option value="Placed">Placed</option>
            <option value="Unplaced">Unplaced</option>
            <option value="Shortlisted">Shortlisted</option>
            <option value="In Progress">In Progress</option>
          </select>
        </div>

        <div class="panel-card">
          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Name</th>
                  <th>Branch</th>
                  <th>CGPA</th>
                  <th>Backlogs</th>
                  <th>Status</th>
                  <th>Placed Company</th>
                  <th>Offer Package</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="studentTableBody">
                ${this.buildStudentTableRows(students)}
              </tbody>
            </table>
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="error-state">Failed to load students: ${err.message}</div>`;
    }
  },

  buildStudentTableRows(students) {
    if (!students || !students.length) {
      return `<tr><td colspan="9" style="text-align: center; color: var(--text-muted);">No student records found.</td></tr>`;
    }

    return students.map(s => `
      <tr>
        <td><strong>${s.id}</strong></td>
        <td>
          <div style="font-weight: 600; color: #fff;">${s.name}</div>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${s.email}</div>
        </td>
        <td>${s.branch}</td>
        <td><span style="color: var(--accent-cyan); font-weight: 700;">${s.cgpa}</span></td>
        <td>${s.backlogs === 0 ? '<span style="color: var(--success);">0</span>' : `<span style="color: var(--danger); font-weight: 700;">${s.backlogs}</span>`}</td>
        <td>${renderStatusBadge(s.status)}</td>
        <td>${s.placedCompany || '-'}</td>
        <td><strong style="color: var(--success);">${s.offerPackage || '-'}</strong></td>
        <td>
          <div style="display: flex; gap: 6px;">
            <button class="btn btn-secondary btn-sm" onclick="AdminPortal.openEditStudentModal('${s.id}', '${s.name}', ${s.cgpa}, ${s.backlogs}, '${s.status}')">
              Edit
            </button>
            <button class="btn btn-secondary btn-sm" onclick="AdminPortal.openStudentDocumentsModal('${s.id}')">
              <i class="ri-folder-open-line"></i> Docs
            </button>
          </div>
        </td>
      </tr>
    `).join('');
  },

  async openStudentDocumentsModal(studentId) {
    try {
      const students = await API.getStudents();
      const student = students.find(s => s.id === studentId);
      const docs = await API.getDocuments({ studentId });

      let docsHtml = !docs.length ? `
        <p style="color: var(--text-muted); text-align: center; padding: 20px;">No uploaded documents found for ${student ? student.name : studentId}.</p>
      ` : docs.map(d => {
        const isMarkDoc = ['10th_marksheet', '12th_marksheet', 'degree_certificate'].includes(d.category);
        let defaultScore = d.extractedScore || '';
        if (!defaultScore && student) {
          if (d.category === '10th_marksheet') defaultScore = student.class10Pct || 92.0;
          else if (d.category === '12th_marksheet') defaultScore = student.class12Pct || 90.0;
          else if (d.category === 'degree_certificate') defaultScore = student.cgpa || 8.5;
        }

        let badgeClass = 'badge-inprogress';
        if (d.status === 'Verified') badgeClass = 'badge-placed';
        else if (d.status === 'Rejected') badgeClass = 'badge-unplaced';

        return `
          <div style="background: rgba(255,255,255,0.03); border: 1px solid var(--border-color); padding: 14px 16px; border-radius: var(--radius-md); margin-bottom: 12px;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <h4 style="color: #fff; font-size: 0.95rem; font-weight: 600;">${d.title}</h4>
                <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">${d.fileName} • ${d.fileSizeFormatted || '1.5 MB'} • Uploaded: ${d.uploadDate}</div>
              </div>
              <span class="badge ${badgeClass}">${d.status}</span>
            </div>

            ${isMarkDoc ? `
              <div style="margin-top: 12px; padding: 10px; background: rgba(0,0,0,0.2); border-radius: var(--radius-md); display: flex; align-items: center; justify-content: space-between; gap: 10px;">
                <div style="font-size: 0.8rem; color: var(--text-muted); display: flex; align-items: center; gap: 6px;">
                  <i class="ri-award-line" style="color: var(--warning);"></i> Score:
                  <input type="number" step="0.01" id="scoreInput_${d.id}" value="${defaultScore}" class="form-control" style="width: 90px; padding: 4px 8px; font-size: 0.85rem; font-weight: 700; color: var(--success);" placeholder="Score">
                  <span>${d.category === 'degree_certificate' ? 'CGPA' : '%'}</span>
                </div>
              </div>
            ` : ''}

            <div style="margin-top: 12px; display: flex; justify-content: space-between; align-items: center;">
              <button class="btn btn-secondary btn-sm" onclick="StudentPortal.previewDocument('${d.id}')">
                <i class="ri-eye-line"></i> Preview File
              </button>
              <div style="display: flex; gap: 8px;">
                ${d.status !== 'Verified' ? `
                  <button class="btn btn-primary btn-sm" onclick="AdminPortal.approveDocument('${d.id}', '${studentId}')">
                    <i class="ri-checkbox-circle-fill"></i> Approve & Verify
                  </button>
                ` : '<span style="font-size: 0.8rem; color: var(--success); font-weight: 600;"><i class="ri-checkbox-circle-fill"></i> Approved</span>'}
                ${d.status !== 'Rejected' ? `
                  <button class="btn btn-danger btn-sm" onclick="AdminPortal.rejectDocument('${d.id}', '${studentId}')">
                    <i class="ri-close-circle-fill"></i> Reject
                  </button>
                ` : ''}
              </div>
            </div>
            ${d.notes ? `<div style="margin-top: 8px; font-size: 0.75rem; color: var(--text-dim);"><i class="ri-file-text-line"></i> Notes: ${d.notes}</div>` : ''}
          </div>
        `;
      }).join('');

      openModal(`Candidate Document Verification: ${student ? student.name : studentId}`, `
        <div style="max-height: 520px; overflow-y: auto;">
          <div style="background: rgba(99, 102, 241, 0.1); border: 1px solid var(--border-glow); padding: 12px; border-radius: var(--radius-md); margin-bottom: 16px;">
            <strong style="color: #fff; font-size: 0.85rem;"><i class="ri-user-star-line" style="color: var(--primary);"></i> Current Student Profile Scores:</strong>
            <div style="display: flex; gap: 16px; margin-top: 6px; font-size: 0.8rem; color: var(--text-muted);">
              <span>10th Score: <strong style="color: var(--success);">${student ? student.class10Pct || '-' : '-'}%</strong></span>
              <span>12th Score: <strong style="color: var(--success);">${student ? student.class12Pct || '-' : '-'}%</strong></span>
              <span>CGPA: <strong style="color: var(--accent-cyan);">${student ? student.cgpa || '-' : '-'}</strong></span>
            </div>
          </div>
          ${docsHtml}
        </div>
      `);
    } catch (err) {
      showToast('Failed to load candidate documents', 'error');
    }
  },

  // DEDICATED DOCUMENT APPROVALS DESK
  async renderDocApprovalsView(statusFilter = 'Pending Verification') {
    const container = document.getElementById('viewContainer');
    container.innerHTML = `<div class="loading-state">Loading Pending Document Approvals...</div>`;

    try {
      const documents = await API.getDocuments();
      const students = await API.getStudents();

      const pendingDocs = documents.filter(d => d.status === 'Pending Verification');
      const verifiedDocs = documents.filter(d => d.status === 'Verified');
      const rejectedDocs = documents.filter(d => d.status === 'Rejected');

      let filteredDocs = documents;
      if (statusFilter === 'Pending Verification') filteredDocs = pendingDocs;
      else if (statusFilter === 'Verified') filteredDocs = verifiedDocs;
      else if (statusFilter === 'Rejected') filteredDocs = rejectedDocs;

      const cardsHtml = !filteredDocs.length ? `
        <div class="panel-card" style="text-align: center; padding: 48px;">
          <i class="ri-checkbox-circle-line" style="font-size: 3.5rem; color: var(--success);"></i>
          <h3 style="margin-top: 14px; color: #fff;">No Documents Awaiting Approval</h3>
          <p style="color: var(--text-muted); margin-top: 6px;">All submitted candidate marksheets and certificates have been verified by Admin.</p>
        </div>
      ` : filteredDocs.map(d => {
        const student = students.find(s => s.id === d.studentId);
        const isMarkDoc = ['10th_marksheet', '12th_marksheet', 'degree_certificate'].includes(d.category);
        let defaultScore = d.extractedScore || '';
        if (!defaultScore && student) {
          if (d.category === '10th_marksheet') defaultScore = student.class10Pct || 92.0;
          else if (d.category === '12th_marksheet') defaultScore = student.class12Pct || 90.0;
          else if (d.category === 'degree_certificate') defaultScore = student.cgpa || 8.5;
        }

        let badgeClass = 'badge-inprogress';
        if (d.status === 'Verified') badgeClass = 'badge-placed';
        else if (d.status === 'Rejected') badgeClass = 'badge-unplaced';

        return `
          <div class="panel-card" style="margin-bottom: 16px; border-left: 4px solid ${d.status === 'Verified' ? 'var(--success)' : (d.status === 'Rejected' ? 'var(--danger)' : 'var(--warning)')};">
            <div style="display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <span class="badge ${badgeClass}" style="margin-bottom: 6px;"><i class="${d.status === 'Verified' ? 'ri-checkbox-circle-fill' : 'ri-time-line'}"></i> ${d.status}</span>
                <h3 style="color: #fff; font-size: 1.1rem; font-weight: 700;">${d.title}</h3>
                <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 2px;">
                  Candidate: <strong style="color: #fff;">${d.studentName}</strong> (${d.studentId}) • Branch: ${student ? student.branch : '-'} • File: <code>${d.fileName}</code> (${d.fileSizeFormatted || '1.5 MB'})
                </p>
              </div>
              <div style="text-align: right; font-size: 0.8rem; color: var(--text-dim);">
                Uploaded: ${d.uploadDate}
              </div>
            </div>

            <div style="margin-top: 14px; padding: 12px; background: rgba(0,0,0,0.2); border-radius: var(--radius-md); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
              ${isMarkDoc ? `
                <div style="display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: var(--text-muted);">
                  <i class="ri-award-line" style="color: var(--warning);"></i> Declared / Extracted Score:
                  <input type="number" step="0.01" id="deskScore_${d.id}" value="${defaultScore}" class="form-control" style="width: 100px; padding: 4px 8px; font-weight: 700; color: var(--success);" placeholder="Score">
                  <span>${d.category === 'degree_certificate' ? 'CGPA' : '%'}</span>
                </div>
              ` : `<div style="font-size: 0.825rem; color: var(--text-muted);"><i class="ri-information-line"></i> Category: <strong>${d.category}</strong></div>`}

              <div style="display: flex; gap: 8px;">
                <button class="btn btn-secondary btn-sm" onclick="StudentPortal.previewDocument('${d.id}')">
                  <i class="ri-eye-line"></i> Preview File
                </button>
                ${d.status !== 'Verified' ? `
                  <button class="btn btn-primary btn-sm" onclick="AdminPortal.approveDocument('${d.id}', '${d.studentId}')">
                    <i class="ri-checkbox-circle-fill"></i> Approve & Verify
                  </button>
                ` : ''}
                ${d.status !== 'Rejected' ? `
                  <button class="btn btn-danger btn-sm" onclick="AdminPortal.rejectDocument('${d.id}', '${d.studentId}')">
                    <i class="ri-close-circle-fill"></i> Reject
                  </button>
                ` : ''}
              </div>
            </div>

            ${d.notes ? `<div style="margin-top: 8px; font-size: 0.75rem; color: var(--text-dim);"><i class="ri-file-text-line"></i> Verification Notes: ${d.notes}</div>` : ''}
          </div>
        `;
      }).join('');

      container.innerHTML = `
        <div class="page-header">
          <div class="page-title">
            <h2>Admin Candidate Document Verification Center</h2>
            <p>Review, verify, approve & reject student academic marksheets, identity documents, and certificates before placement eligibility.</p>
          </div>
        </div>

        <div class="metrics-grid">
          ${renderMetricCard('Pending Approvals', pendingDocs.length, 'Awaiting Admin Action', 'ri-time-line', 'icon-amber')}
          ${renderMetricCard('Verified Documents', verifiedDocs.length, 'Approved Credentials', 'ri-checkbox-circle-line', 'icon-emerald')}
          ${renderMetricCard('Rejected Documents', rejectedDocs.length, 'Resubmission Required', 'ri-close-circle-line', 'icon-purple')}
          ${renderMetricCard('Total Documents', documents.length, 'Candidate Vault', 'ri-folder-shield-2-line', 'icon-indigo')}
        </div>

        <div class="doc-filter-bar">
          <button class="doc-filter-pill ${statusFilter === 'Pending Verification' ? 'active' : ''}" onclick="AdminPortal.renderDocApprovalsView('Pending Verification')">
            <i class="ri-time-line"></i> Pending Approvals (${pendingDocs.length})
          </button>
          <button class="doc-filter-pill ${statusFilter === 'Verified' ? 'active' : ''}" onclick="AdminPortal.renderDocApprovalsView('Verified')">
            <i class="ri-checkbox-circle-line"></i> Approved & Verified (${verifiedDocs.length})
          </button>
          <button class="doc-filter-pill ${statusFilter === 'Rejected' ? 'active' : ''}" onclick="AdminPortal.renderDocApprovalsView('Rejected')">
            <i class="ri-close-circle-line"></i> Rejected (${rejectedDocs.length})
          </button>
          <button class="doc-filter-pill ${statusFilter === 'all' ? 'active' : ''}" onclick="AdminPortal.renderDocApprovalsView('all')">
            All Documents (${documents.length})
          </button>
        </div>

        <div>
          ${cardsHtml}
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="error-state">Failed to load document approvals: ${err.message}</div>`;
    }
  },

  async approveDocument(docId, studentId) {
    const input = document.getElementById(`deskScore_${docId}`) || document.getElementById(`scoreInput_${docId}`);
    const syncScore = input ? input.value : null;

    try {
      const res = await API.updateDocumentStatus(docId, 'Verified', 'Approved & Verified by Admin (Dr. V. K. Sharma)');
      if (syncScore) {
        const documents = await API.getDocuments({ studentId });
        const doc = documents.find(d => d.id === docId);
        const updateData = {};
        if (doc) {
          if (doc.category === '10th_marksheet') updateData.class10Pct = parseFloat(syncScore);
          else if (doc.category === '12th_marksheet') updateData.class12Pct = parseFloat(syncScore);
          else if (doc.category === 'degree_certificate') updateData.cgpa = parseFloat(syncScore);
          await API.updateStudent(studentId, updateData);
        }
      }

      showToast(`Document approved & verified by Admin! ${res.updatedScoreMsg || ''}`, 'success');
      if (App.activeView === 'admin-doc-approvals') this.renderDocApprovalsView();
      else if (App.activeView === 'admin-students') this.openStudentDocumentsModal(studentId);
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async rejectDocument(docId, studentId) {
    const reason = prompt('Enter rejection reason for candidate (e.g. "Illegible document copy / Name mismatch"):', 'Clear document copy required');
    if (reason === null) return;

    try {
      await API.updateDocumentStatus(docId, 'Rejected', `Rejected by Admin: ${reason}`);
      showToast('Document marked as Rejected. Candidate notified for re-upload.', 'info');
      if (App.activeView === 'admin-doc-approvals') this.renderDocApprovalsView();
      else if (App.activeView === 'admin-students') this.openStudentDocumentsModal(studentId);
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async filterStudentTable() {
    const search = document.getElementById('studentSearchInput').value;
    const branch = document.getElementById('branchFilter').value;
    const status = document.getElementById('statusFilter').value;

    const filtered = await API.getStudents({ search, branch, status });
    document.getElementById('studentTableBody').innerHTML = this.buildStudentTableRows(filtered);
  },

  openEditStudentModal(id, name, cgpa, backlogs, status) {
    const formHtml = `
      <form onsubmit="AdminPortal.handleUpdateStudent(event, '${id}')">
        <div class="form-group">
          <label>Student Name</label>
          <input type="text" class="form-control" value="${name}" disabled>
        </div>
        <div class="form-group">
          <label>CGPA</label>
          <input type="number" step="0.01" id="editCgpa" class="form-control" value="${cgpa}" required>
        </div>
        <div class="form-group">
          <label>Backlogs Count</label>
          <input type="number" id="editBacklogs" class="form-control" value="${backlogs}" required>
        </div>
        <div class="form-group">
          <label>Placement Status</label>
          <select id="editStatus" class="form-control">
            <option value="Unplaced" ${status === 'Unplaced' ? 'selected' : ''}>Unplaced</option>
            <option value="In Progress" ${status === 'In Progress' ? 'selected' : ''}>In Progress</option>
            <option value="Shortlisted" ${status === 'Shortlisted' ? 'selected' : ''}>Shortlisted</option>
            <option value="Placed" ${status === 'Placed' ? 'selected' : ''}>Placed</option>
          </select>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px;">
          <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Save Changes</button>
        </div>
      </form>
    `;
    openModal(`Edit Record: ${id}`, formHtml);
  },

  async handleUpdateStudent(e, id) {
    e.preventDefault();
    const updateData = {
      cgpa: parseFloat(document.getElementById('editCgpa').value),
      backlogs: parseInt(document.getElementById('editBacklogs').value, 10),
      status: document.getElementById('editStatus').value
    };

    try {
      await API.updateStudent(id, updateData);
      showToast('Student record updated successfully!', 'success');
      closeModal();
      this.renderStudentsView();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  // 4. APPLICATIONS & SHORTLISTED CANDIDATES VIEW
  async renderApplicationsView(filterOptions = {}) {
    const container = document.getElementById('viewContainer');
    container.innerHTML = `<div class="loading-state">Loading Applications Pipeline...</div>`;

    try {
      const apps = await API.getApplications(filterOptions);

      let rowsHtml = !apps.length ? `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No application records found.</td></tr>` : apps.map(a => `
        <tr>
          <td><strong>${a.id}</strong></td>
          <td>
            <div style="font-weight: 600; color: #fff;">${a.studentId}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">Applied: ${a.appliedDate}</div>
          </td>
          <td>
            <strong style="color: var(--secondary);">${a.company}</strong>
            <div style="font-size: 0.8rem; color: var(--text-dim);">${a.role}</div>
          </td>
          <td><span style="color: var(--accent-cyan); font-weight: 600;">${a.currentStage}</span></td>
          <td>${renderStatusBadge(a.status)}</td>
          <td>
            <button class="btn btn-primary btn-sm" onclick="AdminPortal.openUpdateAppModal('${a.id}', '${a.company}', '${a.status}', '${a.currentStage}')">
              Update Stage
            </button>
          </td>
        </tr>
      `).join('');

      container.innerHTML = `
        <div class="page-header">
          <div class="page-title">
            <h2>Applications & Selection Desk</h2>
            <p>Manage candidate round progression, schedule technical interviews, and issue offer letters.</p>
          </div>
        </div>

        <div class="panel-card">
          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>App ID</th>
                  <th>Candidate</th>
                  <th>Company & Position</th>
                  <th>Current Stage</th>
                  <th>Status</th>
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
      container.innerHTML = `<div class="error-state">Failed to load applications: ${err.message}</div>`;
    }
  },

  openUpdateAppModal(appId, company, status, currentStage) {
    const formHtml = `
      <form onsubmit="AdminPortal.handleUpdateAppStatus(event, '${appId}')">
        <div class="form-group">
          <label>Company</label>
          <input type="text" class="form-control" value="${company}" disabled>
        </div>
        <div class="form-group">
          <label>New Pipeline Stage</label>
          <select id="appStage" class="form-control">
            <option value="Online Assessment">Online Assessment</option>
            <option value="Tech Interview 1">Tech Interview 1</option>
            <option value="Tech Interview 2">Tech Interview 2</option>
            <option value="HR Interview">HR Interview</option>
            <option value="Offer Letter">Offer Letter</option>
          </select>
        </div>
        <div class="form-group">
          <label>Overall Status</label>
          <select id="appStatus" class="form-control">
            <option value="Shortlisted">Shortlisted</option>
            <option value="Technical Interview">Technical Interview</option>
            <option value="Selected">Selected / Placed</option>
            <option value="Offer Accepted">Offer Accepted</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
        <div class="form-group">
          <label>Offered Salary CTC (If Selected/Offered)</label>
          <input type="text" id="appCtc" class="form-control" placeholder="e.g. ₹24.0 LPA">
        </div>
        <div class="form-group">
          <label>Stage Remark / Note</label>
          <input type="text" id="appNote" class="form-control" placeholder="e.g. Cleared Technical Round 1 with high score">
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px;">
          <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Update Application</button>
        </div>
      </form>
    `;
    openModal(`Update Pipeline: ${appId}`, formHtml);
  },

  async handleUpdateAppStatus(e, appId) {
    e.preventDefault();
    const updateData = {
      stage: document.getElementById('appStage').value,
      status: document.getElementById('appStatus').value,
      offerPackage: document.getElementById('appCtc').value,
      note: document.getElementById('appNote').value
    };

    try {
      await API.updateApplicationStatus(appId, updateData);
      showToast('Application stage updated successfully!', 'success');
      closeModal();
      this.renderApplicationsView();
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  // 5. INTERVIEWS SCHEDULE CALENDAR VIEW
  async renderInterviewsView() {
    const container = document.getElementById('viewContainer');
    container.innerHTML = `<div class="loading-state">Loading Interviews...</div>`;

    try {
      const interviews = await API.getInterviews();

      let listHtml = interviews.map(i => `
        <div class="panel-card" style="margin-bottom: 16px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <span style="font-size: 0.75rem; color: var(--secondary); font-weight: 700; text-transform: uppercase;">${i.company}</span>
              <h3 style="color: #fff; margin-top: 4px;">${i.roundName}</h3>
              <p style="color: var(--text-muted); font-size: 0.85rem; margin-top: 2px;">Candidate: <strong>${i.studentName}</strong> (${i.studentId})</p>
            </div>
            ${renderStatusBadge(i.status)}
          </div>

          <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 0.85rem; color: var(--text-main);">
              <i class="ri-calendar-event-line" style="color: var(--primary);"></i> Date: <strong>${i.date}</strong> | Time: <strong>${i.time}</strong>
            </div>
            <a href="${i.meetingLink}" target="_blank" class="btn btn-primary btn-sm">
              <i class="ri-video-chat-line"></i> Join Virtual Room
            </a>
          </div>
        </div>
      `).join('');

      container.innerHTML = `
        <div class="page-header">
          <div class="page-title">
            <h2>Interview Schedule & Logistics</h2>
            <p>Global calendar of ongoing and upcoming candidate interview rounds.</p>
          </div>
        </div>

        <div>
          ${listHtml || '<p style="color: var(--text-muted);">No scheduled interviews.</p>'}
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="error-state">Failed to load interviews: ${err.message}</div>`;
    }
  },

  // 6. FINAL PLACEMENT RESULTS LEDGER
  async renderPlacementsView() {
    const container = document.getElementById('viewContainer');
    container.innerHTML = `<div class="loading-state">Loading Placement Ledger...</div>`;

    try {
      const placements = await API.getPlacements();

      let rowsHtml = placements.map(p => `
        <tr>
          <td><strong>${p.studentId}</strong></td>
          <td><strong style="color: #fff;">${p.studentName}</strong></td>
          <td>${p.branch}</td>
          <td><strong style="color: var(--secondary);">${p.company}</strong></td>
          <td>${p.role}</td>
          <td><strong style="color: var(--success);">${p.package}</strong></td>
          <td>${p.placedDate}</td>
          <td>${renderStatusBadge(p.status)}</td>
        </tr>
      `).join('');

      container.innerHTML = `
        <div class="page-header">
          <div class="page-title">
            <h2>Final Placement Results Ledger</h2>
            <p>Official ledger of candidates placed, selected companies, and accepted salary packages.</p>
          </div>
          <a href="${API.exportStudentsUrl()}" class="btn btn-secondary">
            <i class="ri-file-download-line"></i> Download Ledger (CSV)
          </a>
        </div>

        <div class="panel-card">
          <div class="table-responsive">
            <table class="custom-table">
              <thead>
                <tr>
                  <th>Roll No</th>
                  <th>Student Name</th>
                  <th>Branch</th>
                  <th>Company</th>
                  <th>Designation</th>
                  <th>CTC Offered</th>
                  <th>Placed Date</th>
                  <th>Status</th>
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
      container.innerHTML = `<div class="error-state">Failed to load placements: ${err.message}</div>`;
    }
  }
};
