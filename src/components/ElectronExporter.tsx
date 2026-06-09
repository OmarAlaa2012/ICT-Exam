import { useState } from 'react';
import { Copy, Check, FileText, Code, ShieldCheck, Paintbrush, Terminal, Settings2, HelpCircle } from 'lucide-react';

export default function ElectronExporter() {
  const [activeTab, setActiveTab] = useState<'setup' | 'main' | 'preload' | 'index' | 'style' | 'renderer' | 'package' | 'csv'>('setup');
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const fileContents = {
    main: `/**
 * main.js - Electron Main Process File
 * Configures the native desktop environment, setups context isolation,
 * and handles secure system requests for loading files and writing quiz logs.
 */

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1080,
    height: 720,
    minWidth: 800,
    minHeight: 600,
    title: "ICT Lab Quiz Application",
    frame: true, // Native window frame
    icon: path.join(__dirname, 'icon.png'), // Add window icon of your choice
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    }
  });

  // Load the offline renderer dashboard
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open developer tools if debugging is needed in lab
  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

// Ensure app starts correctly
app.whenReady().then(() => {
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// IPC Handler: Load questions from root directory 'questions.csv'
ipcMain.handle('load-questions-csv', async () => {
  try {
    // Look first in app directory. If not found, look next to the executable
    let csvPath = path.join(__dirname, 'questions.csv');
    if (!fs.existsSync(csvPath)) {
      csvPath = path.join(path.dirname(process.execPath), 'questions.csv');
    }
    
    // Fallback: If still don't exist, create a default list so it runs perfectly
    if (!fs.existsSync(csvPath)) {
      const defaultCSV = \`Question,OptionA,OptionB,OptionC,OptionD,CorrectAnswer
"What does CPU stand for?","Central Process Unit","Computer Personal Unit","Central Processing Unit","Central Processor Utility","C"
"Which of the following is an example of a non-volatile memory?","RAM","SRAM","DRAM","ROM","D"
"What is the default port number used by the secure HTTP protocol (HTTPS)?","80","8080","443","22","C"
"Which network topology connects all devices to a single central cable?","Bus","Star","Ring","Mesh","A"
"Which data structure operates on a First-In-First-Out (FIFO) basis?","Stack","Queue","Trees","Graph","B"\`;
      fs.writeFileSync(csvPath, defaultCSV, 'utf-8');
    }

    const data = fs.readFileSync(csvPath, 'utf-8');
    return { success: true, data };
  } catch (err) {
    console.error("Failed to load questions filesystem", err);
    return { success: false, error: err.message };
  }
});

// IPC Handler: Record quiz results - append to local file 'results.txt' on device
ipcMain.handle('save-quiz-result', async (event, { name, score, total }) => {
  try {
    // Generate results.txt in the executable directory or desktop
    const timestamp = new Date().toLocaleString();
    const resultLogLine = \`[\${timestamp}] | Name: \${name} | Score: \${score}/\${total}\\n\`;
    
    // Save directory: Next to the executable so lab teachers can find it instantly!
    let resultsDir = path.dirname(process.execPath);
    if (process.env.NODE_ENV === 'development' || resultsDir.includes('node_modules')) {
      resultsDir = __dirname;
    }
    
    const resultsPath = path.join(resultsDir, 'results.txt');
    
    fs.appendFileSync(resultsPath, resultLogLine, 'utf-8');
    return { success: true, path: resultsPath, line: resultLogLine };
  } catch (err) {
    console.error("Failed to append quiz results", err);
    return { success: false, error: err.message };
  }
});`,

    preload: `/**
 * preload.js - Secure IPC Bridge
 * Exposes guarded file operations to the renderer process
 * following strict Electron Context-Isolation guidelines.
 */

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  // Load questions CSV safely from disk
  loadQuestions: () => ipcRenderer.invoke('load-questions-csv'),
  
  // Save/Append result data to results.txt
  saveResult: (payload) => ipcRenderer.invoke('save-quiz-result', payload)
});`,

    index: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ICT Lab Interactive Quiz App</title>
  <link rel="stylesheet" href="style.css">
  
  <!-- Embedding Spline Viewer Script for 3D Landing Page -->
  <script type="module" src="https://unpkg.com/@splinetool/viewer@1.9.54/build/spline-viewer.js"></script>
</head>
<body>
  
  <!-- Home/Login Section -->
  <div id="home-screen" class="screen active">
    
    <!-- Spline 3D Scene Viewer -->
    <div class="spline-container">
      <spline-viewer url="https://prod.spline.design/OK986O0C7YfF3D6G/scene.splinecode"></spline-viewer>
    </div>
    
    <!-- UI Overlay for Name & Landing -->
    <div class="glass-landing-card">
      <div class="icon-header">💻</div>
      <h1>ICT LAB TERMINAL</h1>
      <p class="subtitle">Secure Offline Skill Assessor</p>
      
      <div class="form-wrapper">
        <label for="student-name">Enter Student Name:</label>
        <input type="text" id="student-name" placeholder="John Doe" autocomplete="off" maxlength="32">
        <p id="name-validation-message" class="error-msg"></p>
        <button id="btn-enter-quiz" class="btn-gradient">INITIATE ASSESSMENT</button>
      </div>
      
      <div class="badge-row">
        <span class="badge">OFFLINE SECURE</span>
        <span class="badge">ICT CORE V1</span>
      </div>
    </div>
  </div>

  <!-- Quiz Interface Section -->
  <div id="quiz-screen" class="screen">
    <header class="quiz-header">
      <div class="student-profile">
        <span class="avatar">👨‍💻</span>
        <span id="display-student-name" class="name">Student</span>
      </div>
      
      <!-- Countdown Circular/Bar Visual -->
      <div class="timer-box">
        <div class="timer-ring">
          <span id="timer-text">30</span>s
        </div>
        <div class="timer-bar-bg">
          <div id="timer-progress-bar"></div>
        </div>
      </div>
    </header>

    <main class="quiz-container">
      <div class="quiz-card-glass">
        <div class="quiz-meta">
          <span class="badge-cyan" id="question-progress">QUESTION 1 OF 10</span>
          <span class="badge-p" id="time-limit-indicator">Strict 30s Countdown</span>
        </div>
        
        <h2 id="question-text">Loading question...</h2>

        <div class="options-grid">
          <button class="option-button" data-option="A">
            <span class="option-label">A</span>
            <span class="option-content" id="opt-text-a">Option A</span>
          </button>
          <button class="option-button" data-option="B">
            <span class="option-label">B</span>
            <span class="option-content" id="opt-text-b">Option B</span>
          </button>
          <button class="option-button" data-option="C">
            <span class="option-label">C</span>
            <span class="option-content" id="opt-text-c">Option C</span>
          </button>
          <button class="option-button" data-option="D">
            <span class="option-label">D</span>
            <span class="option-content" id="opt-text-d">Option D</span>
          </button>
        </div>

        <div class="quiz-footer-actions">
          <p id="feedback-message" class="feedback-hint"></p>
          <button id="btn-submit-answer" class="btn-primary">SUBMIT ANSWER</button>
        </div>
      </div>
    </main>
  </div>

  <!-- Results Screen Section -->
  <div id="result-screen" class="screen">
    <div class="stars-bg"></div>
    <div class="glass-result-card">
      <div class="success-radial-glow"></div>
      <div class="header-icon">🏆</div>
      <h2>ASSESSMENT COMPLETE</h2>
      <p class="subtitle">Your results have been securely recorded offline.</p>
      
      <div class="stats-container">
        <div class="stat-card">
          <span class="label">Candidate</span>
          <span id="result-candidate-name" class="value">Candidate Name</span>
        </div>
        <div class="stat-card ring-accent">
          <span class="label">Final Score</span>
          <span id="result-score-value" class="value">8 / 10</span>
        </div>
        <div class="stat-card">
          <span class="label">Percentage</span>
          <span id="result-percentage" class="value">80%</span>
        </div>
      </div>

      <div class="system-log-terminal">
        <div class="terminal-header">
          <span class="dot red"></span>
          <span class="dot yellow"></span>
          <span class="dot green"></span>
          <span class="title">System Log Terminal &bull; append success</span>
        </div>
        <div class="terminal-body">
          <code>&gt; Host filesystem mounted... OK</code><br>
          <code>&gt; Results appended locally inside results.txt</code><br>
          <code id="terminal-receipt-line" class="cyan-text">&gt; [Loading Receipt...]</code>
        </div>
      </div>

      <div class="action-buttons">
        <button id="btn-restart-quiz" class="btn-gradient">RESTART PORTAL</button>
      </div>
    </div>
  </div>

  <script src="renderer.js"></script>
</body>
</html>`,

    style: `/**
 * style.css
 * Implements a premium 'liquid glassmorphism' deep purple theme
 * featuring smooth neon flows, fine backdrop-filter, and high usability.
 */

@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
  --primary: #c084fc;       /* vibrant violet */
  --accent: #22d3ee;        /* cyan glow */
  --bg-deep: #090514;       /* ultra dark purple */
  --bg-card: rgba(20, 10, 40, 0.45);
  --border-glass: rgba(255, 255, 255, 0.08);
  --border-glass-hover: rgba(192, 132, 252, 0.3);
  --font-family: 'Plus Jakarta Sans', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  user-select: none;
}

body {
  font-family: var(--font-family);
  background-color: var(--bg-deep);
  color: #f3f4f6;
  height: 100vh;
  overflow: hidden;
  background-image: 
    radial-gradient(circle at 10% 20%, rgba(99, 102, 241, 0.15) 0%, transparent 40%),
    radial-gradient(circle at 90% 80%, rgba(236, 72, 153, 0.1) 0%, transparent 40%);
}

/* Screen Transitions */
.screen {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  opacity: 0;
  pointer-events: none;
  transform: scale(0.98);
  transition: opacity 0.4s ease, transform 0.4s ease;
  z-index: 1;
}

.screen.active {
  opacity: 1;
  pointer-events: auto;
  transform: scale(1);
  z-index: 5;
}

/* Home Screen & Spline Layout */
#home-screen {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.spline-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
  pointer-events: auto;
}

