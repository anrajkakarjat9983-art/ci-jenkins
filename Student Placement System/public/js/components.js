/* Shared UI Component Helpers */

// Toast Notifications
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const iconMap = {
    success: 'ri-checkbox-circle-fill',
    error: 'ri-error-warning-fill',
    info: 'ri-information-fill'
  };

  toast.innerHTML = `
    <i class="${iconMap[type] || iconMap.info}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Modal Windows
function openModal(title, contentHtml) {
  const modal = document.getElementById('globalModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalBody = document.getElementById('modalBody');

  modalTitle.textContent = title;
  modalBody.innerHTML = contentHtml;
  modal.classList.add('open');
}

function closeModal() {
  const modal = document.getElementById('globalModal');
  modal.classList.remove('open');
}

// Status Badges
function renderStatusBadge(status) {
  let badgeClass = 'badge-inprogress';
  if (status === 'Placed' || status === 'Offer Accepted' || status === 'Active' || status === 'Selected') {
    badgeClass = 'badge-placed';
  } else if (status === 'Unplaced' || status === 'Rejected' || status === 'Closed') {
    badgeClass = 'badge-unplaced';
  }
  return `<span class="badge ${badgeClass}">${status}</span>`;
}

// Metric Card Component
function renderMetricCard(title, value, subtext, iconClass, colorStyle = 'icon-indigo') {
  return `
    <div class="metric-card">
      <div class="metric-info">
        <p>${title}</p>
        <h3>${value}</h3>
        ${subtext ? `<span class="metric-sub">${subtext}</span>` : ''}
      </div>
      <div class="metric-icon-box ${colorStyle}">
        <i class="${iconClass}"></i>
      </div>
    </div>
  `;
}

// Application Progress Stepper Component
function renderApplicationTimeline(history = [], currentStage = 'Applied') {
  const stages = ['Applied', 'Assessment', 'Tech Interview', 'HR Interview', 'Offer Letter'];

  let activeIndex = 0;
  if (currentStage.includes('Assessment') || currentStage.includes('Task') || currentStage.includes('NQT')) activeIndex = 1;
  else if (currentStage.includes('Tech') || currentStage.includes('Coding')) activeIndex = 2;
  else if (currentStage.includes('HR') || currentStage.includes('Founder')) activeIndex = 3;
  else if (currentStage.includes('Offer') || currentStage.includes('Selected')) activeIndex = 4;

  let nodesHtml = '';
  stages.forEach((st, idx) => {
    let nodeState = '';
    if (idx < activeIndex) nodeState = 'completed';
    else if (idx === activeIndex) nodeState = 'active';

    nodesHtml += `
      <div class="step-node ${nodeState}" title="${st}">
        ${idx < activeIndex ? '<i class="ri-check-line"></i>' : idx + 1}
      </div>
    `;
  });

  return `
    <div class="timeline-stepper">
      ${nodesHtml}
    </div>
    <div class="timeline-labels">
      <span>Applied</span>
      <span>Screening</span>
      <span>Tech Round</span>
      <span>HR Round</span>
      <span>Offer</span>
    </div>
  `;
}
