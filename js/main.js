/**
 * main.js — Page initialization, hamburger menu, toggle wiring
 */
document.addEventListener("DOMContentLoaded", async () => {
  // ── Initialize i18n ──
  await I18n.init();

  // ── Language toggle button ──
  const langBtn = document.getElementById("lang-toggle");
  if (langBtn) {
    langBtn.addEventListener("click", () => I18n.toggle());
  }

  // ── Hamburger menu ──
  const hamburger = document.getElementById("hamburger");
  const nav = document.getElementById("main-nav");
  if (hamburger && nav) {
    hamburger.addEventListener("click", () => {
      hamburger.classList.toggle("open");
      nav.classList.toggle("open");
    });

    // Close menu when a nav link is clicked (mobile)
    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        hamburger.classList.remove("open");
        nav.classList.remove("open");
      });
    });
  }

  // ── Page-specific rendering ──
  const page = document.body.dataset.page;

  if (page === "home") {
    DataRenderer.renderNews("news-list");
  }

  if (page === "members") {
    DataRenderer.renderMembers("members-container");
  }

  if (page === "contact") {
    DataRenderer.renderContact();
  }

  if (page === "publications") {
    DataRenderer.renderPublications("publications-container");

    // Wire up filter buttons
    document.querySelectorAll(".pub-filter-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const container = document.getElementById("publications-container");
        if (container && container._setFilter) {
          container._setFilter(btn.dataset.filter);
        }
      });
    });
  }
});
