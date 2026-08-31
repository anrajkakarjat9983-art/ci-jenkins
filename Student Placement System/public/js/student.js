/* Student Portal Logic & Views */

const StudentPortal = {
  // 1. STUDENT OVERVIEW DASHBOARD
  async renderOverviewView(studentId) {
    const container = document.getElementById('viewContainer');
    container.innerHTML = `<div class="loading-state">Loading Candidate Portal...</div>`;

    try {
      const students = await API.getStudents();
      const currentStudent = students.find(s => s.id === studentId) || students[0];
      const drives = await API.getDrives();
      const applications = await API.getApplications({ studentId: currentStudent.id });
      const notifications = await API.getNotifications({ target: currentStudent.id });

      const eligibleDrivesCount = drives.filter(d => d.status === 'Active' && currentStudent.cgpa >= d.minCgpa && currentStudent.backlogs <= d.maxBacklogs).length;

      let myAppsListHtml = !applications.length ? `<p style="color: var(--text-muted); font-size: 0.9rem;">You have not applied to any recruitment drives yet. Explore active drives to get started!</p>` : applications.map(app => `
        <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-color); padding: 16px; border-radius: var(--radius-md); margin-bottom: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <h4 style="color: #fff;">${app.company}</h4>
              <span style="font-size: 0.8rem; color: var(--text-muted);">${app.role}</span>
            </div>
            ${renderStatusBadge(app.status)}
          </div>
          <div style="margin-top: 10px;">
            ${renderApplicationTimeline(app.history, app.currentStage)}
          </div>
        </div>
      `).join('');

      let recentNoticesHtml = notifications.slice(0, 3).map(n => `
        <div style="border-left: 3px solid var(--primary); padding-left: 12px; margin-bottom: 14px;">
          <strong style="color: #fff; font-size: 0.9rem;">${n.title}</strong>
          <div style="font-size: 0.75rem; color: var(--text-muted);">${n.date}</div>
          <p style="font-size: 0.825rem; color: var(--text-dim); margin-top: 4px;">${n.message}</p>
        </div>
      `).join('');

      container.innerHTML = `
        <div class="page-header">
          <div class="page-title">
            <h2>Welcome back, ${currentStudent.name}!</h2>
            <p>${currentStudent.branch} • Class of ${currentStudent.graduationYear} • Roll: ${currentStudent.id}</p>
          </div>
          <button class="btn btn-primary" onclick="App.navigateTo('student-drives')">
            <i class="ri-search-line"></i> Browse Job Drives
          </button>
        </div>

        <div class="metrics-grid">
          ${renderMetricCard('Academic CGPA', currentStudent.cgpa, `Backlogs: ${currentStudent.backlogs}`, 'ri-award-line', 'icon-cyan')}
          ${renderMetricCard('Placement Status', currentStudent.status, currentStudent.status === 'Placed' ? `Package: ${currentStudent.offerPackage}` : 'Active Candidate', 'ri-user-star-line', currentStudent.status === 'Placed' ? 'icon-emerald' : 'icon-amber')}
          ${renderMetricCard('Eligible Drives', eligibleDrivesCount, 'Matching CGPA & Branch', 'ri-checkbox-circle-line', 'icon-indigo')}
          ${renderMetricCard('My Applications', applications.length, 'Submitted Drives', 'ri-send-plane-line', 'icon-purple')}
        </div>

        <div class="dashboard-row">
          <div class="panel-card">
            <div class="panel-title">
              <h3><i class="ri-route-line" style="color: var(--primary);"></i> My Application Tracker</h3>
            </div>
            <div>
              ${myAppsListHtml}
            </div>
          </div>

          <div class="panel-card">
            <div class="panel-title">
              <h3><i class="ri-notification-3-line" style="color: var(--secondary);"></i> Notifications & Alerts</h3>
            </div>
            <div>
              ${recentNoticesHtml || '<p style="color: var(--text-muted);">No new alerts.</p>'}
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="error-state">Failed to load candidate overview: ${err.message}</div>`;
    }
  },

  // 2. BROWSE JOB DRIVES VIEW
  async renderDrivesExplorerView(studentId) {
    const container = document.getElementById('viewContainer');
    container.innerHTML = `<div class="loading-state">Loading Drives...</div>`;

    try {
      const students = await API.getStudents();
      const currentStudent = students.find(s => s.id === studentId) || students[0];
      const drives = await API.getDrives();
      const myApps = await API.getApplications({ studentId: currentStudent.id });

      let drivesCardsHtml = drives.map(d => {
        const appliedApp = myApps.find(a => a.driveId === d.id);
        const isEligibleCgpa = currentStudent.cgpa >= d.minCgpa;
        const isEligibleBacklog = currentStudent.backlogs <= d.maxBacklogs;
        const isEligible = isEligibleCgpa && isEligibleBacklog;

        let actionBtnHtml = '';
        if (appliedApp) {
          actionBtnHtml = `<span class="badge badge-inprogress"><i class="ri-check-double-line"></i> Applied (${appliedApp.status})</span>`;
        } else if (d.status === 'Closed') {
          actionBtnHtml = `<span class="badge badge-closed">Drive Closed</span>`;
        } else if (!isEligible) {
          actionBtnHtml = `<button class="btn btn-secondary btn-sm" disabled style="opacity: 0.5;">
            <i class="ri-close-circle-line"></i> Not Eligible (Min CGPA ${d.minCgpa})
          </button>`;
        } else {
          actionBtnHtml = `<button class="btn btn-primary btn-sm" onclick="StudentPortal.handleApply('${currentStudent.id}', '${d.id}')">
            <i class="ri-send-plane-fill"></i> 1-Click Apply
          </button>`;
        }

        return `
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
              <div class="req-item"><i class="ri-award-line"></i> <span>Min CGPA: <strong>${d.minCgpa}</strong> (Your CGPA: <strong>${currentStudent.cgpa}</strong>)</span></div>
              <div class="req-item"><i class="ri-calendar-event-line"></i> <span>Deadline: ${d.deadline}</span></div>
            </div>

            <div class="drive-tags">
              ${d.eligibleBranches.map(b => `<span class="drive-tag">${b}</span>`).join('')}
            </div>

            <div style="display: flex; align-items: center; justify-content: space-between; pt: 12px; border-top: 1px solid var(--border-color);">
              ${isEligible ? '<span class="badge badge-placed"><i class="ri-shield-check-line"></i> Eligible</span>' : '<span class="badge badge-unplaced"><i class="ri-error-warning-line"></i> Ineligible</span>'}
              <div>
                ${actionBtnHtml}
              </div>
            </div>
          </div>
        `;
      }).join('');

      container.innerHTML = `
        <div class="page-header">
          <div class="page-title">
            <h2>Campus Placement Drives Directory</h2>
            <p>Explore active recruitment drives. Live eligibility checks are computed based on your CGPA (${currentStudent.cgpa}).</p>
          </div>
        </div>

        <div class="drives-grid">
          ${drivesCardsHtml}
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="error-state">Failed to load job drives: ${err.message}</div>`;
    }
  },

  async handleApply(studentId, driveId) {
    try {
      await API.applyToDrive(studentId, driveId);
      showToast('Application submitted successfully!', 'success');
      this.renderDrivesExplorerView(studentId);
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  // 3. STUDENT INTERVIEW SCHEDULE VIEW
  async renderInterviewScheduleView(studentId) {
    const container = document.getElementById('viewContainer');
    container.innerHTML = `<div class="loading-state">Loading Interview Schedule...</div>`;

    try {
      const interviews = await API.getInterviews({ studentId });

      let listHtml = !interviews.length ? `
        <div class="panel-card" style="text-align: center; padding: 40px;">
          <i class="ri-calendar-event-line" style="font-size: 3.5rem; color: var(--text-dim);"></i>
          <h3 style="margin-top: 14px; color: #fff;">No Upcoming Interviews Scheduled</h3>
          <p style="color: var(--text-muted); margin-top: 6px;">When recruiters shortlist your application, interview invitations will appear here.</p>
        </div>
      ` : interviews.map(i => `
        <div class="panel-card" style="margin-bottom: 20px; border-left: 4px solid var(--primary);">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <span style="font-size: 0.75rem; color: var(--secondary); font-weight: 700; text-transform: uppercase;">${i.company} RECRUITMENT</span>
              <h3 style="color: #fff; margin-top: 4px;">${i.roundName}</h3>
              <p style="color: var(--text-muted); font-size: 0.85rem;">Evaluator: ${i.interviewer}</p>
            </div>
            ${renderStatusBadge(i.status)}
          </div>

          <div style="margin-top: 16px; padding: 14px; background: rgba(0,0,0,0.2); border-radius: var(--radius-md); display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div style="font-size: 0.9rem; color: #fff; font-weight: 600;">
                <i class="ri-calendar-line" style="color: var(--primary);"></i> ${i.date}
              </div>
              <div style="font-size: 0.85rem; color: var(--text-muted); margin-top: 2px;">
                <i class="ri-time-line" style="color: var(--secondary);"></i> ${i.time}
              </div>
            </div>
            <a href="${i.meetingLink}" target="_blank" class="btn btn-primary">
              <i class="ri-video-chat-fill"></i> Join Virtual Interview Room
            </a>
          </div>
        </div>
      `).join('');

      container.innerHTML = `
        <div class="page-header">
          <div class="page-title">
            <h2>My Interview Schedule</h2>
            <p>View confirmed technical & HR interview slots with virtual video room links.</p>
          </div>
        </div>

        <div>
          ${listHtml}
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="error-state">Failed to load interviews: ${err.message}</div>`;
    }
  },

  // 4. PERSONAL & EDUCATION PROFILE VIEW
  async renderProfileView(studentId) {
    const container = document.getElementById('viewContainer');
    container.innerHTML = `<div class="loading-state">Loading Student Profile...</div>`;

    try {
      const students = await API.getStudents();
      const currentStudent = students.find(s => s.id === studentId) || students[0];

      const isPlaceholderUrl = !currentStudent.resumeUrl || currentStudent.resumeUrl.includes('example.com');
      const isImage = currentStudent.resumeUrl && (currentStudent.resumeUrl.startsWith('data:image/') || currentStudent.resumeUrl.match(/\.(jpg|jpeg|png|webp)/i) || currentStudent.resumeUrl.includes('unsplash.com'));

      let resumePreviewHtml = '';
      if (isImage) {
        resumePreviewHtml = `
          <div style="text-align: center;">
            <img src="${currentStudent.resumeUrl}" alt="${currentStudent.name} Resume Photo" style="width: 100%; max-height: 380px; object-fit: contain; border-radius: var(--radius-md); border: 1px solid var(--border-glow); box-shadow: 0 8px 25px rgba(0,0,0,0.5);">
            <div style="margin-top: 10px; font-size: 0.8rem; color: var(--success); font-weight: 600;">
              <i class="ri-checkbox-circle-fill"></i> Uploaded Resume Image Photo
            </div>
          </div>
        `;
      } else if (!isPlaceholderUrl && currentStudent.resumeUrl) {
        resumePreviewHtml = `
          <div style="border: 1px solid var(--border-color); border-radius: var(--radius-md); overflow: hidden; background: #0f172a;">
            <object data="${currentStudent.resumeUrl}" type="application/pdf" style="width: 100%; height: 320px; border: none; display: block;">
              <div style="padding: 20px; text-align: center;">
                <i class="ri-file-pdf-fill" style="font-size: 3rem; color: var(--primary);"></i>
                <h4 style="color: #fff; margin-top: 8px;">${currentStudent.name}_Resume.pdf</h4>
                <p style="font-size: 0.8rem; color: var(--text-muted);">Verified Candidate PDF Document</p>
                <a href="${currentStudent.resumeUrl}" target="_blank" download="${currentStudent.name}_Resume.pdf" class="btn btn-secondary btn-sm" style="margin-top: 10px;">
                  <i class="ri-download-line"></i> Download Resume PDF
                </a>
              </div>
            </object>
          </div>
        `;
      } else {
        resumePreviewHtml = `
          <div style="padding: 20px; border: 1px dashed var(--border-glow); border-radius: var(--radius-md); background: rgba(99, 102, 241, 0.05); text-align: center;">
            <div style="width: 60px; height: 60px; background: rgba(99, 102, 241, 0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; font-size: 1.8rem; color: var(--primary);">
              <i class="ri-file-user-line"></i>
            </div>
            <h4 style="color: #fff; margin-bottom: 4px;">${currentStudent.name}_Resume Document</h4>
            <p style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: 12px;">Official placement resume file (&lt; 5 MB)</p>
            <div style="background: rgba(0,0,0,0.2); border-radius: var(--radius-md); padding: 12px; text-align: left; font-size: 0.8rem; color: var(--text-dim); margin-bottom: 14px;">
              <div>• <strong>Branch:</strong> ${currentStudent.branch}</div>
              <div>• <strong>CGPA:</strong> ${currentStudent.cgpa} • <strong>Class 10:</strong> ${currentStudent.class10Pct || 92}%</div>
              <div>• <strong>Skills:</strong> ${(currentStudent.skills || []).join(', ')}</div>
            </div>
          </div>
        `;
      }

      container.innerHTML = `
        <div class="page-header">
          <div class="page-title">
            <h2>Personal & Education Profile</h2>
            <p>Manage your academic percentage scores, skill tags, and verified resume document photo.</p>
          </div>
        </div>

        <div class="dashboard-row">
          <div class="panel-card">
            <div class="panel-title">
              <h3><i class="ri-user-settings-line" style="color: var(--primary);"></i> Academic & Personal Credentials</h3>
            </div>
            <form onsubmit="StudentPortal.handleSaveProfile(event, '${currentStudent.id}')">
              <div class="form-group">
                <label>Full Name</label>
                <input type="text" class="form-control" value="${currentStudent.name}" disabled>
              </div>
              <div class="form-group" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div>
                  <label>Student Roll / ID</label>
                  <input type="text" class="form-control" value="${currentStudent.id}" disabled>
                </div>
                <div>
                  <label>Branch</label>
                  <input type="text" class="form-control" value="${currentStudent.branch}" disabled>
                </div>
              </div>
              <!-- Academic Marks & CGPA Document Auto-Sync Banner -->
              <div style="background: rgba(99, 102, 241, 0.1); border: 1px solid var(--border-glow); padding: 12px 14px; border-radius: var(--radius-md); margin-bottom: 16px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                  <div>
                    <strong style="color: #fff; font-size: 0.85rem;"><i class="ri-award-line" style="color: var(--warning);"></i> Academic Marks (Document & Resume Based)</strong>
                    <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 2px;">Scores update automatically based on your uploaded marksheets & resume document.</div>
                  </div>
                  <button type="button" class="btn btn-secondary btn-sm" onclick="StudentPortal.autoExtractScoresFromDocs('${currentStudent.id}')">
                    <i class="ri-refresh-line" style="color: var(--accent-cyan);"></i> Sync from Docs
                  </button>
                </div>
              </div>

              <div class="form-group" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div>
                  <label>Class 10th Score (%)</label>
                  <input type="number" step="0.1" max="100" min="0" id="profClass10" class="form-control" value="${currentStudent.class10Pct || 90.0}" style="font-weight: 700; color: var(--success);" placeholder="e.g. 90.0">
                </div>
                <div>
                  <label>Class 12th / Diploma Score (%)</label>
                  <input type="number" step="0.1" max="100" min="0" id="profClass12" class="form-control" value="${currentStudent.class12Pct || 88.0}" style="font-weight: 700; color: var(--success);" placeholder="e.g. 88.0">
                </div>
              </div>
              <div class="form-group" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                <div>
                  <label>Current B.Tech CGPA</label>
                  <input type="number" step="0.01" max="10" min="0" id="profCgpa" class="form-control" value="${currentStudent.cgpa !== undefined ? currentStudent.cgpa : 8.00}" style="font-weight: 700; color: var(--accent-cyan);" placeholder="e.g. 8.00">
                </div>
                <div>
                  <label>Active Backlogs</label>
                  <input type="number" min="0" id="profBacklogs" class="form-control" value="${currentStudent.backlogs !== undefined ? currentStudent.backlogs : 0}">
                </div>
              </div>
              <div class="form-group">
                <label>Phone Number</label>
                <input type="text" id="profPhone" class="form-control" value="${currentStudent.phone || ''}">
              </div>
              <div class="form-group">
                <label>Skill Tags (Comma Separated)</label>
                <input type="text" id="profSkills" class="form-control" value="${(currentStudent.skills || []).join(', ')}">
              </div>

              <!-- Upload Resume File (<5MB) -->
              <div class="form-group">
                <label><i class="ri-upload-cloud-2-line" style="color: var(--primary);"></i> Upload Resume Photo / File (&lt; 5 MB)</label>
                <input type="file" id="profResumeFile" accept=".pdf,.png,.jpg,.jpeg,.webp" class="form-control" onchange="StudentPortal.handleProfileResumeSelect(event, '${currentStudent.id}')">
                <input type="hidden" id="profResume" value="${currentStudent.resumeUrl || ''}">
                <div id="profResumeFileInfo" style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">
                  Upload your resume PDF or Photo document (&lt; 5 MB) to sync profile & marks.
                </div>
              </div>

              <div style="margin-top: 20px;">
                <button type="submit" class="btn btn-primary">
                  <i class="ri-save-line"></i> Save Profile, Marks & Resume
                </button>
              </div>
            </form>
          </div>

          <div style="display: flex; flex-direction: column; gap: 20px;">
            <div class="panel-card">
              <div class="panel-title">
                <h3><i class="ri-file-pdf-line" style="color: var(--secondary);"></i> Resume Visual Photo / Preview Card</h3>
                <span class="badge badge-placed"><i class="ri-shield-check-line"></i> Verified</span>
              </div>

              <!-- Live Resume Preview Container -->
              <div id="resumePreviewContainer" style="margin-top: 10px;">
                ${resumePreviewHtml}
              </div>

              <div style="margin-top: 16px; display: flex; gap: 8px; justify-content: center;">
                <button type="button" class="btn btn-secondary btn-sm" onclick="document.getElementById('profResumeFile').click()">
                  <i class="ri-image-edit-line"></i> ${isPlaceholderUrl ? 'Upload Resume Photo / File' : 'Change Resume Photo'}
                </button>
                ${!isPlaceholderUrl ? `
                  <button type="button" class="btn btn-primary btn-sm" onclick="StudentPortal.previewResumeFull('${currentStudent.id}')">
                    <i class="ri-fullscreen-line"></i> Full Screen Preview
                  </button>
                ` : ''}
              </div>
            </div>

            <div class="panel-card" style="border-left: 4px solid var(--accent-cyan);">
              <div class="panel-title">
                <h3><i class="ri-folder-shield-2-line" style="color: var(--accent-cyan);"></i> Document Vault (&lt;5 MB Limit)</h3>
              </div>
              <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 16px;">
                Upload your mandatory 10th/12th marksheets, degree certificate, PAN, Aadhar card, passport photo & certificates for placement verification.
              </p>
              <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                <button class="btn btn-primary btn-sm" onclick="App.navigateTo('student-documents')">
                  <i class="ri-folder-user-line"></i> Open Document Vault
                </button>
                <button class="btn btn-secondary btn-sm" onclick="StudentPortal.openUploadModal('${currentStudent.id}')">
                  <i class="ri-upload-cloud-line"></i> Quick Upload
                </button>
              </div>
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="error-state">Failed to load profile: ${err.message}</div>`;
    }
  },

  handleProfileResumeSelect(e) {
    const file = e.target.files[0];
    const infoDiv = document.getElementById('profResumeFileInfo');
    const container = document.getElementById('resumePreviewContainer');
    const hiddenInput = document.getElementById('profResume');

    if (!file) return;

    const MAX_SIZE = 5 * 1024 * 1024;
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);

    if (file.size > MAX_SIZE) {
      showToast(`Error: "${file.name}" (${sizeMb} MB) exceeds the 5 MB file size limit!`, 'error');
      e.target.value = '';
      infoDiv.innerHTML = `<span style="color: var(--danger); font-weight: 600;"><i class="ri-error-warning-fill"></i> File size ${sizeMb} MB is OVER 5 MB limit. Please select a smaller file.</span>`;
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUri = evt.target.result;
      if (hiddenInput) hiddenInput.value = dataUri;

      const isImg = file.type.includes('image');
      if (container) {
        if (isImg) {
          container.innerHTML = `
            <div style="text-align: center;">
              <img src="${dataUri}" alt="Uploaded Resume Photo" style="width: 100%; max-height: 380px; object-fit: contain; border-radius: var(--radius-md); border: 1px solid var(--success); box-shadow: 0 8px 25px rgba(0,0,0,0.5);">
              <div style="margin-top: 10px; font-size: 0.8rem; color: var(--success); font-weight: 600;">
                <i class="ri-checkbox-circle-fill"></i> Resume Photo Loaded (${sizeMb} MB). Click "Save Profile & Resume" below!
              </div>
            </div>
          `;
        } else {
          container.innerHTML = `
            <div style="border: 1px solid var(--success); border-radius: var(--radius-md); overflow: hidden; background: #0f172a;">
              <object data="${dataUri}" type="application/pdf" style="width: 100%; height: 320px; border: none; display: block;"></object>
              <div style="padding: 10px; text-align: center; font-size: 0.8rem; color: var(--success); font-weight: 600;">
                <i class="ri-checkbox-circle-fill"></i> Resume PDF Loaded (${sizeMb} MB). Click "Save Profile & Resume" below!
              </div>
            </div>
          `;
        }
      }

      infoDiv.innerHTML = `<span style="color: var(--success); font-weight: 600;"><i class="ri-checkbox-circle-fill"></i> Selected File: ${file.name} (${sizeMb} MB / 5 MB)</span>`;
    };
    reader.readAsDataURL(file);
  },

  async previewResumeFull(studentId) {
    try {
      const students = await API.getStudents();
      const student = students.find(s => s.id === studentId);
      if (!student) return;

      const isImg = student.resumeUrl && (student.resumeUrl.startsWith('data:image/') || student.resumeUrl.match(/\.(jpg|jpeg|png|webp)/i) || student.resumeUrl.includes('unsplash.com'));

      let contentHtml = '';
      if (isImg) {
        contentHtml = `
          <div style="text-align: center;">
            <img src="${student.resumeUrl}" alt="${student.name} Resume Photo" style="max-width: 100%; max-height: 520px; border-radius: var(--radius-md); border: 1px solid var(--border-glow);">
          </div>
        `;
      } else {
        contentHtml = `
          <div style="height: 500px; width: 100%;">
            <object data="${student.resumeUrl}" type="application/pdf" style="width: 100%; height: 100%; border: none; border-radius: var(--radius-md);">
              <div style="padding: 30px; text-align: center; color: #fff;">
                <h4>${student.name}_Resume.pdf</h4>
                <a href="${student.resumeUrl}" download="${student.name}_Resume.pdf" class="btn btn-primary btn-sm" style="margin-top: 14px;">
                  <i class="ri-download-line"></i> Download Resume File
                </a>
              </div>
            </object>
          </div>
        `;
      }

      openModal(`Verified Resume Preview: ${student.name}`, contentHtml);
    } catch (err) {
      showToast('Failed to preview resume', 'error');
    }
  },

  async autoExtractScoresFromDocs(studentId) {
    try {
      const docs = await API.getDocuments({ studentId });
      let updatedCount = 0;

      docs.forEach(d => {
        if (d.extractedScore) {
          const val = parseFloat(d.extractedScore);
          if (!isNaN(val)) {
            if (d.category === '10th_marksheet' && document.getElementById('profClass10')) {
              document.getElementById('profClass10').value = val;
              updatedCount++;
            } else if (d.category === '12th_marksheet' && document.getElementById('profClass12')) {
              document.getElementById('profClass12').value = val;
              updatedCount++;
            } else if (d.category === 'degree_certificate' && document.getElementById('profCgpa')) {
              document.getElementById('profCgpa').value = val;
              updatedCount++;
            }
          }
        }
      });

      if (updatedCount > 0) {
        showToast(`Auto-extracted ${updatedCount} academic score(s) from uploaded document vault! Click "Save Profile, Marks & Resume" to save.`, 'success');
      } else {
        showToast('Marks are in sync with your profile & uploaded documents. You can also edit values directly.', 'info');
      }
    } catch (err) {
      showToast('Failed to sync document scores', 'error');
    }
  },

  async handleSaveProfile(e, studentId) {
    e.preventDefault();
    const class10Val = parseFloat(document.getElementById('profClass10').value);
    const class12Val = parseFloat(document.getElementById('profClass12').value);
    const cgpaVal = parseFloat(document.getElementById('profCgpa').value);
    const backlogsVal = parseInt(document.getElementById('profBacklogs').value, 10);

    const updateData = {
      class10Pct: isNaN(class10Val) ? 90.0 : class10Val,
      class12Pct: isNaN(class12Val) ? 88.0 : class12Val,
      cgpa: isNaN(cgpaVal) ? 8.00 : cgpaVal,
      backlogs: isNaN(backlogsVal) ? 0 : backlogsVal,
      phone: document.getElementById('profPhone').value,
      skills: document.getElementById('profSkills').value.split(',').map(s => s.trim()).filter(Boolean),
      resumeUrl: document.getElementById('profResume').value
    };

    try {
      await API.updateStudent(studentId, updateData);
      showToast(`Profile, Academic Marks (10th: ${updateData.class10Pct}%, 12th: ${updateData.class12Pct}%, CGPA: ${updateData.cgpa}) & Resume updated!`, 'success');
      this.renderProfileView(studentId);
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  // 5. OFFERS & DECISION DESK VIEW
  async renderOffersView(studentId) {
    const container = document.getElementById('viewContainer');
    container.innerHTML = `<div class="loading-state">Loading Offers...</div>`;

    try {
      const students = await API.getStudents();
      const currentStudent = students.find(s => s.id === studentId) || students[0];
      const applications = await API.getApplications({ studentId: currentStudent.id });

      const offerApps = applications.filter(a => a.status === 'Offer Accepted' || a.status === 'Selected' || a.currentStage === 'Offer Letter');

      let cardsHtml = !offerApps.length ? `
        <div class="panel-card" style="text-align: center; padding: 40px;">
          <i class="ri-shake-hands-line" style="font-size: 3.5rem; color: var(--text-dim);"></i>
          <h3 style="margin-top: 14px; color: #fff;">No Job Offers Issued Yet</h3>
          <p style="color: var(--text-muted); margin-top: 6px;">Once you complete technical & HR interviews, your offer letters will appear here.</p>
        </div>
      ` : offerApps.map(a => `
        <div class="panel-card" style="border-left: 4px solid var(--success); margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <span style="font-size: 0.75rem; color: var(--success); text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700;">OFFICIAL SELECTION</span>
              <h3 style="color: #fff; font-size: 1.5rem; margin-top: 4px;">${a.company}</h3>
              <p style="color: var(--text-muted); font-size: 0.9rem;">${a.role}</p>
            </div>
            <div class="ctc-badge">${currentStudent.offerPackage !== '-' ? currentStudent.offerPackage : '₹24.0 LPA'}</div>
          </div>

          <p style="margin: 16px 0; font-size: 0.875rem; color: var(--text-main);">
            Congratulations ${currentStudent.name}! The Training & Placement Cell has released your official job offer letter for <strong>${a.company}</strong>.
          </p>

          <div style="display: flex; justify-content: space-between; align-items: center; pt: 16px; border-top: 1px solid var(--border-color);">
            ${renderStatusBadge(a.status)}
            <div style="display: flex; gap: 12px;">
              <button class="btn btn-primary" onclick="showToast('Offer Acceptance confirmed! TPO notified.', 'success')">
                <i class="ri-check-line"></i> Accept Offer
              </button>
            </div>
          </div>
        </div>
      `).join('');

      container.innerHTML = `
        <div class="page-header">
          <div class="page-title">
            <h2>Offers & Placement Decision Desk</h2>
            <p>Review issued offer letters and formalize offer acceptance according to campus policy.</p>
          </div>
        </div>

        <div>
          ${cardsHtml}
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="error-state">Failed to load offers: ${err.message}</div>`;
    }
  },

  // 6. STUDENT DOCUMENTS VAULT (<5 MB LIMIT)
  async renderDocumentsView(studentId, activeCategory = 'all') {
    const container = document.getElementById('viewContainer');
    container.innerHTML = `<div class="loading-state">Loading Candidate Document Vault...</div>`;

    try {
      const students = await API.getStudents();
      const currentStudent = students.find(s => s.id === studentId) || students[0];
      const documents = await API.getDocuments({ studentId: currentStudent.id });

      const filteredDocs = activeCategory === 'all' 
        ? documents 
        : documents.filter(d => d.category === activeCategory);

      const categoryMeta = {
        '10th_marksheet': { label: '10th Marksheet', icon: 'ri-file-paper-2-line', badge: 'Marksheet', color: '#6366f1' },
        '12th_marksheet': { label: '12th / Diploma Marksheet', icon: 'ri-file-paper-line', badge: 'Marksheet', color: '#8b5cf6' },
        'degree_certificate': { label: 'Graduation Degree', icon: 'ri-graduation-cap-line', badge: 'Academic', color: '#ec4899' },
        'pan_card': { label: 'PAN Card', icon: 'ri-bank-card-line', badge: 'Identity', color: '#06b6d4' },
        'aadhar_card': { label: 'Aadhar Card', icon: 'ri-id-card-line', badge: 'Identity', color: '#3b82f6' },
        'passport_photo': { label: 'Passport Photo', icon: 'ri-image-line', badge: 'Photo', color: '#10b981' },
        'internship_cert': { label: 'Internship Certificate', icon: 'ri-award-line', badge: 'Experience', color: '#f59e0b' },
        'course_cert': { label: 'Online Course Cert', icon: 'ri-certificate-line', badge: 'Course', color: '#a855f7' },
        'other': { label: 'Other Document', icon: 'ri-file-line', badge: 'Document', color: '#64748b' }
      };

      const categoriesList = [
        { id: 'all', label: 'All Documents' },
        { id: '10th_marksheet', label: '10th Marksheet' },
        { id: '12th_marksheet', label: '12th Marksheet' },
        { id: 'degree_certificate', label: 'Degree / Transcripts' },
        { id: 'pan_card', label: 'PAN Card' },
        { id: 'aadhar_card', label: 'Aadhar Card' },
        { id: 'passport_photo', label: 'Passport Photo' },
        { id: 'internship_cert', label: 'Internship Certificate' },
        { id: 'course_cert', label: 'Course Certificate' },
        { id: 'other', label: 'Other Docs' }
      ];

      const filterPillsHtml = categoriesList.map(cat => `
        <button class="doc-filter-pill ${activeCategory === cat.id ? 'active' : ''}" 
                onclick="StudentPortal.renderDocumentsView('${currentStudent.id}', '${cat.id}')">
          ${cat.label}
        </button>
      `).join('');

      let docsGridHtml = !filteredDocs.length ? `
        <div class="panel-card" style="text-align: center; padding: 48px; grid-column: 1 / -1;">
          <i class="ri-folder-open-line" style="font-size: 3.5rem; color: var(--text-dim);"></i>
          <h3 style="margin-top: 14px; color: #fff;">No Documents Found</h3>
          <p style="color: var(--text-muted); margin-top: 6px;">Upload your academic marksheets, govt IDs, photo, and certificates below. Max file size: 5 MB.</p>
          <button class="btn btn-primary" style="margin-top: 18px;" onclick="StudentPortal.openUploadModal('${currentStudent.id}')">
            <i class="ri-upload-cloud-fill"></i> Upload Document Now
          </button>
        </div>
      ` : filteredDocs.map(doc => {
        const meta = categoryMeta[doc.category] || categoryMeta['other'];
        const isPdf = doc.fileType && doc.fileType.includes('pdf');
        return `
          <div class="doc-card" style="border-top: 3px solid ${meta.color};">
            <div class="doc-card-header">
              <div class="doc-icon-box" style="background: rgba(255,255,255,0.05); color: ${meta.color};">
                <i class="${isPdf ? 'ri-file-pdf-fill' : meta.icon}"></i>
              </div>
              <div style="flex: 1; overflow: hidden;">
                <span class="doc-category-badge" style="background: rgba(255,255,255,0.08); color: ${meta.color};">${meta.badge}</span>
                <h4 class="doc-title" title="${doc.title}">${doc.title}</h4>
              </div>
            </div>

            <div class="doc-info-list">
              <div class="doc-info-item">
                <i class="ri-file-list-3-line"></i>
                <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${doc.fileName}</span>
              </div>
              <div class="doc-info-item">
                <i class="ri-hard-drive-2-line"></i>
                <span>Size: <strong style="color: var(--accent-cyan);">${doc.fileSizeFormatted || '1.5 MB'}</strong> <span style="font-size: 0.7rem; color: var(--text-dim);">(Max 5MB)</span></span>
              </div>
              <div class="doc-info-item">
                <i class="ri-calendar-line"></i>
                <span>Uploaded: ${doc.uploadDate}</span>
              </div>
            </div>
            ${doc.notes ? `<div style="font-size: 0.75rem; color: ${doc.status === 'Rejected' ? 'var(--danger)' : 'var(--text-dim)'}; margin: 8px 0; font-weight: 500;"><i class="ri-information-line"></i> ${doc.notes}</div>` : ''}

            <div class="doc-card-footer">
              ${doc.status === 'Verified' ? `
                <span class="badge badge-placed" title="Approved by Admin"><i class="ri-checkbox-circle-fill"></i> Verified & Approved</span>
              ` : (doc.status === 'Rejected' ? `
                <span class="badge badge-unplaced" title="Rejected by Admin"><i class="ri-close-circle-fill"></i> Rejected by Admin</span>
              ` : `
                <span class="badge badge-inprogress" title="Awaiting Admin Review"><i class="ri-time-line"></i> Pending Admin Approval</span>
              `)}

              <div style="display: flex; gap: 6px;">
                ${doc.status === 'Rejected' ? `
                  <button class="btn btn-primary btn-sm" onclick="StudentPortal.openUploadModal('${currentStudent.id}', '${doc.category}')" title="Re-upload Document">
                    <i class="ri-refresh-line"></i> Re-upload
                  </button>
                ` : ''}
                <button class="btn btn-secondary btn-sm" onclick="StudentPortal.previewDocument('${doc.id}')" title="Preview Document">
                  <i class="ri-eye-line"></i> View
                </button>
                <a href="${doc.fileData || '#'}" download="${doc.fileName}" target="_blank" class="btn btn-secondary btn-sm" title="Download">
                  <i class="ri-download-line"></i>
                </a>
                <button class="btn btn-danger btn-sm" onclick="StudentPortal.handleDeleteDocument('${doc.id}', '${currentStudent.id}')" title="Delete">
                  <i class="ri-delete-bin-line"></i>
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('');

      container.innerHTML = `
        <div class="page-header">
          <div class="page-title">
            <h2>Student Document Repository (< 5 MB Limit)</h2>
            <p>Upload & manage your verified credentials: 10th/12th Marksheets, Degree, PAN, Aadhar, Passport Photo, Internship & Course Certificates.</p>
          </div>
          <button class="btn btn-primary" onclick="StudentPortal.openUploadModal('${currentStudent.id}')">
            <i class="ri-upload-cloud-2-fill"></i> Upload New Document
          </button>
        </div>

        <!-- 5MB Limit Alert Banner -->
        <div class="doc-limit-banner">
          <div style="display: flex; align-items: center; gap: 14px;">
            <div class="limit-icon"><i class="ri-shield-check-fill"></i></div>
            <div>
              <h4 style="color: #fff; margin: 0; font-size: 0.95rem;">Upload Requirements & File Size Policy</h4>
              <p style="margin-top: 2px; font-size: 0.825rem; color: var(--text-muted);">
                Supported formats: <strong>PDF, PNG, JPG, WEBP</strong>. Max size per file must be strictly <strong>less than 5 MB</strong> (&lt; 5,242,880 bytes).
              </p>
            </div>
          </div>
          <div class="limit-badge-tag"><i class="ri-information-line"></i> Max 5 MB / File</div>
        </div>

        <!-- Category Filter Pills -->
        <div class="doc-filter-bar">
          ${filterPillsHtml}
        </div>

        <!-- Document Cards Grid -->
        <div class="doc-grid">
          ${docsGridHtml}
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="error-state">Failed to load document vault: ${err.message}</div>`;
    }
  },

  openUploadModal(studentId, preselectedCategory = '10th_marksheet') {
    const modalHtml = `
      <form onsubmit="StudentPortal.handleUploadSubmit(event, '${studentId}')" id="docUploadForm">
        <div class="form-group">
          <label><i class="ri-folder-shield-2-line" style="color: var(--primary);"></i> Document Category / Type *</label>
          <select id="uploadCategory" class="form-control" onchange="StudentPortal.handleCategoryChange('${studentId}')" required>
            <option value="10th_marksheet" ${preselectedCategory === '10th_marksheet' ? 'selected' : ''}>10th Marksheet (SSC)</option>
            <option value="12th_marksheet" ${preselectedCategory === '12th_marksheet' ? 'selected' : ''}>12th Marksheet / Diploma (HSC)</option>
            <option value="degree_certificate" ${preselectedCategory === 'degree_certificate' ? 'selected' : ''}>Graduation Degree / Sem Marksheets</option>
            <option value="pan_card" ${preselectedCategory === 'pan_card' ? 'selected' : ''}>PAN Card</option>
            <option value="aadhar_card" ${preselectedCategory === 'aadhar_card' ? 'selected' : ''}>Aadhar Card</option>
            <option value="passport_photo" ${preselectedCategory === 'passport_photo' ? 'selected' : ''}>Passport Size Photograph</option>
            <option value="internship_cert" ${preselectedCategory === 'internship_cert' ? 'selected' : ''}>Internship Certificate</option>
            <option value="course_cert" ${preselectedCategory === 'course_cert' ? 'selected' : ''}>Online Course / Tech Certification</option>
            <option value="other" ${preselectedCategory === 'other' ? 'selected' : ''}>Other Custom Document</option>
          </select>
        </div>

        <div class="form-group">
          <label>Document Title / Description *</label>
          <input type="text" id="uploadTitle" class="form-control" placeholder="e.g. Class 10th Passing Certificate & Marksheet" required>
        </div>

        <!-- Dynamic Extracted Score Field for Marksheets -->
        <div class="form-group" id="scoreFieldGroup">
          <label id="scoreFieldLabel"><i class="ri-award-line" style="color: var(--warning);"></i> Extracted Academic Score (% / CGPA) to Sync *</label>
          <input type="number" step="0.01" id="uploadScore" class="form-control" placeholder="e.g. 94.2">
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">
            <i class="ri-refresh-line"></i> Submitting this document will automatically update your profile score in system records!
          </div>
        </div>

        <div class="form-group">
          <label>Upload File (Max Size &lt; 5 MB) *</label>
          <div class="file-dropzone" id="dropzoneBox" onclick="document.getElementById('uploadFile').click()">
            <i class="ri-upload-cloud-line dropzone-icon"></i>
            <div style="font-weight: 600; color: #fff; margin-top: 8px;">Click or Drag & Drop File Here</div>
            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">PDF, PNG, JPG, WEBP (Maximum size: 5 MB)</div>
            <input type="file" id="uploadFile" accept=".pdf,.png,.jpg,.jpeg,.webp" style="display: none;" onchange="StudentPortal.handleFileSelected(event)">
          </div>
          <div id="fileSizeInfo" style="margin-top: 8px; font-size: 0.825rem; display: none;"></div>
        </div>

        <div class="form-group">
          <label>Additional Notes / Verification Info (Optional)</label>
          <input type="text" id="uploadNotes" class="form-control" placeholder="e.g. Issued by CBSE Board 2022">
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 24px;">
          <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary" id="btnUploadSubmit">
            <i class="ri-upload-2-line"></i> Upload & Sync Marks
          </button>
        </div>
      </form>
    `;

    openModal('Upload Candidate Document (< 5 MB)', modalHtml);
    this.handleCategoryChange(studentId);
  },

  async handleCategoryChange(studentId) {
    const cat = document.getElementById('uploadCategory').value;
    const titleInput = document.getElementById('uploadTitle');
    const scoreGroup = document.getElementById('scoreFieldGroup');
    const scoreLabel = document.getElementById('scoreFieldLabel');
    const scoreInput = document.getElementById('uploadScore');

    const presets = {
      '10th_marksheet': 'Class 10th Secondary Marksheet',
      '12th_marksheet': 'Class 12th Higher Secondary Marksheet',
      'degree_certificate': 'Graduation Degree / Semester Transcripts',
      'pan_card': 'PAN Card Identity',
      'aadhar_card': 'Aadhar Card Document',
      'passport_photo': 'Official Passport Size Photograph',
      'internship_cert': 'Internship Completion Certificate',
      'course_cert': 'Online Course Certificate',
      'other': 'Custom Candidate Document'
    };
    if (presets[cat]) titleInput.value = presets[cat];

    try {
      const students = await API.getStudents();
      const student = students.find(s => s.id === studentId);

      if (cat === '10th_marksheet') {
        scoreGroup.style.display = 'block';
        scoreLabel.innerHTML = '<i class="ri-award-line" style="color: var(--warning);"></i> Extracted Class 10th Percentage (%) to Sync *';
        scoreInput.placeholder = 'e.g. 94.2';
        if (student) scoreInput.value = student.class10Pct || 92.0;
      } else if (cat === '12th_marksheet') {
        scoreGroup.style.display = 'block';
        scoreLabel.innerHTML = '<i class="ri-award-line" style="color: var(--warning);"></i> Extracted Class 12th / Diploma Percentage (%) to Sync *';
        scoreInput.placeholder = 'e.g. 91.5';
        if (student) scoreInput.value = student.class12Pct || 90.0;
      } else if (cat === 'degree_certificate') {
        scoreGroup.style.display = 'block';
        scoreLabel.innerHTML = '<i class="ri-award-line" style="color: var(--warning);"></i> Extracted B.Tech CGPA (0.00 - 10.00) to Sync *';
        scoreInput.placeholder = 'e.g. 8.75';
        if (student) scoreInput.value = student.cgpa || 8.5;
      } else {
        scoreGroup.style.display = 'none';
        scoreInput.value = '';
      }
    } catch (err) {
      console.warn('Failed to load student score prefill', err);
    }
  },

  handleFileSelected(e) {
    const file = e.target.files[0];
    const infoDiv = document.getElementById('fileSizeInfo');
    const dropzone = document.getElementById('dropzoneBox');
    const submitBtn = document.getElementById('btnUploadSubmit');

    if (!file) return;

    const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);

    if (file.size > MAX_SIZE_BYTES) {
      showToast(`Error: "${file.name}" (${sizeMb} MB) exceeds 5 MB limit! Please select a file smaller than 5 MB.`, 'error');
      e.target.value = '';
      dropzone.style.borderColor = 'var(--danger)';
      infoDiv.style.display = 'block';
      infoDiv.innerHTML = `<span style="color: var(--danger); font-weight: 600;"><i class="ri-error-warning-fill"></i> File size ${sizeMb} MB is OVER 5 MB limit. Upload blocked!</span>`;
      if (submitBtn) submitBtn.disabled = true;
      return;
    }

    if (submitBtn) submitBtn.disabled = false;
    dropzone.style.borderColor = 'var(--success)';
    infoDiv.style.display = 'block';
    infoDiv.innerHTML = `
      <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid var(--success); padding: 10px; border-radius: var(--radius-md); color: var(--success);">
        <i class="ri-checkbox-circle-fill"></i> <strong>Selected File:</strong> ${file.name} (${sizeMb} MB / 5.00 MB)
        <div style="width: 100%; background: rgba(255,255,255,0.1); height: 6px; border-radius: 3px; margin-top: 6px; overflow: hidden;">
          <div style="width: ${(file.size / MAX_SIZE_BYTES) * 100}%; background: var(--success); height: 100%;"></div>
        </div>
      </div>
    `;
  },

  async handleUploadSubmit(e, studentId) {
    e.preventDefault();

    const category = document.getElementById('uploadCategory').value;
    const title = document.getElementById('uploadTitle').value;
    const fileInput = document.getElementById('uploadFile');
    const notes = document.getElementById('uploadNotes').value;
    const scoreVal = document.getElementById('uploadScore') ? document.getElementById('uploadScore').value : null;

    const file = fileInput.files[0];
    let fileData = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
    let fileName = `${title.toLowerCase().replace(/\s+/g, '_')}.pdf`;
    let fileType = 'application/pdf';
    let fileSize = 1500000;

    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('Error: File size must be less than 5 MB.', 'error');
        return;
      }
      fileName = file.name;
      fileType = file.type || 'application/pdf';
      fileSize = file.size;

      try {
        fileData = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (evt) => resolve(evt.target.result);
          reader.onerror = () => resolve('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');
          reader.readAsDataURL(file);
        });
      } catch (err) {
        console.warn('FileReader error, using fallback data URI');
      }
    }

    try {
      const res = await API.uploadDocument({
        studentId,
        category,
        title,
        fileName,
        fileType,
        fileSize,
        fileData,
        notes,
        score: scoreVal
      });

      closeModal();
      if (res.updatedScoreMsg) {
        showToast(`Document uploaded & ${res.updatedScoreMsg}!`, 'success');
      } else {
        showToast('Document uploaded successfully!', 'success');
      }
      this.renderDocumentsView(studentId, category);
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async handleDeleteDocument(docId, studentId) {
    if (!confirm('Are you sure you want to delete this uploaded document?')) return;

    try {
      await API.deleteDocument(docId);
      showToast('Document deleted.', 'info');
      this.renderDocumentsView(studentId);
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async previewDocument(docId) {
    try {
      const documents = await API.getDocuments();
      const doc = documents.find(d => d.id === docId);
      if (!doc) return showToast('Document not found', 'error');

      const isImage = doc.fileType && (doc.fileType.includes('image') || doc.fileName.match(/\.(jpg|jpeg|png|webp)$/i));

      let contentHtml = '';
      if (isImage) {
        contentHtml = `
          <div style="text-align: center; padding: 10px;">
            <img src="${doc.fileData}" alt="${doc.title}" style="max-width: 100%; max-height: 480px; border-radius: var(--radius-md); border: 1px solid var(--border-color); box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
            <div style="margin-top: 14px; color: var(--text-muted); font-size: 0.85rem;">
              <strong>${doc.title}</strong> • ${doc.fileSizeFormatted} • Uploaded on ${doc.uploadDate}
            </div>
          </div>
        `;
      } else {
        contentHtml = `
          <div style="border: 1px solid var(--border-color); border-radius: var(--radius-md); background: #0f172a; overflow: hidden;">
            <object data="${doc.fileData}" type="application/pdf" style="width: 100%; height: 420px; border: none; display: block;">
              <!-- Fallback PDF Card UI if browser blocks inline PDF rendering -->
              <div style="padding: 32px; text-align: center; background: radial-gradient(circle at center, rgba(99, 102, 241, 0.15) 0%, rgba(15, 23, 42, 0.95) 100%);">
                <div style="width: 70px; height: 70px; background: rgba(99, 102, 241, 0.2); border: 2px solid var(--primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 2.2rem; color: #fff;">
                  <i class="ri-file-pdf-fill"></i>
                </div>
                <div style="display: inline-block; background: rgba(16, 185, 129, 0.15); color: var(--success); border: 1px solid var(--success); padding: 4px 14px; border-radius: 20px; font-size: 0.75rem; font-weight: 700; margin-bottom: 12px;">
                  <i class="ri-shield-check-fill"></i> VERIFIED CANDIDATE CREDENTIAL
                </div>
                <h3 style="color: #fff; font-size: 1.2rem; margin-bottom: 6px;">${doc.title}</h3>
                <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 18px;">
                  Candidate: <strong>${doc.studentName || 'Rahul Sharma'} (${doc.studentId})</strong> • File: <code>${doc.fileName}</code> (${doc.fileSizeFormatted})
                </p>
                <div style="background: rgba(255,255,255,0.03); border: 1px dashed var(--border-glow); padding: 16px; border-radius: var(--radius-md); max-width: 480px; margin: 0 auto 20px; text-align: left;">
                  <div style="font-size: 0.825rem; color: var(--text-muted); margin-bottom: 6px;"><i class="ri-checkbox-circle-line" style="color: var(--success);"></i> Status: <strong style="color: var(--success);">${doc.status}</strong></div>
                  <div style="font-size: 0.825rem; color: var(--text-muted); margin-bottom: 6px;"><i class="ri-calendar-event-line" style="color: var(--primary);"></i> Upload Date: <strong>${doc.uploadDate}</strong></div>
                  <div style="font-size: 0.825rem; color: var(--text-muted);"><i class="ri-information-line" style="color: var(--secondary);"></i> Office Notes: <strong>${doc.notes || 'Verified by Training & Placement Office'}</strong></div>
                </div>
              </div>
            </object>
          </div>

          <div style="margin-top: 14px; display: flex; justify-content: space-between; align-items: center;">
            <div style="font-size: 0.85rem; color: var(--text-muted);">
              Document ID: <strong style="color: var(--accent-cyan);">${doc.id}</strong> (${doc.fileSizeFormatted})
            </div>
            <div style="display: flex; gap: 10px;">
              <a href="${doc.fileData}" target="_blank" download="${doc.fileName}" class="btn btn-primary btn-sm">
                <i class="ri-external-link-line"></i> Open / Download PDF
              </a>
            </div>
          </div>
        `;
      }

      openModal(`Document Preview: ${doc.title}`, contentHtml);
    } catch (err) {
      showToast('Failed to load document preview', 'error');
    }
  }
};


