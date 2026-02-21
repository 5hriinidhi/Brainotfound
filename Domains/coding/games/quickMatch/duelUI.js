export function showScreen(screenId) {
    document.querySelectorAll(".screen")
        .forEach(s => s.classList.remove("active"));

    document.getElementById(screenId)
        .classList.add("active");
}

export function highlightSkill(btn) {
    document.querySelectorAll("#skillSelection button")
        .forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
}

export function updateRound(current, total) {
    document.getElementById("roundInfo").innerText =
        `Round ${current} / ${total}`;
}

export function updateTimer(seconds) {
    document.getElementById("timer").innerText =
        `Time Left: ${seconds}s`;
}

export function renderQuestion(prompt) {
    document.getElementById("questionContainer").innerText = prompt;
}

export function updateScoreboard(data) {
    document.getElementById("scoreboard").innerText =
        `Rounds Completed: ${data.length}`;
}

export function updateOpponentScore(score) {
    document.getElementById("opponentScore").innerText =
        `Opponent Score: ${Math.floor(score)}`;
}

export function showResult(metrics) {
    showScreen("resultScreen");
    document.getElementById("finalStats").innerText =
        JSON.stringify(metrics, null, 2);
}