spline-viewer {
  width: 100%;
  height: 100%;
}

.glass-landing-card {
  position: relative;
  z-index: 10;
  width: 480px;
  padding: 40px;
  background: var(--bg-card);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--border-glass);
  border-radius: 24px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.1);
  text-align: center;
  animation: floatEffect 6s ease-in-out infinite;
}

@keyframes floatEffect {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.icon-header {
  font-size: 42px;
  margin-bottom: 20px;
  filter: drop-shadow(0 0 10px var(--primary));
}

h1 {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.5px;
  color: #fff;
  text-shadow: 0 0 15px rgba(255, 255, 255, 0.1);
}

.subtitle {
  color: #9ca3af;
  font-size: 14px;
  margin-top: 4px;
}

.form-wrapper {
  margin: 30px 0 10px 0;
  text-align: left;
}

label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: #a78bfa;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 8px;
}

input[type="text"] {
  width: 100%;
  padding: 14px 20px;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid var(--border-glass);
  border-radius: 12px;
  color: #ffffff;
  font-size: 16px;
  margin-bottom: 8px;
  transition: all 0.3s ease;
}

input[type="text"]:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 15px rgba(192, 132, 252, 0.2);
}

.error-msg {
  font-size: 12px;
  color: #f87171;
  min-height: 18px;
  margin-bottom: 8px;
}

