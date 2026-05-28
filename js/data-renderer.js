/**
 * data-renderer.js — JSON loading & DOM rendering for dynamic content
 * Renders news, members, publications, and projects from JSON data.
 */
const DataRenderer = (() => {
  async function fetchJSON(path) {
    const res = await fetch(path);
    return res.json();
  }

  // ── News ──
  async function renderNews(containerId, limit = 5) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const news = await fetchJSON("data/news.json");
    const sorted = news.sort((a, b) => b.date.localeCompare(a.date));
    const items = sorted.slice(0, limit);

    function render() {
      container.innerHTML = items
        .map(
          (item) => `
        <div class="news-item">
          <span class="news-date">${item.date}</span>
          <span class="news-title">${I18n.localize(item.title)}</span>
        </div>`
        )
        .join("");
    }

    render();
    I18n.onChange(render);
  }

  // ── Members ──
  async function renderMembers(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const data = await fetchJSON("data/members.json");
    const DEFAULT_PIC = "images/members/default.svg";

    function escapeHtml(s) {
      return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    function photoHtml(m) {
      const src = m.pic && m.pic.trim() ? m.pic : DEFAULT_PIC;
      const alt = I18n.localize(m.name);
      return `<div class="member-photo"><img src="${src}" alt="${alt}" onerror="this.src='${DEFAULT_PIC}'"></div>`;
    }

    function memberCard(m) {
      const nameHtml = m.web
        ? `<a href="${m.web}" target="_blank">${I18n.localize(m.name)}</a>`
        : I18n.localize(m.name);
      const affiliation = m.affiliation ? I18n.localize(m.affiliation) : "";
      const affiliationHtml = affiliation
        ? `<div class="affiliation">${escapeHtml(affiliation).replace(/\n/g, "<br>")}</div>`
        : "";
      return `
          <div class="student-card">
            ${photoHtml(m)}
            <h4>${nameHtml}</h4>
            <div class="research">${I18n.localize(m.title)}</div>
            ${affiliationHtml}
          </div>`;
    }

    function renderGroup(members, label) {
      if (!members || !members.length) return "";
      let html = `<h3 class="member-group-title">${I18n.localize(label)}</h3>`;
      html += '<div class="student-grid">';
      members.forEach((m) => { html += memberCard(m); });
      html += "</div>";
      return html;
    }

    function messageCard(m) {
      const nameHtml = m.web
        ? `<a href="${m.web}" target="_blank">${I18n.localize(m.name)}</a>`
        : I18n.localize(m.name);
      const affiliation = m.affiliation ? I18n.localize(m.affiliation) : "";
      const affiliationHtml = affiliation
        ? `<div class="affiliation">${escapeHtml(affiliation).replace(/\n/g, "<br>")}</div>`
        : "";
      const messageText = m.message ? I18n.localize(m.message) : "";
      const placeholder = I18n.localize({
        en: "(Message coming soon)",
        ja: "（メッセージ準備中）",
      });
      const bodyClass = messageText.trim() ? "message-body" : "message-body message-body--empty";
      const bodyContent = messageText.trim()
        ? escapeHtml(messageText).replace(/\n/g, "<br>")
        : escapeHtml(placeholder);
      return `
          <div class="message-card">
            <div class="message-header">
              ${photoHtml(m)}
              <div class="message-meta">
                <h4>${nameHtml}</h4>
                <div class="research">${I18n.localize(m.title)}</div>
                ${affiliationHtml}
              </div>
            </div>
            <blockquote class="${bodyClass}">${bodyContent}</blockquote>
          </div>`;
    }

    function renderMessageGroup(messages) {
      if (!messages || !messages.length) return "";
      let html = '<div class="message-grid">';
      messages.forEach((m) => { html += messageCard(m); });
      html += "</div>";
      return html;
    }

    function render() {
      let html = "";
      html += renderMessageGroup(data.messages);
      html += renderGroup(data.faculty, { en: "Faculty & Staff", ja: "教職員" });
      html += renderGroup(data.fellows, { en: "Cooperative Research Fellow", ja: "協力研究者" });
      html += renderGroup(data.students, { en: "Students", ja: "学生" });
      container.innerHTML = html;
    }

    render();
    I18n.onChange(render);
  }

  // ── Projects ──
  async function renderProjects(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const projects = await fetchJSON("data/projects.json");

    function render() {
      container.innerHTML = projects
        .map((p) => {
          const statusClass = p.status === "active" ? "project-status--active" : "project-status--completed";
          const statusLabel =
            p.status === "active"
              ? I18n.localize({ en: "Active", ja: "進行中" })
              : I18n.localize({ en: "Completed", ja: "完了" });
          const keywords = p.keywords
            .map((k) => `<span class="keyword-tag">${k}</span>`)
            .join("");
          return `
          <div class="project-card">
            <h3>${I18n.localize(p.title)}</h3>
            <span class="project-status ${statusClass}">${statusLabel}</span>
            <p class="project-description">${I18n.localize(p.description)}</p>
            <div class="project-keywords">${keywords}</div>
          </div>`;
        })
        .join("");
    }

    render();
    I18n.onChange(render);
  }

  // ── Publications ──
  async function renderPublications(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const pubs = await fetchJSON("data/publications.json");
    let activeFilter = "all";

    function render() {
      const filtered =
        activeFilter === "all" ? pubs : pubs.filter((p) => p.type === activeFilter);

      // Group by year
      const byYear = {};
      filtered.forEach((p) => {
        if (!byYear[p.year]) byYear[p.year] = [];
        byYear[p.year].push(p);
      });

      const years = Object.keys(byYear).sort((a, b) => b - a);

      let html = "";
      years.forEach((year) => {
        html += `<div class="pub-year-group">`;
        html += `<h3 class="pub-year">${year}</h3>`;
        byYear[year].forEach((p) => {
          const typeBadge = `<span class="pub-type-badge pub-type-badge--${p.type}">${p.type}</span>`;
          const awardBadge = p.award
            ? `<span class="pub-award-badge">${p.award}</span>`
            : "";
          html += `
          <div class="pub-item" data-type="${p.type}">
            <span class="pub-authors">${p.authors}.</span>
            <span class="pub-title"> ${I18n.localize(p.title)}.</span>
            <span class="pub-venue"> ${p.venue}.</span>
            ${typeBadge}${awardBadge}
          </div>`;
        });
        html += `</div>`;
      });

      container.innerHTML = html;
    }

    function setFilter(type) {
      activeFilter = type;
      // Update button states
      document.querySelectorAll(".pub-filter-btn").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.filter === type);
      });
      render();
    }

    // Expose filter setter on the container for main.js to wire up
    container._setFilter = setFilter;

    render();
    I18n.onChange(render);
  }

  // ── Contact ──
  async function renderContact() {
    const data = await fetchJSON("data/contact.json");

    const addressEl = document.getElementById("contact-address");
    const emailEl = document.getElementById("contact-email");
    const accessEl = document.getElementById("contact-access");
    const mapEl = document.getElementById("contact-map");

    function escapeHtml(s) {
      return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    function render() {
      if (addressEl) {
        addressEl.innerHTML = escapeHtml(I18n.localize(data.address)).replace(/\n/g, "<br>");
      }
      if (emailEl && data.email) {
        emailEl.innerHTML = `<a href="mailto:${data.email}">${data.email}</a>`;
      }
      if (accessEl) {
        accessEl.textContent = I18n.localize(data.access);
      }
    }

    if (mapEl && data.map_embed) {
      mapEl.innerHTML = `<iframe src="${data.map_embed}" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>`;
    }

    render();
    I18n.onChange(render);
  }

  return { renderNews, renderMembers, renderProjects, renderPublications, renderContact };
})();
