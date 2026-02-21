import * as UI from "./duelUI.js";

import { findOpponent } from "../../engine/matchmaking.js";
import { generateQuestion } from "../../engine/questionGenerator.js";
import { evaluateSubmission } from "../../engine/evaluator.js";
import { calculateELO } from "../../engine/eloSystem.js";
import { updateLeaderboard, getLeaderboard } from "../../engine/leaderboard.js";
import { buildCodingMetrics } from "../../engine/metricsCollector.js";

/* ============================= */
/* STATE VARIABLES */
/* ============================= */

let editor;
let selectedSkill = null;
let currentRound = 0;
let totalRounds = 10;
let roundData = [];
let timerInterval;
let startTime;
let opponentProfile;
let opponentScore = 0;
let currentQuestion;
let adaptiveLevel = 2; // 1 easy, 2 medium, 3 hard

/* ============================= */
/* USER PROFILE */
/* ============================= */

const currentUser = {
    name: "Ajinkya",
    ratings: {
        development: 1200,
        cybersecurity: 1200
    }
};

/* ============================= */
/* INITIALIZATION */
/* ============================= */

initMonaco();
init();

function init() {

    document.getElementById("playBtn")
        .addEventListener("click", () => UI.showScreen("lobbyScreen"));

    document.getElementById("leaderboardBtn")
        .addEventListener("click", showLeaderboard);

    document.getElementById("leaderboardBackBtn")
        .addEventListener("click", () => UI.showScreen("titleScreen"));

    document.getElementById("lobbyBackBtn")
        .addEventListener("click", () => UI.showScreen("titleScreen"));

    document.getElementById("resultBackBtn")
        .addEventListener("click", () => UI.showScreen("titleScreen"));

    document.querySelectorAll("#skillSelection button")
        .forEach(btn => {
            btn.addEventListener("click", () => {
                selectedSkill = btn.dataset.skill;
                UI.highlightSkill(btn);
                updateDisplayedRating();
            });
        });

    document.getElementById("findMatchBtn")
        .addEventListener("click", handleMatchmaking);

    document.getElementById("submitBtn")
        .addEventListener("click", submitRound);
}

/* ============================= */
/* RATING DISPLAY */
/* ============================= */

function updateDisplayedRating() {

    if (!selectedSkill) {
        document.getElementById("playerRating").innerText = "-";
        return;
    }

    if (selectedSkill === "mixed") {

        const avg =
            (currentUser.ratings.development +
             currentUser.ratings.cybersecurity) / 2;

        document.getElementById("playerRating").innerText =
            Math.round(avg);

    } else {

        document.getElementById("playerRating").innerText =
            currentUser.ratings[selectedSkill];
    }
}

function getCurrentRating() {

    if (selectedSkill === "mixed") {
        return (
            currentUser.ratings.development +
            currentUser.ratings.cybersecurity
        ) / 2;
    }

    return currentUser.ratings[selectedSkill];
}

/* ============================= */
/* MATCHMAKING */
/* ============================= */

function handleMatchmaking() {

    if (!selectedSkill) {
        alert("Select skill mode first");
        return;
    }

    const playerRating = getCurrentRating();

    opponentProfile = findOpponent(playerRating);

    UI.showScreen("matchScreen");

    setTimeout(() => {
        UI.showScreen("gameScreen");
        startDuel();
    }, 2000);
}

/* ============================= */
/* GAME FLOW */
/* ============================= */

function startDuel() {

    currentRound = 0;
    roundData = [];
    opponentScore = 0;
    adaptiveLevel = 2;

    nextRound();
}

function nextRound() {

    if (currentRound >= totalRounds) {
        endDuel();
        return;
    }

    currentRound++;

    UI.updateRound(currentRound, totalRounds);

    const difficulty = getDifficulty();

    currentQuestion =
        generateQuestion(selectedSkill, difficulty);

    UI.renderQuestion(currentQuestion.prompt);

    startTime = Date.now();

    startTimer(60);
}

function getDifficulty() {

    if (adaptiveLevel === 1) return "easy";
    if (adaptiveLevel === 2) return "medium";
    return "hard";
}

