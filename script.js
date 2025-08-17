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
