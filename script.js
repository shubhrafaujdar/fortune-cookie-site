let fortunes = [];

async function loadFortunes() {
  try {
    const res = await fetch('fortunes.json');
    fortunes = await res.json();
  } catch (error) {
    console.error("Error loading fortunes:", error);
    fortunes = ["Good fortune awaits you.", "Your cookie is empty! Try again."];
  }
}

function getRandomFortune() {
  const index = Math.floor(Math.random() * fortunes.length);
  return fortunes[index];
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadFortunes();
  
  const cookie = document.getElementById("cookie");
  const button = document.getElementById("newFortuneBtn");

  cookie.addEventListener("click", () => {
    showFortune();
    startCooldown(button);
  });
  button.addEventListener("click", () => {
    showFortune();
    startCooldown(button);
  });

  const shareTwitterBtn = document.getElementById("shareTwitterBtn");
  const shareFacebookBtn = document.getElementById("shareFacebookBtn");

  shareTwitterBtn.addEventListener("click", shareOnTwitter);
  shareFacebookBtn.addEventListener("click", shareOnFacebook);

  const shareWhatsappBtn = document.getElementById("shareWhatsappBtn");
  const shareTiktokBtn = document.getElementById("shareTiktokBtn");

  shareWhatsappBtn.addEventListener("click", shareOnWhatsapp);
  shareTiktokBtn.addEventListener("click", copyForTiktok);

  const shareInstagramBtn = document.getElementById("shareInstagramBtn");
  shareInstagramBtn.addEventListener("click", copyForTiktok);
});

function shareOnWhatsapp() {
  const fortuneText = document.getElementById("fortuneText").textContent;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(fortuneText)}`;
  window.open(whatsappUrl, "_blank");
}

function copyForTiktok() {
  const fortuneText = document.getElementById("fortuneText").textContent;
  navigator.clipboard.writeText(fortuneText).then(() => {
    alert("Fortune copied to clipboard!");
  }, () => {
    alert("Failed to copy fortune.");
  });
}

function shareOnTwitter() {
  const fortuneText = document.getElementById("fortuneText").textContent;
  const tweetText = `I got a fortune: "${fortuneText}"`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
  window.open(twitterUrl, "_blank");
}

function shareOnFacebook() {
  const fortuneText = document.getElementById("fortuneText").textContent;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(fortuneText)}`;
  window.open(facebookUrl, "_blank");
}

function showFortune() {
  const fortuneText = document.getElementById("fortuneText");
  fortuneText.textContent = getRandomFortune();

  // trigger fade-in animation
  fortuneText.style.opacity = 0;
  fortuneText.style.transform = "translateY(10px)";
  setTimeout(() => {
    fortuneText.style.transition = "0.5s";
    fortuneText.style.opacity = 1;
    fortuneText.style.transform = "translateY(0)";
  }, 50);

  // optional confetti
  launchConfetti();
}

function launchConfetti() {
  const colors = ["#e67e22", "#f1c40f", "#2ecc71", "#3498db", "#9b59b6"];

  for (let i = 0; i < 30; i++) {
    const confetti = document.createElement("div");
    confetti.classList.add("confetti");
    document.body.appendChild(confetti);

    // random position & color
    confetti.style.left = Math.random() * 100 + "vw";
    confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

    // random size
    confetti.style.width = confetti.style.height = Math.random() * 8 + 4 + "px";

    // animation duration
    const duration = Math.random() * 3 + 2;
    confetti.style.animation = `fall ${duration}s linear forwards`;

    // remove after animation
    setTimeout(() => confetti.remove(), duration * 1000);
  }
}

function startCooldown(button) {
  let cooldown = 10;
  button.disabled = true;
  button.textContent = `Next fortune in ${cooldown}s`;

  const interval = setInterval(() => {
    cooldown--;
    if (cooldown > 0) {
      button.textContent = `Next fortune in ${cooldown}s`;
    } else {
      clearInterval(interval);
      button.disabled = false;
      button.textContent = "Crack Another Fortune";
    }
  }, 1000);
}