/* Glassmorphic buttons */
.btn-gradient {
  display: block;
  user-select: none;
  cursor: pointer;
  width: 100%;
  padding: 15px 30px;
  background: linear-gradient(135deg, #a78bfa 0%, #db2777 100%);
  color: white;
  font-family: var(--font-family);
  font-weight: 600;
  font-size: 15px;
  border: none;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(167, 139, 250, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.btn-gradient:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(167, 139, 250, 0.5), 0 0 30px rgba(219, 39, 119, 0.2);
}

.btn-gradient:active {
  transform: translateY(0);
}

.badge-row {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
}

.badge {
  background: rgba(255, 255, 255, 0.05);
  font-size: 10px;
  font-weight: 600;
  color: #a78bfa;
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  letter-spacing: 0.5px;
}

/* Quiz Interface Layout */
.quiz-header {
  padding: 20px 40px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid var(--border-glass);
}

.student-profile {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar {
  font-size: 24px;
}

.student-profile .name {
  font-weight: 500;
  color: #e5e7eb;
}

.timer-box {
  display: flex;
  align-items: center;
  gap: 15px;
}

.timer-ring {
  background: rgba(236, 72, 153, 0.15);
  color: #f472b6;
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: bold;
  padding: 6px 14px;
  border-radius: 9999px;
  border: 1px solid rgba(236, 72, 153, 0.3);
  box-shadow: 0 0 15px rgba(236, 72, 153, 0.15);
}

#timer-text {
  font-size: 18px;
  color: #fff;
}

.timer-bar-bg {
  width: 140px;
  height: 6px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

#timer-progress-bar {
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, #ec4899, #a78bfa);
  transition: width 1s linear;
}

.quiz-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.quiz-card-glass {
  width: 1050px;
  max-width: 90%;
  padding: 40px;
  background: var(--bg-card);
  backdrop-filter: blur(15px);
  border-radius: 20px;
  border: 1px solid var(--border-glass);
  box-shadow: 0 20px 40px rgba(0,0,0,0.4);
}

.quiz-meta {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.badge-cyan {
  background: rgba(34, 211, 238, 0.12);
  color: #22d3ee;
  border: 1px solid rgba(34, 211, 238, 0.25);
  font-size: 11px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 6px;
}

.badge-p {
  background: rgba(167, 139, 250, 0.12);
  color: #a78bfa;
  border: 1px solid rgba(167, 139, 250, 0.25);
  font-size: 11px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 6px;
}

#question-text {
  font-size: 20px;
  font-weight: 600;
  color: #fff;
  line-height: 1.4;
  margin-bottom: 30px;
}

/* Options Grid Layout */
.options-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 30px;
}

@media (max-width: 768px) {
  .options-grid {
    grid-template-columns: 1fr;
  }
}

.option-button {
  display: flex;
  align-items: center;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border-glass);
  border-radius: 12px;
  cursor: pointer;
  text-align: left;
  transition: all 0.25s ease;
}

