/* Master Application Controller & Router across all 4 Panels */

const App = {
  activeRole: 'admin',      // 'admin', 'tpo', 'recruiter_google', 'recruiter_microsoft', or student ID 'STU001'
  activeView: 'admin-analytics',
  viewParams: {},
  currentUser: null,

  init() {
    this.bindRoleSwitcher();
    const savedUser = localStorage.getItem('placement_user');
    if (savedUser) {
      try {
        this.currentUser = JSON.parse(savedUser);
        this.hideLoginScreen();
        this.applyUserRole(this.currentUser);
      } catch (err) {
        this.showLoginScreen();
      }
    } else {
      this.showLoginScreen();
    }
  },

  showLoginScreen() {
    const screen = document.getElementById('loginScreen');
    if (screen) screen.style.display = 'flex';
  },

  hideLoginScreen() {
    const screen = document.getElementById('loginScreen');
    if (screen) screen.style.display = 'none';
  },

  switchAuthTab(tabName) {
    const tabSignIn = document.getElementById('tabSignIn');
    const tabSignUp = document.getElementById('tabSignUp');
    const signInContainer = document.getElementById('signInContainer');
    const signUpContainer = document.getElementById('signUpContainer');

    if (tabName === 'signin') {
      tabSignIn.classList.add('active');
      tabSignUp.classList.remove('active');
      signInContainer.style.display = 'block';
      signUpContainer.style.display = 'none';
    } else {
      tabSignUp.classList.add('active');
      tabSignIn.classList.remove('active');
      signInContainer.style.display = 'none';
      signUpContainer.style.display = 'block';
    }
  },

  handleRegRoleChange() {
    const role = document.getElementById('regRole').value;
    const studentFields = document.getElementById('regStudentFields');
    const recruiterFields = document.getElementById('regRecruiterFields');

    if (role === 'student') {
      studentFields.style.display = 'block';
      recruiterFields.style.display = 'none';
    } else if (role === 'recruiter') {
      studentFields.style.display = 'none';
      recruiterFields.style.display = 'block';
    } else {
      studentFields.style.display = 'none';
      recruiterFields.style.display = 'none';
    }
  },

  fillDemoLogin(email, password) {
    document.getElementById('loginEmail').value = email;
    document.getElementById('loginPassword').value = password;
  },

  async handleLoginForm(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
      const res = await API.login(email, password);
      this.currentUser = res.user;
      localStorage.setItem('placement_user', JSON.stringify(res.user));
      this.hideLoginScreen();
      showToast(`Welcome back, ${res.user.name}!`, 'success');
      this.applyUserRole(res.user);
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  async handleSignupForm(e) {
    e.preventDefault();
    const userData = {
      name: document.getElementById('regName').value,
      email: document.getElementById('regEmail').value,
      password: document.getElementById('regPassword').value,
      role: document.getElementById('regRole').value,
      branch: document.getElementById('regBranch') ? document.getElementById('regBranch').value : 'Computer Science',
      cgpa: document.getElementById('regCgpa') ? parseFloat(document.getElementById('regCgpa').value) : 8.0,
      companyName: document.getElementById('regCompanyName') ? document.getElementById('regCompanyName').value : 'Partner Corp'
    };

    try {
      const res = await API.register(userData);
      this.currentUser = res.user;
      localStorage.setItem('placement_user', JSON.stringify(res.user));
      this.hideLoginScreen();
      showToast('Registration successful! Welcome to the portal.', 'success');
      this.applyUserRole(res.user);
    } catch (err) {
      showToast(err.message, 'error');
    }
  },

  handleLogout() {
    localStorage.removeItem('placement_user');
    this.currentUser = null;
    this.showLoginScreen();
    showToast('Logged out successfully.', 'info');
  },

  applyUserRole(user) {
    let roleVal = 'admin';
    if (user.role === 'tpo') roleVal = 'tpo';
    else if (user.role === 'recruiter') {
      roleVal = user.companyId === 'COMP002' ? 'recruiter_microsoft' : 'recruiter_google';
    } else if (user.role === 'student') {
      roleVal = user.studentId || 'STU001';
    }

    const select = document.getElementById('roleSelect');
    if (select) select.value = roleVal;
    this.switchRole(roleVal);
  },

  bindRoleSwitcher() {
    const select = document.getElementById('roleSelect');
    if (!select) return;

    select.addEventListener('change', (e) => {
      this.switchRole(e.target.value);
    });
  },

  async switchRole(roleValue) {
    this.activeRole = roleValue;

    const avatar = document.getElementById('userAvatar');
    const nameEl = document.getElementById('userName');
    const labelEl = document.getElementById('userRoleLabel');

    if (roleValue === 'admin') {
      avatar.textContent = 'A';
      avatar.style.background = 'var(--primary)';
      nameEl.textContent = 'Dr. V. K. Sharma';
      labelEl.textContent = 'System Director (Admin)';
      this.renderAdminSidebar();
      this.navigateTo('admin-analytics');
    } else if (roleValue === 'tpo') {
      avatar.textContent = 'T';
      avatar.style.background = 'var(--secondary)';
      nameEl.textContent = 'Prof. Archana Rao';
      labelEl.textContent = 'TPO Officer Head';
      this.renderTpoSidebar();
      this.navigateTo('tpo-dashboard');
    } else if (roleValue.startsWith('recruiter')) {
      avatar.textContent = 'R';
      avatar.style.background = 'var(--accent-cyan)';
      const compId = roleValue === 'recruiter_google' ? 'COMP001' : 'COMP002';
      const compName = roleValue === 'recruiter_google' ? 'Google' : 'Microsoft';
      nameEl.textContent = roleValue === 'recruiter_google' ? 'Sarah Jenkins' : 'Rajesh Kumar';
      labelEl.textContent = `${compName} Recruiter`;
      this.renderRecruiterSidebar(compId);
      this.navigateTo('recruiter-dashboard', { companyId: compId });
    } else {
      // Student Role
      try {
        const students = await API.getStudents();
        const student = students.find(s => s.id === roleValue) || students[0];

        avatar.textContent = student.name.charAt(0);
        avatar.style.background = 'var(--warning)';
        nameEl.textContent = student.name;
        labelEl.textContent = `${student.branch} Candidate`;
        this.renderStudentSidebar();
        this.navigateTo('student-overview');
      } catch (err) {
        console.error('Error switching to student role:', err);
      }
    }
  },

  renderAdminSidebar() {
    const menu = document.getElementById('sidebarMenu');
    menu.innerHTML = `
      <div class="nav-section-title">ADMINISTRATOR PANEL</div>
      <a class="nav-item ${this.activeView === 'admin-analytics' ? 'active' : ''}" onclick="App.navigateTo('admin-analytics')">
        <i class="ri-dashboard-line nav-icon"></i>
        <span>Dashboard (8 Cards)</span>
      </a>
      <a class="nav-item ${this.activeView === 'admin-students' ? 'active' : ''}" onclick="App.navigateTo('admin-students')">
        <i class="ri-user-search-line nav-icon"></i>
        <span>Student Management</span>
      </a>
      <a class="nav-item ${this.activeView === 'admin-doc-approvals' ? 'active' : ''}" onclick="App.navigateTo('admin-doc-approvals')">
        <i class="ri-checkbox-circle-line nav-icon"></i>
        <span>Document Approvals</span>
      </a>
      <a class="nav-item ${this.activeView === 'admin-drives' ? 'active' : ''}" onclick="App.navigateTo('admin-drives')">
        <i class="ri-briefcase-4-line nav-icon"></i>
        <span>Placement Drives</span>
      </a>
      <a class="nav-item ${this.activeView === 'admin-applications' ? 'active' : ''}" onclick="App.navigateTo('admin-applications')">
        <i class="ri-git-commit-line nav-icon"></i>
        <span>Applications & Pipeline</span>
      </a>
      <a class="nav-item ${this.activeView === 'admin-interviews' ? 'active' : ''}" onclick="App.navigateTo('admin-interviews')">
        <i class="ri-calendar-event-line nav-icon"></i>
        <span>Interviews Schedule</span>
      </a>
      <a class="nav-item ${this.activeView === 'admin-placements' ? 'active' : ''}" onclick="App.navigateTo('admin-placements')">
        <i class="ri-trophy-line nav-icon"></i>
        <span>Placement Ledger</span>
      </a>
    `;
  },

  renderTpoSidebar() {
    const menu = document.getElementById('sidebarMenu');
    menu.innerHTML = `
      <div class="nav-section-title">PLACEMENT OFFICER (TPO)</div>
      <a class="nav-item ${this.activeView === 'tpo-dashboard' ? 'active' : ''}" onclick="App.navigateTo('tpo-dashboard')">
        <i class="ri-line-chart-line nav-icon"></i>
        <span>TPO Analytics</span>
      </a>
      <a class="nav-item ${this.activeView === 'tpo-companies' ? 'active' : ''}" onclick="App.navigateTo('tpo-companies')">
        <i class="ri-building-line nav-icon"></i>
        <span>Visiting Companies</span>
      </a>
      <a class="nav-item ${this.activeView === 'admin-students' ? 'active' : ''}" onclick="App.navigateTo('admin-students')">
        <i class="ri-group-line nav-icon"></i>
        <span>Students Verification</span>
      </a>
      <a class="nav-item ${this.activeView === 'admin-doc-approvals' ? 'active' : ''}" onclick="App.navigateTo('admin-doc-approvals')">
        <i class="ri-checkbox-circle-line nav-icon"></i>
        <span>Document Approvals</span>
      </a>
      <a class="nav-item ${this.activeView === 'admin-drives' ? 'active' : ''}" onclick="App.navigateTo('admin-drives')">
        <i class="ri-task-line nav-icon"></i>
        <span>Drives Approvals</span>
      </a>
      <a class="nav-item ${this.activeView === 'admin-interviews' ? 'active' : ''}" onclick="App.navigateTo('admin-interviews')">
        <i class="ri-time-line nav-icon"></i>
        <span>Interview Logistics</span>
      </a>
    `;
  },

  renderRecruiterSidebar(companyId) {
    const menu = document.getElementById('sidebarMenu');
    menu.innerHTML = `
      <div class="nav-section-title">RECRUITER PORTAL</div>
      <a class="nav-item ${this.activeView === 'recruiter-dashboard' ? 'active' : ''}" onclick="App.navigateTo('recruiter-dashboard', { companyId: '${companyId}' })">
        <i class="ri-layout-grid-line nav-icon"></i>
        <span>Recruiter Desk</span>
      </a>
      <a class="nav-item ${this.activeView === 'recruiter-applicants' ? 'active' : ''}" onclick="App.navigateTo('recruiter-applicants')">
        <i class="ri-file-user-line nav-icon"></i>
        <span>View Applicants</span>
      </a>
    `;
  },

  renderStudentSidebar() {
    const menu = document.getElementById('sidebarMenu');
    menu.innerHTML = `
      <div class="nav-section-title">STUDENT CANDIDATE</div>
      <a class="nav-item ${this.activeView === 'student-overview' ? 'active' : ''}" onclick="App.navigateTo('student-overview')">
        <i class="ri-user-smile-line nav-icon"></i>
        <span>My Dashboard</span>
      </a>
      <a class="nav-item ${this.activeView === 'student-drives' ? 'active' : ''}" onclick="App.navigateTo('student-drives')">
        <i class="ri-briefcase-line nav-icon"></i>
        <span>Available Drives</span>
      </a>
      <a class="nav-item ${this.activeView === 'student-tracker' ? 'active' : ''}" onclick="App.navigateTo('student-tracker')">
        <i class="ri-route-line nav-icon"></i>
        <span>My Applications</span>
      </a>
      <a class="nav-item ${this.activeView === 'student-interviews' ? 'active' : ''}" onclick="App.navigateTo('student-interviews')">
        <i class="ri-calendar-check-line nav-icon"></i>
        <span>Interview Schedule</span>
      </a>
      <a class="nav-item ${this.activeView === 'student-profile' ? 'active' : ''}" onclick="App.navigateTo('student-profile')">
        <i class="ri-file-text-line nav-icon"></i>
        <span>Profile & Resume</span>
      </a>
      <a class="nav-item ${this.activeView === 'student-documents' ? 'active' : ''}" onclick="App.navigateTo('student-documents')">
        <i class="ri-folder-user-line nav-icon"></i>
        <span>My Documents (<5MB)</span>
      </a>
      <a class="nav-item ${this.activeView === 'student-offers' ? 'active' : ''}" onclick="App.navigateTo('student-offers')">
        <i class="ri-shake-hands-line nav-icon"></i>
        <span>Placement Status</span>
      </a>
    `;
  },

  navigateTo(viewName, params = {}) {
    this.activeView = viewName;
    this.viewParams = params;

    // Refresh Sidebar highlight
    if (this.activeRole === 'admin') this.renderAdminSidebar();
    else if (this.activeRole === 'tpo') this.renderTpoSidebar();
    else if (this.activeRole.startsWith('recruiter')) {
      const compId = this.activeRole === 'recruiter_google' ? 'COMP001' : 'COMP002';
      this.renderRecruiterSidebar(compId);
    } else this.renderStudentSidebar();

    // Render View
    switch (viewName) {
      // Admin Views
      case 'admin-analytics':
        AdminPortal.renderAnalyticsView();
        break;
      case 'admin-students':
        AdminPortal.renderStudentsView();
        break;
      case 'admin-doc-approvals':
        AdminPortal.renderDocApprovalsView();
        break;
      case 'admin-drives':
        AdminPortal.renderDrivesView();
        break;
      case 'admin-applications':
        AdminPortal.renderApplicationsView(params);
        break;
      case 'admin-interviews':
        AdminPortal.renderInterviewsView();
        break;
      case 'admin-placements':
        AdminPortal.renderPlacementsView();
        break;

      // TPO Views
      case 'tpo-dashboard':
        TpoPortal.renderDashboardView();
        break;
      case 'tpo-companies':
        TpoPortal.renderCompaniesView();
        break;

      // Recruiter Views
      case 'recruiter-dashboard':
        RecruiterPortal.renderDashboardView(params.companyId || (this.activeRole === 'recruiter_google' ? 'COMP001' : 'COMP002'));
        break;
      case 'recruiter-applicants':
        RecruiterPortal.renderApplicantsView(params);
        break;

      // Student Views
      case 'student-overview':
        StudentPortal.renderOverviewView(this.activeRole);
        break;
      case 'student-drives':
        StudentPortal.renderDrivesExplorerView(this.activeRole);
        break;
      case 'student-tracker':
        StudentPortal.renderApplicationsTrackerView(this.activeRole);
        break;
      case 'student-interviews':
        StudentPortal.renderInterviewScheduleView(this.activeRole);
        break;
      case 'student-profile':
        StudentPortal.renderProfileView(this.activeRole);
        break;
      case 'student-documents':
        StudentPortal.renderDocumentsView(this.activeRole);
        break;
      case 'student-offers':
        StudentPortal.renderOffersView(this.activeRole);
        break;

      default:
        console.warn('Unknown view:', viewName);
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
