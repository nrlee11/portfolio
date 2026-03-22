document.addEventListener("DOMContentLoaded", () => {
  // Intersection Observer for scroll animations
  const observerOptions = {
    root: null,
    rootMargin: "0px",
    threshold: 0.15,
  };

  const animateProgressBars = (target) => {
    const progressFills = target.querySelectorAll(".fill");
    progressFills.forEach((fill) => {
      const targetWidth = fill.getAttribute("data-width");
      // reset width briefly
      fill.style.width = "0%";
      // set actual width with slight delay for animation effect
      setTimeout(() => {
        fill.style.width = targetWidth;
      }, 300);
    });
  };

  const resetProgressBars = (target) => {
    const progressFills = target.querySelectorAll(".fill");
    progressFills.forEach((fill) => {
      fill.style.width = "0%";
    });
  };

  const observer = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        animateProgressBars(entry.target);
        // We keep observing so it animates when scrolled back into view
      } else {
        // Remove visible class to trigger animations again when scrolled back
        entry.target.classList.remove("visible");
        resetProgressBars(entry.target);
      }
    });
  }, observerOptions);

  // Observe target sections and any elements that use animation classes
  const sections = document.querySelectorAll(
    ".target-section, .fade-up, .fade-right, .fade-left, .bounce-in, .slide-right, .slide-left",
  );
  sections.forEach((section) => {
    observer.observe(section);
  });

  // Lightbox for banner images
  const createLightbox = (src, caption) => {
    const overlay = document.createElement("div");
    overlay.className = "lightbox-overlay";
    overlay.tabIndex = -1;
    const content = document.createElement("div");
    content.className = "lightbox-content";
    const img = document.createElement("img");
    img.src = src;
    img.alt = caption || "";
    const cap = document.createElement("div");
    cap.className = "lightbox-caption";
    cap.textContent = caption || "";

    // Close button
    const closeBtn = document.createElement("button");
    closeBtn.className = "lightbox-close";
    closeBtn.type = "button";
    closeBtn.setAttribute("aria-label", "Close");
    closeBtn.innerHTML = "&times;";

    // Build structure: append image/content, but put close button on overlay so it stays fixed
    content.appendChild(img);
    if (caption) content.appendChild(cap);
    overlay.appendChild(closeBtn);
    overlay.appendChild(content);

    // Prevent clicks inside content from closing the overlay
    content.addEventListener("click", (ev) => {
      ev.stopPropagation();
    });

    // Overlay click closes
    overlay.addEventListener("click", () => {
      overlay.remove();
      document.removeEventListener("keydown", onKey);
    });

    // Close button closes
    closeBtn.addEventListener("click", (ev) => {
      ev.stopPropagation();
      overlay.remove();
      document.removeEventListener("keydown", onKey);
    });

    document.body.appendChild(overlay);
    // focus for accessibility
    closeBtn.focus();

    const onKey = (e) => {
      if (e.key === "Escape") {
        overlay.remove();
        document.removeEventListener("keydown", onKey);
      }
    };
    document.addEventListener("keydown", onKey);
  };

  document.querySelectorAll(".banner-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      const img = link.querySelector("img.banner-preview");
      if (!img) return;
      e.preventDefault();
      const src = img.src;
      const caption =
        link.querySelector(".banner-caption")?.textContent || img.alt || "";
      createLightbox(src, caption);
    });
  });

  // Carousel: simple responsive carousel for .carousel elements
  const initCarousel = (carouselEl) => {
    const track = carouselEl.querySelector(".carousel-track");
    const slides = Array.from(carouselEl.querySelectorAll(".carousel-slide"));
    const prevBtn = carouselEl.querySelector(".carousel-btn.prev");
    const nextBtn = carouselEl.querySelector(".carousel-btn.next");
    const dotsContainer = carouselEl.querySelector(".carousel-dots");

    if (!track || slides.length === 0) return;

    let slidesPerPage = getSlidesPerPage();
    let currentPage = 0;

    function getSlidesPerPage() {
      const w = window.innerWidth;
      if (w <= 760) return 1;
      if (w <= 1200) return 2;
      return 4;
    }

    function update() {
      slidesPerPage = getSlidesPerPage();
      const pageCount = Math.max(1, Math.ceil(slides.length / slidesPerPage));
      // clamp currentPage
      if (currentPage >= pageCount) currentPage = pageCount - 1;
      const slideWidth =
        slides[0].getBoundingClientRect().width +
        parseFloat(getComputedStyle(track).gap || 0);
      const offset = currentPage * slidesPerPage * slideWidth;
      track.style.transform = `translateX(-${offset}px)`;

      // rebuild dots
      dotsContainer.innerHTML = "";
      for (let i = 0; i < pageCount; i++) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.setAttribute("aria-label", `Go to page ${i + 1}`);
        if (i === currentPage) btn.classList.add("active");
        btn.addEventListener("click", () => {
          currentPage = i;
          update();
        });
        dotsContainer.appendChild(btn);
      }
    }

    prevBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      currentPage = Math.max(0, currentPage - 1);
      update();
    });
    nextBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const pageCount = Math.ceil(slides.length / slidesPerPage);
      currentPage = Math.min(pageCount - 1, currentPage + 1);
      update();
    });

    // Recompute on resize
    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(update, 120);
    });

    // initial
    // wait a tick to ensure sizes
    setTimeout(update, 50);
  };

  document.querySelectorAll(".carousel").forEach(initCarousel);
  // Slider for banners-grid inside .slider wrappers: moves one card at a time
  const initSlider = (sliderEl) => {
    const track = sliderEl.querySelector(".banners-grid");
    const slides = Array.from(sliderEl.querySelectorAll(".banner-item"));
    const prevBtn = sliderEl.querySelector(".slider-btn.prev");
    const nextBtn = sliderEl.querySelector(".slider-btn.next");
    const dotsContainer = sliderEl.querySelector(".slider-dots");
    if (!track || slides.length === 0) return;

    let slidesPerView = getSlidesPerView();
    let currentPage = 0; // page-based index

    function getSlidesPerView() {
      const w = window.innerWidth;
      if (w <= 760) return 1;
      if (w <= 1200) return 2;
      return 4;
    }

    function update() {
      slidesPerView = getSlidesPerView();
      const pageCount = Math.max(1, Math.ceil(slides.length / slidesPerView));
      if (currentPage >= pageCount) currentPage = pageCount - 1;

      const gap = parseFloat(getComputedStyle(track).gap) || 0;
      const slideWidth = slides[0].getBoundingClientRect().width + gap;
      const offset = currentPage * slidesPerView * slideWidth;
      track.style.transform = `translateX(-${offset}px)`;

      // rebuild dots: one dot per page
      dotsContainer.innerHTML = "";
      for (let i = 0; i < pageCount; i++) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.setAttribute("aria-label", `Go to page ${i + 1}`);
        if (i === currentPage) btn.classList.add("active");
        btn.addEventListener("click", () => {
          currentPage = i;
          update();
        });
        dotsContainer.appendChild(btn);
      }
    }

    prevBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      currentPage = Math.max(0, currentPage - 1);
      update();
    });
    nextBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const pageCount = Math.max(1, Math.ceil(slides.length / slidesPerView));
      currentPage = Math.min(pageCount - 1, currentPage + 1);
      update();
    });

    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(update, 120);
    });

    // initial layout
    setTimeout(update, 50);
  };

  document.querySelectorAll(".slider").forEach(initSlider);
});