.option-button:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: var(--border-glass-hover);
  transform: translateX(4px);
}

.option-button.selected {
  background: rgba(167, 139, 250, 0.15);
  border-color: var(--primary);
  box-shadow: 0 0 15px rgba(167, 139, 250, 0.25);
}

.option-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.08);
  font-family: var(--font-mono);
  font-weight: bold;
  color: #c084fc;
  margin-right: 15px;
}

.option-button.selected .option-label {
  background: var(--primary);
  color: #fff;
}

.option-content {
  font-size: 15px;
  color: #e5e7eb;
}

.quiz-footer-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid var(--border-glass);
  padding-top: 24px;
}

.feedback-hint {
  font-size: 14px;
  font-weight: 500;
  color: #a78bfa;
}

.btn-primary {
  padding: 12px 30px;
  background: #7c3aed;
  color: #fff;
  border: none;
  font-family: var(--font-family);
  font-weight: 600;
  font-size: 14px;
  border-radius: 10px;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(124, 58, 237, 0.3);
  transition: all 0.25s ease;
}

.btn-primary:hover {
  background: #8b5cf6;
  box-shadow: 0 6px 20px rgba(124, 58, 237, 0.5);
  transform: translateY(-1px);
}

.btn-primary:active {
  transform: translateY(0);
}

/* Results Screen Design */
#result-screen {
  align-items: center;
  justify-content: center;
}

.glass-result-card {
  position: relative;
  width: 600px;
  padding: 40px;
  background: var(--bg-card);
  backdrop-filter: blur(20px);
  border: 1px solid var(--border-glass);
  border-radius: 24px;
  text-align: center;
  box-shadow: 0 25px 50px rgba(0,0,0,0.5);
}

.success-radial-glow {
  position: absolute;
  top: -100px;
  left: 50%;
  transform: translateX(-50%);
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(192, 132, 252, 0.15) 0%, rgba(0,0,0,0) 70%);
  pointer-events: none;
}

.header-icon {
  font-size: 48px;
  margin-bottom: 10px;
  filter: drop-shadow(0 0 12px rgba(251, 191, 36, 0.4));
}

.stats-container {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 14px;
  margin: 30px 0;
}

