const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwcz45DnVk_KMNYoTZ5vjR6oM1Dyf20nSdxBuXdKhGK9FmTS9qAzixU8lHKXyjpmjyD/exec";

const form = document.querySelector("#betaForm");
const submitButton = document.querySelector("#submitButton");
const formMessage = document.querySelector("#formMessage");
const attribution = getAttribution();

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.14 }
);

document.querySelectorAll(".reveal").forEach((section) => revealObserver.observe(section));

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(form);
  const payload = {
    email: clean(formData.get("email")),
    nickname: clean(formData.get("nickname")),
    emotion_to_sell: clean(formData.get("emotion_to_sell")),
    emotion_to_buy: clean(formData.get("emotion_to_buy")),
    expectation: clean(formData.get("expectation")),
    source: clean(formData.get("source")),
    user_agent: navigator.userAgent,
    ...attribution
  };

  if (!payload.email || !payload.emotion_to_sell || !payload.emotion_to_buy) {
    showMessage("필수 항목을 입력해주세요.", "error");
    return;
  }

  if (!isValidEmail(payload.email)) {
    showMessage("이메일 형식을 확인해주세요.", "error");
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = "초대장 신청 중입니다...";
  showMessage("", "");

  try {
    if (SCRIPT_URL) {
      await fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        body: new URLSearchParams(payload)
      });
    } else {
      saveLocalApplication(payload);
      await wait(450);
    }

    showMessage(
      "초대장 신청이 완료되었습니다. 감정 상점이 열리면 가장 먼저 알려드릴게요. 그때까지 오늘의 감정을 한 문장으로 잠시 보관해두세요.",
      "success"
    );
    form.reset();
  } catch (error) {
    showMessage("신청 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.", "error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "감정 상점 초대장 받기";
  }
});

function clean(value) {
  return String(value || "").trim();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showMessage(message, type) {
  formMessage.textContent = message;
  formMessage.className = type ? `form-message ${type}` : "form-message";
}

function saveLocalApplication(payload) {
  const key = "maeum_store_beta_applications";
  const previous = JSON.parse(localStorage.getItem(key) || "[]");
  previous.push({
    ...payload,
    submitted_at: new Date().toISOString(),
    status: "local-preview"
  });
  localStorage.setItem(key, JSON.stringify(previous));
}

function getAttribution() {
  const storageKey = "maeum_store_attribution";
  const params = new URLSearchParams(window.location.search);
  const trackedKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];
  const saved = JSON.parse(sessionStorage.getItem(storageKey) || "{}");
  const current = {
    landing_url: window.location.href,
    referrer: document.referrer,
    ...saved
  };

  trackedKeys.forEach((key) => {
    const value = clean(params.get(key));
    if (value) {
      current[key] = value;
    }
  });

  sessionStorage.setItem(storageKey, JSON.stringify(current));
  return current;
}

function wait(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
