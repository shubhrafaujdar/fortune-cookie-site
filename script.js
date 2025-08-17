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

function showFortune() {
  const fortuneText = document.getElementById("fortuneText");
  fortuneText.textContent = getRandomFortune();
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadFortunes();
  
  const cookie = document.getElementById("cookie");
  const button = document.getElementById("newFortuneBtn");

  cookie.addEventListener("click", showFortune);
  button.addEventListener("click", showFortune);
});

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