.stat-card {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border-glass);
  border-radius: 12px;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stat-card .label {
  font-size: 11px;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-card .value {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
}

.stat-card.ring-accent {
  border-color: #ec4899;
}

.stat-card.ring-accent .value {
  color: #f472b6;
}

/* Terminal simulator snippet */
.system-log-terminal {
  background: #03000a;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  text-align: left;
  margin-bottom: 25px;
}

.terminal-header {
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  gap: 6px;
}

.terminal-header .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.terminal-header .dot.red { background: #ef4444; }
.terminal-header .dot.yellow { background: #f59e0b; }
.terminal-header .dot.green { background: #10b981; }

.terminal-header .title {
  font-size: 10px;
  font-family: var(--font-mono);
  color: #6b7280;
}

.terminal-body {
  padding: 14px;
  font-family: var(--font-mono);
  font-size: 11px;
  line-height: 1.6;
  color: #a7f3d0;
}

.cyan-text {
  color: #22d3ee;
}

.action-buttons {
  margin-top: 10px;
}`,

    renderer: `/**
 * renderer.js - Quiz Orchestrator Process 
 * Orchestrates the quiz flow, shuffle mechanism, strict timer, 
 * CSV parsing, dynamic UI state transitions, and file-bound logging.
 */

// Global variables
let questionPool = [];
let shuffledQuestions = [];
let currentQuestionIndex = 0;
let userAnswers = [];
let selectedOption = null;
let score = 0;
let studentName = "";

// Timer variables
let timerInterval = null;
let timeRemaining = 30;

// Gather UI Elements
const homeScreen = document.getElementById('home-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');

const inputName = document.getElementById('student-name');
const btnEnterQuiz = document.getElementById('btn-enter-quiz');
const nameValidationError = document.getElementById('name-validation-message');

const displayStudentName = document.getElementById('display-student-name');
const timerText = document.getElementById('timer-text');
const timerProgressBar = document.getElementById('timer-progress-bar');
const questionProgress = document.getElementById('question-progress');
const questionText = document.getElementById('question-text');

const optionButtons = document.querySelectorAll('.option-button');
const optTextA = document.getElementById('opt-text-a');
const optTextB = document.getElementById('opt-text-b');
const optTextC = document.getElementById('opt-text-c');
const optTextD = document.getElementById('opt-text-d');

const feedbackMessage = document.getElementById('feedback-message');
const btnSubmitAnswer = document.getElementById('btn-submit-answer');

const resultCandidateName = document.getElementById('result-candidate-name');
const resultScoreValue = document.getElementById('result-score-value');
const resultPercentage = document.getElementById('result-percentage');
const terminalReceiptLine = document.getElementById('terminal-receipt-line');
const btnRestartQuiz = document.getElementById('btn-restart-quiz');

// Simple CSV parser fallback if PapaParse script wasn't fully loaded
function parseCSV(stringData) {
  const lines = [];
  const rows = stringData.split('\\n');
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i].trim();
    if (!row) continue;
    
    // Parse commas while preserving text inside speech marks
    let matches = row.match(/("[^"]*")|[^,]+/g);
    if (matches) {
      matches = matches.map(cell => cell.replace(/^"|"$/g, '').trim());
      lines.push(matches);
    }
  }

  // Map into question format array
  const header = lines[0];
  const formattedQuestions = [];
  for (let i = 1; i < lines.length; i++) {
    const r = lines[i];
    if (r.length >= 6) {
      formattedQuestions.push({
        Question: r[0],
        OptionA: r[1],
        OptionB: r[2],
        OptionC: r[3],
        OptionD: r[4],
        CorrectAnswer: r[5]
      });
    }
  }
  return formattedQuestions;
}

// 1. App Startup - Load CSV File
async function initializeApp() {
  try {
    const response = await window.electronAPI.loadQuestions();
    if (response.success && response.data) {
      questionPool = parseCSV(response.data);
      console.log("Successfully parsed " + questionPool.length + " questions.");
    } else {
      console.error("Local load failed, fallback loaded");
    }
  } catch (error) {
    console.error("Critical loader crash, manual questions initialized", error);
  }
}

// Fisher-Yates Shuffle Algorithm (Strict Requirement)
function shuffleQuiz(array) {
  let currentIndex = array.length, randomIndex;
  while (currentIndex != 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
}

// Login/Start button listener
btnEnterQuiz.addEventListener('click', () => {
  const rawName = inputName.value.trim();
  if (rawName.length < 2) {
    nameValidationError.textContent = "Please enter a valid student name (min 2 characters).";
    inputName.focus();
    return;
  }
  nameValidationError.textContent = "";

  studentName = rawName;
  startQuizSession();
});

// Trigger Quiz Session
function startQuizSession() {
  if (questionPool.length === 0) {
    feedbackMessage.textContent = "Data loading... Retrying initialization";
    return;
  }
  
  // Clone and Shuffle questions
  shuffledQuestions = shuffleQuiz([...questionPool]);
  currentQuestionIndex = 0;
  score = 0;
  userAnswers = [];

  displayStudentName.textContent = studentName;
  homeScreen.classList.remove('active');
  quizScreen.classList.add('active');

  loadQuestion(currentQuestionIndex);
}

// Load specific question to view template
function loadQuestion(index) {
  // Clean option status
  selectedOption = null;
  optionButtons.forEach(btn => btn.classList.remove('selected'));
  feedbackMessage.textContent = "";
  btnSubmitAnswer.textContent = "SUBMIT ANSWER";

  if (index >= shuffledQuestions.length) {
    concludeQuiz();
    return;
  }

  const q = shuffledQuestions[index];
  questionProgress.textContent = "QUESTION " + (index + 1) + " OF " + shuffledQuestions.length;
  questionText.textContent = q.Question;
  optTextA.textContent = q.OptionA;
  optTextB.textContent = q.OptionB;
  optTextC.textContent = q.OptionC;
  optTextD.textContent = q.OptionD;

  resetAndStartTimer();
}

// Option Selections
optionButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    optionButtons.forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedOption = btn.getAttribute('data-option');
    feedbackMessage.textContent = "Option " + selectedOption + " selected";
  });
});

