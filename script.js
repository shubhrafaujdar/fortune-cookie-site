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
