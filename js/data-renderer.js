/**
 * data-renderer.js — JSON loading & DOM rendering for dynamic content
 * Renders news, members, and publications from JSON data.
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
      const inner = `<div class="member-photo"><img src="${src}" alt="${alt}" onerror="this.src='${DEFAULT_PIC}'"></div>`;
      return m.url && m.url.trim()
        ? `<a class="member-photo-link" href="${m.url}" target="_blank" rel="noopener">${inner}</a>`
        : inner;
    }

    function affiliationsHtml(m) {
      if (!m.affiliation) return "";
      const list = Array.isArray(m.affiliation) ? m.affiliation : [m.affiliation];
      return list
        .map((a) => {
          const text = I18n.localize(a);
          return text
            ? `<div class="affiliation">${escapeHtml(text).replace(/\n/g, "<br>")}</div>`
            : "";
        })
        .join("");
    }

    function memberCard(m) {
      const nameHtml = m.url && m.url.trim()
        ? `<a href="${m.url}" target="_blank" rel="noopener">${I18n.localize(m.name)}</a>`
        : I18n.localize(m.name);
      const affiliationHtml = affiliationsHtml(m);
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
      const nameHtml = m.url && m.url.trim()
        ? `<a href="${m.url}" target="_blank" rel="noopener">${I18n.localize(m.name)}</a>`
        : I18n.localize(m.name);
      const affiliationHtml = affiliationsHtml(m);
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
      html += renderGroup(data.industry, { en: "Industry Collaborative Researcher", ja: "民間共同研究員" });
      html += renderGroup(data.students, { en: "Students", ja: "学生" });
      container.innerHTML = html;
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

  return { renderNews, renderMembers, renderPublications, renderContact };
})();