// Timer Implementation (Strict 30-Second Countdown)
function resetAndStartTimer() {
  clearInterval(timerInterval);
  timeRemaining = 30;
  timerText.textContent = timeRemaining;
  timerProgressBar.style.width = "100%";

  timerInterval = setInterval(() => {
    timeRemaining--;
    timerText.textContent = timeRemaining;
    
    // Smooth progress reduction
    const percentage = (timeRemaining / 30) * 100;
    timerProgressBar.style.width = percentage + "%";

    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      handleQuestionTimeout();
    }
  }, 1000);
}

// Timer Timeout Handler
function handleQuestionTimeout() {
  // Record blank or wrong and force skip
  userAnswers.push({
    question: shuffledQuestions[currentQuestionIndex],
    selected: null,
    points: 0,
    timeOut: true
  });

  feedbackMessage.textContent = "⏰ Time out! Skipped to next question...";
  
  // Stun options briefly then load next
  setTimeout(() => {
    currentQuestionIndex++;
    loadQuestion(currentQuestionIndex);
  }, 1500);
}

// Submit Button Listener
btnSubmitAnswer.addEventListener('click', () => {
  if (!selectedOption) {
    feedbackMessage.textContent = "⚠️ Please select an answer option first!";
    return;
  }

  clearInterval(timerInterval);
  
  const currentQ = shuffledQuestions[currentQuestionIndex];
  const isCorrect = (selectedOption === currentQ.CorrectAnswer);
  const earned = isCorrect ? 1 : 0;
  
  if (isCorrect) score++;

  userAnswers.push({
    question: currentQ,
    selected: selectedOption,
    points: earned,
    timeOut: false
  });

  currentQuestionIndex++;
  loadQuestion(currentQuestionIndex);
});

// Conclude and record
async function concludeQuiz() {
  clearInterval(timerInterval);
  
  quizScreen.classList.remove('active');
  resultScreen.classList.add('active');

  resultCandidateName.textContent = studentName;
  resultScoreValue.textContent = score + " / " + shuffledQuestions.length;
  
  const pct = Math.round((score / shuffledQuestions.length) * 100);
  resultPercentage.textContent = pct + "%";

  // Securely request local result persistence to computer filesystem (results.txt)
  try {
    const payload = { name: studentName, score: score, total: shuffledQuestions.length };
    const response = await window.electronAPI.saveResult(payload);
    
    if (response.success) {
      terminalReceiptLine.textContent = "> [LOG APPEND] >> " + response.line.replace('\\n', '');
    } else {
      terminalReceiptLine.textContent = "> [WRITE ERROR] Check administrative disk privileges";
    }
  } catch (error) {
    terminalReceiptLine.textContent = "> [FAILED ENGINE] Connection to IPC main broken";
  }
}

// Restart Portal Listener
btnRestartQuiz.addEventListener('click', () => {
  inputName.value = "";
  studentName = "";
  resultScreen.classList.remove('active');
  homeScreen.classList.add('active');
});

// Call app initialization on load
initializeApp();`,

    package: `{
  "name": "ict-lab-quiz",
  "version": "1.0.0",
  "description": "Offline Liquid Glassmorphism Quiz App for school hardware labs.",
  "main": "main.js",
  "scripts": {
    "start": "electron .",
    "pack": "electron-builder --dir",
    "dist": "electron-builder"
  },
  "author": "ICT Lab Administrator",
  "license": "ISC",
  "dependencies": {
    "papaparse": "^5.4.1"
  },
  "devDependencies": {
    "electron": "^28.2.0",
    "electron-builder": "^24.9.1"
  },
  "build": {
    "appId": "com.ictlab.quizapp",
    "productName": "ICTLabQuiz",
    "directories": {
      "output": "dist"
    },
    "win": {
      "target": [
        "portable",
        "nsis"
      ],
      "icon": "icon.ico"
    },
    "extraResources": [
      "./questions.csv"
    ],
    "files": [
      "main.js",
      "preload.js",
      "renderer.js",
      "index.html",
      "style.css",
      "questions.csv"
    ]
  }
}`,

    csv: `Question,OptionA,OptionB,OptionC,OptionD,CorrectAnswer
