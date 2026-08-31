/* Placement Officer (TPO) Panel Logic & Views */

const TpoPortal = {
  // 1. TPO DASHBOARD
  async renderDashboardView() {
    const container = document.getElementById('viewContainer');
    container.innerHTML = `<div class="loading-state">Loading TPO Portal...</div>`;

    try {
      const stats = await API.getStats();
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

      let recentPlacementsHtml = placements.slice(0, 4).map(p => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--border-color);">
          <div>
            <strong style="color: #fff;">${p.studentName}</strong> (${p.branch})
            <div style="font-size: 0.8rem; color: var(--text-muted);">${p.company} • ${p.role}</div>
          </div>
          <div style="text-align: right;">
            <span style="color: var(--success); font-weight: 700;">${p.package}</span>
            <div style="font-size: 0.75rem; color: var(--text-dim);">${p.placedDate}</div>
          </div>
        </div>
      `).join('');

      container.innerHTML = `
        <div class="page-header">
          <div class="page-title">
            <h2>Placement Officer (TPO) Desk</h2>
            <p>Campus recruitment administration, eligibility enforcement, and placement statistics.</p>
          </div>
          <a href="${API.exportStudentsUrl()}" class="btn btn-primary">
            <i class="ri-file-download-line"></i> Download Master Report (CSV)
          </a>
        </div>

        <div class="metrics-grid">
          ${renderMetricCard('Placement Rate', `${stats.placementRate}%`, `${stats.placedStudents} of ${stats.totalStudents} Candidates`, 'ri-line-chart-line', 'icon-emerald')}
          ${renderMetricCard('Partner Companies', stats.activeCompanies, 'Approved Recruiter Companies', 'ri-building-line', 'icon-purple')}
          ${renderMetricCard('Active Drives', stats.activeDrives, 'Ongoing Recruitment Drives', 'ri-briefcase-line', 'icon-indigo')}
          ${renderMetricCard('Shortlisted Candidates', stats.shortlistedStudents, 'In Selection Process', 'ri-user-star-line', 'icon-cyan')}
        </div>

        <div class="dashboard-row">
          <div class="panel-card">
            <div class="panel-title">
              <h3><i class="ri-bar-chart-grouped-line" style="color: var(--primary);"></i> Branch Placement Analytics</h3>
            </div>
            <div class="branch-chart-list">
              ${branchBarsHtml}
            </div>
          </div>

          <div class="panel-card">
            <div class="panel-title">
              <h3><i class="ri-trophy-line" style="color: var(--secondary);"></i> Recent Placements</h3>
            </div>
            <div>
              ${recentPlacementsHtml || '<p style="color: var(--text-muted);">No placement records.</p>'}
            </div>
          </div>
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="error-state">Failed to load TPO desk: ${err.message}</div>`;
    }
  },

  // 2. VISITING COMPANIES MANAGER
  async renderCompaniesView() {
    const container = document.getElementById('viewContainer');
    container.innerHTML = `<div class="loading-state">Loading Companies Directory...</div>`;

    try {
      const companies = await API.getCompanies();

      let cardsHtml = companies.map(c => `
        <div class="drive-card">
          <div class="drive-header">
            <div class="company-title">
              <h4>${c.name}</h4>
              <p>${c.sector}</p>
            </div>
            <span class="badge badge-placed"><i class="ri-star-fill" style="color: #f59e0b;"></i> ${c.rating}</span>
          </div>
          <div class="drive-requirements">
            <div class="req-item"><i class="ri-user-2-line"></i> HR: ${c.hrName}</div>
            <div class="req-item"><i class="ri-mail-line"></i> Email: ${c.hrEmail}</div>
            <div class="req-item"><i class="ri-phone-line"></i> Phone: ${c.hrPhone}</div>
            <div class="req-item"><i class="ri-map-pin-line"></i> Location: ${c.location}</div>
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; pt: 12px; border-top: 1px solid var(--border-color);">
            <span class="badge badge-active">${c.status}</span>
            <a href="${c.website}" target="_blank" class="btn btn-secondary btn-sm">
              <i class="ri-external-link-line"></i> Career Portal
            </a>
          </div>
        </div>
      `).join('');

      container.innerHTML = `
        <div class="page-header">
          <div class="page-title">
            <h2>Approved Recruiter Companies</h2>
            <p>Directory of visiting corporate partners and recruiter contact leads.</p>
          </div>
          <button class="btn btn-primary" onclick="TpoPortal.openNewCompanyModal()">
            <i class="ri-add-line"></i> Add Partner Company
          </button>
        </div>

        <div class="drives-grid">
          ${cardsHtml}
        </div>
      `;
    } catch (err) {
      container.innerHTML = `<div class="error-state">Failed to load companies: ${err.message}</div>`;
    }
  },

  openNewCompanyModal() {
    const formHtml = `
      <form onsubmit="TpoPortal.handleCreateCompany(event)">
        <div class="form-group">
          <label>Company Name</label>
          <input type="text" id="compName" class="form-control" placeholder="e.g. Oracle, Salesforce, Nvidia" required>
        </div>
        <div class="form-group">
          <label>Industry Sector</label>
          <input type="text" id="compSector" class="form-control" placeholder="e.g. Enterprise Cloud & Databases">
        </div>
        <div class="form-group" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
          <div>
            <label>HR Contact Name</label>
            <input type="text" id="compHrName" class="form-control" placeholder="e.g. Priya Sharma">
          </div>
          <div>
            <label>HR Email Address</label>
            <input type="email" id="compHrEmail" class="form-control" placeholder="e.g. priya@oracle.com">
          </div>
        </div>
        <div class="form-group">
          <label>Company Website</label>
          <input type="url" id="compWebsite" class="form-control" placeholder="https://oracle.com">
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 12px; margin-top: 20px;">
          <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancel</button>
          <button type="submit" class="btn btn-primary">Add Partner Company</button>
        </div>
      </form>
    `;
    openModal('Add Visiting Partner Company', formHtml);
  },

  async handleCreateCompany(e) {
    e.preventDefault();
    const compData = {
      name: document.getElementById('compName').value,
      sector: document.getElementById('compSector').value,
      hrName: document.getElementById('compHrName').value,
      hrEmail: document.getElementById('compHrEmail').value,
      website: document.getElementById('compWebsite').value
    };

    try {
      await API.createCompany(compData);
      showToast('Partner company added successfully!', 'success');
      closeModal();
      this.renderCompaniesView();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }
};