function adjustAdaptiveLevel(accuracy) {

    if (accuracy > 80 && adaptiveLevel < 3) adaptiveLevel++;
    if (accuracy < 40 && adaptiveLevel > 1) adaptiveLevel--;
}

/* ============================= */
/* TIMER */
/* ============================= */

function startTimer(seconds) {

    let remaining = seconds;

    UI.updateTimer(remaining);

    timerInterval = setInterval(() => {

        remaining--;

        UI.updateTimer(remaining);

        if (remaining <= 0) {
            clearInterval(timerInterval);
            submitRound();
        }

    }, 1000);
}

/* ============================= */
/* ROUND SUBMISSION */
/* ============================= */

function submitRound() {

    clearInterval(timerInterval);

    const userCode = editor.getValue();

    const evaluation =
        evaluateSubmission(userCode, currentQuestion.testCases);

    adjustAdaptiveLevel(evaluation.accuracy);

    const timeTaken = (Date.now() - startTime) / 1000;

    roundData.push({ ...evaluation, timeTaken });

    simulateOpponentRound();

    UI.updateScoreboard(roundData);

    setTimeout(nextRound, 1500);
}

/* ============================= */
/* OPPONENT SIMULATION */
/* ============================= */

function simulateOpponentRound() {

    const simulatedAccuracy =
        opponentProfile.skillLevel + randomInt(-10, 10);

    const simulatedSpeed =
        opponentProfile.avgSpeed + randomInt(-5, 5);

    const simulatedEfficiency =
        opponentProfile.efficiency + randomInt(-10, 10);

    const opponentRoundScore =
        (simulatedAccuracy * 0.5) +
        ((100 - simulatedSpeed) * 0.3) +
        (simulatedEfficiency * 0.2);

    opponentScore += opponentRoundScore;

    UI.updateOpponentScore(opponentScore);
}

/* ============================= */
/* DUEL END */
/* ============================= */

function endDuel() {

    const avgAccuracy =
        average(roundData.map(r => r.accuracy));

    const avgSpeed =
        average(roundData.map(r => r.timeTaken));

    const avgEfficiency =
        average(roundData.map(r => r.efficiency));

    const playerScore =
        (avgAccuracy * 0.5) +
        ((100 - avgSpeed) * 0.3) +
        (avgEfficiency * 0.2);

    const opponentFinal =
        opponentScore / totalRounds;

    let resultValue;
    let resultText;

    if (playerScore > opponentFinal) {
        resultValue = 1;
        resultText = "You Win!";
    } else if (playerScore < opponentFinal) {
        resultValue = 0;
        resultText = "You Lose!";
    } else {
        resultValue = 0.5;
        resultText = "Draw!";
    }

    const currentRating = getCurrentRating();

    const newRating =
        calculateELO(currentRating, opponentProfile.rating, resultValue);

    const ratingChange =
        newRating - currentRating;

    if (selectedSkill === "mixed") {

        currentUser.ratings.development +=
            Math.round(ratingChange / 2);

        currentUser.ratings.cybersecurity +=
            Math.round(ratingChange / 2);

    } else {

        currentUser.ratings[selectedSkill] = newRating;
    }

    updateLeaderboard({
        name: currentUser.name,
        rating: newRating
    });

    const metrics =
        buildCodingMetrics({
            skill: selectedSkill,
            avgAccuracy,
            avgSpeed,
            avgEfficiency,
            ratingChange,
            newRating
        });

    UI.showResult(metrics);
}

/* ============================= */
/* LEADERBOARD */
/* ============================= */

function showLeaderboard() {

    UI.showScreen("leaderboardScreen");

    const data = getLeaderboard();

    document.getElementById("leaderboardData").innerText =
        JSON.stringify(data, null, 2);
}

/* ============================= */
/* UTILITIES */
/* ============================= */

function average(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/* ============================= */
/* MONACO INIT */
/* ============================= */

function initMonaco() {

    require.config({
        paths: {
            vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs'
        }
    });

    require(['vs/editor/editor.main'], function () {

        editor = monaco.editor.create(
            document.getElementById('editor'),
            {
                value: "function solve(input) {\n    \n}",
                language: "javascript",
                theme: "vs-dark"
            }
        );
    });
}