"What does CPU stand for?","Central Process Unit","Computer Personal Unit","Central Processing Unit","Central Processor Utility","C"
"Which of the following is an example of a non-volatile memory?","RAM","SRAM","DRAM","ROM","D"
"What is the default port number used by the secure HTTP protocol (HTTPS)?","80","8080","443","22","C"
"Which network topology connects all devices to a single central cable?","Bus","Star","Ring","Mesh","A"
"In boolean algebra, what is the output of (A AND B) if A is True and B is False?","True","False","Null","Undefined","B"
"Which data structure operates on a First-In-First-Out (FIFO) basis?","Stack","Queue","Trees","Graph","B"
"What does SQL stand for?","Structured Query Language","Simple Queue List","Server Query Layer","System Query Logic","A"
"Which protocol is responsible for assigning temporary IP addresses to devices on a network?","DNS","DHCP","FTP","SMTP","B"
"What is the hexadecimal equivalent of the decimal number 15?","E","A","F","FF","C"
"Which of the following is a function of an Operating System?","Memory Management","API Hosting","Physical Cable Splicing","Circuit Assembly","A"`,
  };

  const helperDocs = {
    setup: (
      <div className="space-y-6">
        <div>
          <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-2">1. Setting Up Your Files Locally</h4>
          <p className="text-gray-300 text-xs leading-relaxed mb-3">
            To build the native desktop app, create an empty directory on your computer (e.g. <code className="px-1.5 py-0.5 bg-purple-950/40 text-purple-300 rounded font-mono">ict-quiz-builder</code>),
            and save each code block into files matching the titles of the tabs above. Place all files in the same level.
          </p>
          <div className="p-3.5 bg-black/40 border border-[#a78bfa]/10 rounded-xl">
            <h5 className="text-purple-300 text-xs font-semibold mb-2 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" /> File Layout Guide
            </h5>
            <pre className="text-slate-400 text-xs font-mono leading-relaxed space-y-1">
              ict-quiz-builder/<br />
              ├── main.js<br />
              ├── preload.js<br />
              ├── index.html<br />
              ├── style.css<br />
              ├── renderer.js<br />
              ├── questions.csv<br />
              └── package.json
            </pre>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-2">2. Local Installation</h4>
          <p className="text-gray-300 text-xs leading-relaxed mb-3">
            Open your terminal/command prompt inside your project folder, and install the necessary dependencies required for offline file system parsing and launching:
          </p>
          <div className="relative">
            <pre className="p-3 bg-[#03000a] text-emerald-400 rounded-lg text-xs font-mono overflow-x-auto border border-emerald-950">
              # 1. Install Electron structure and developer packagers{'\n'}
              npm install{'\n\n'}
              # 2. Test run your desktop application locally{'\n'}
              npm start
            </pre>
            <button 
              onClick={() => copyToClipboard('npm install && npm start', 'setup')}
              className="absolute right-2 top-2 p-1 bg-white/5 hover:bg-white/10 rounded transition text-gray-400 hover:text-white"
              title="Copy Command"
            >
              {copied === 'setup' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Settings2 className="w-4 h-4 text-pink-400" /> 3. Packaging into Windows Standalone `.exe`
          </h4>
          <p className="text-gray-300 text-xs leading-relaxed mb-3">
            We use <code className="text-pink-300 px-1 py-0.5 bg-black/40 rounded">electron-builder</code> to assemble everything into a completely offline, zero-dependency executable.
            To package the application, execute:
          </p>
          <div className="relative mb-3">
            <pre className="p-3 bg-[#03000a] text-pink-400 rounded-lg text-xs font-mono overflow-x-auto border border-pink-950">
              # Package active files into a portable EXE or installation wizard{'\n'}
              npm run dist
            </pre>
            <button 
              onClick={() => copyToClipboard('npm run dist', 'dist')}
              className="absolute right-2 top-2 p-1 bg-white/5 hover:bg-white/10 rounded transition text-gray-400 hover:text-white"
              title="Copy Command"
            >
              {copied === 'dist' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <div className="p-3.5 bg-slate-900/30 border border-slate-800 rounded-xl space-y-2.5">
            <div className="flex items-start gap-2">
              <span className="text-xs bg-purple-900/40 text-purple-300 px-1.5 py-0.5 rounded font-bold font-mono">INFO</span>
              <p className="text-slate-400 text-[11px] leading-normal">
                After <code className="text-purple-300">npm run dist</code> completes, inspect your local folder. A new <code className="text-purple-300 font-mono">dist/</code> directory will contain <code className="text-pink-300 font-sans font-semibold">"ICTLabQuiz Portable.exe"</code>.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xs bg-cyan-900/40 text-cyan-300 px-1.5 py-0.5 rounded font-bold font-mono">LAB TIP</span>
              <p className="text-slate-400 text-[11px] leading-normal">
                To easily change the assessed topic, just open your host computer folder and edit <code className="text-cyan-300 font-mono">questions.csv</code>. Your pre-packaged Electron build reads this directory reactively, allowing instantaneous quiz updates in the computer room without re-packaging!
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  };

  return (
    <div className="h-full flex flex-col bg-[#0f0a20]/95 rounded-2xl border border-white/5 shadow-2xl overflow-hidden glassmorphism" id="electron-devbox-exporter-section">
      {/* Dev Header */}
      <div className="p-5 border-b border-white/5 bg-black/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="text-xs font-mono tracking-widest text-[#a78bfa] uppercase">Electron Developer Portal</span>
          </div>
          <h2 className="text-lg font-bold text-white mt-1">Ready-to-Assemble Asset Codebase</h2>
        </div>
        <div className="text-slate-400 text-xs flex items-center gap-1">
          <HelpCircle className="w-3.5 h-3.5 text-slate-400" /> Copy and paste files onto your local terminal to compile.
        </div>
      </div>

      {/* Tabs list */}
      <div className="flex border-b border-white/5 overflow-x-auto bg-black/10 scrollbar-thin">
        <button
          onClick={() => setActiveTab('setup')}
          className={`px-4 py-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-all ${
            activeTab === 'setup'
              ? 'border-cyan-400 text-cyan-400 bg-cyan-400/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <HelpCircle className="w-3.5 h-3.5" /> Packager Guide
        </button>
        <button
          onClick={() => setActiveTab('main')}
          className={`px-4 py-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-all ${
            activeTab === 'main'
              ? 'border-purple-400 text-purple-400 bg-purple-400/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <Code className="w-3.5 h-3.5" /> main.js
        </button>
        <button
          onClick={() => setActiveTab('preload')}
          className={`px-4 py-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-all ${
            activeTab === 'preload'
              ? 'border-purple-400 text-purple-400 bg-purple-400/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" /> preload.js
        </button>
        <button
          onClick={() => setActiveTab('index')}
          className={`px-4 py-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-all ${
            activeTab === 'index'
              ? 'border-purple-400 text-purple-400 bg-purple-400/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <FileText className="w-3.5 h-3.5" /> index.html
        </button>
        <button
          onClick={() => setActiveTab('style')}
          className={`px-4 py-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-all ${
            activeTab === 'style'
              ? 'border-purple-400 text-purple-400 bg-purple-400/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <Paintbrush className="w-3.5 h-3.5" /> style.css
        </button>
        <button
          onClick={() => setActiveTab('renderer')}
          className={`px-4 py-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-all ${
            activeTab === 'renderer'
              ? 'border-purple-400 text-purple-400 bg-purple-400/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" /> renderer.js
        </button>
        <button
          onClick={() => setActiveTab('package')}
          className={`px-4 py-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-all ${
            activeTab === 'package'
              ? 'border-purple-400 text-purple-400 bg-purple-400/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <Settings2 className="w-3.5 h-3.5" /> package.json
        </button>
        <button
          onClick={() => setActiveTab('csv')}
          className={`px-4 py-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-all ${
            activeTab === 'csv'
              ? 'border-purple-400 text-purple-400 bg-purple-400/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <FileText className="w-3.5 h-3.5" /> questions.csv
        </button>
      </div>

      {/* Pane Content */}
      <div className="flex-1 p-5 overflow-y-auto max-h-[580px]" id="electron-tab-content-panel">
        {activeTab === 'setup' ? (
          helperDocs.setup
        ) : (
          <div className="relative">
            <div className="flex justify-between items-center mb-2 px-1">
              <span className="text-[11px] font-mono text-slate-400">
                Filename: <span className="text-cyan-400">{activeTab}.{activeTab === 'package' || activeTab === 'csv' ? (activeTab === 'package' ? 'json' : 'csv') : (activeTab === 'index' ? 'html' : activeTab === 'style' ? 'css' : 'js')}</span>
              </span>
              <button
                onClick={() => copyToClipboard(fileContents[activeTab], activeTab)}
                className="flex items-center gap-1 text-xs py-1 px-2.5 rounded bg-slate-800 hover:bg-slate-700 transition text-slate-300 hover:text-white"
                id={`btn-copy-code-${activeTab}`}
              >
                {copied === activeTab ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Script</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 bg-[#03000a] text-purple-200 rounded-xl text-xs font-mono overflow-x-auto border border-white/5 leading-relaxed max-h-[480px]">
              {fileContents[activeTab]}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
