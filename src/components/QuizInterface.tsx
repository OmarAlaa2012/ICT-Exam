import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Papa from 'papaparse';
import { Play, RotateCcw, Award, Clock, CircleCheck as CheckCircle2, CircleAlert as AlertCircle, Database, Upload, Trash2, FileText, Sparkles } from 'lucide-react';
import { QuizQuestion, QuizResult } from '../types';
import { DEFAULT_QUESTIONS } from '../questionsData';



export default function QuizInterface() {
  // Session Variables
  const [studentName, setStudentName] = useState('');
  const [studentClass, setStudentClass] = useState('Red');
  const [isAssessmentInitiated, setIsAssessmentInitiated] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);
  
  // CSV Question state
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [shuffledQuestions, setShuffledQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Time metrics
  const [timerRemaining, setTimerRemaining] = useState(30);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // local offline results log
  const [resultsLog, setResultsLog] = useState<QuizResult[]>([]);
  const [validationError, setValidationError] = useState('');


  // CSV loading notice
  const [csvUploadSuccess, setCsvUploadSuccess] = useState<string | null>(null);
  const [csvLoaded, setCsvLoaded] = useState(false);

  // Hidden teacher controls state
  const [showTeacherControls, setShowTeacherControls] = useState(false);

  // Premium animated feedback popup states
  const [showFeedbackPopup, setShowFeedbackPopup] = useState(false);
  const [feedbackIsCorrect, setFeedbackIsCorrect] = useState(false);
  const [correctAnswerValue, setCorrectAnswerValue] = useState('');
  const [correctAnswerLetter, setCorrectAnswerLetter] = useState('');
  const feedbackTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Dynamic Theme state ('dark' | 'light')
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Hover track references for interactive cyber matrix letters pattern (inspired by the Hyperplexed pattern snippet)
  const containerRef = useRef<HTMLDivElement>(null);
  const bgLettersRef = useRef<HTMLDivElement>(null);

  // Lazy-initialize background text generation
  const initialLettersStr = useRef<string>('');
  const randomCharsPool = useRef<string>('');
  const lastUpdateRef = useRef<number>(0);
  const textGeneratedRef = useRef<boolean>(false);

  const generateBackgroundText = () => {
    if (textGeneratedRef.current) return;
    textGeneratedRef.current = true;
    const charsDataset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+{}[]|;:<>?/";
    let output = '';
    for (let i = 0; i < 55000; i++) {
      output += charsDataset.charAt(Math.floor(Math.random() * charsDataset.length));
    }
    randomCharsPool.current = output;
    initialLettersStr.current = output.slice(0, 42000);
  };

  // Handle coordinates and dynamically shift/randomize visible matrices
  const handleStageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isAssessmentInitiated) return;
    if (!containerRef.current) return;
    generateBackgroundText();
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    containerRef.current.style.setProperty('--x', `${x}px`);
    containerRef.current.style.setProperty('--y', `${y}px`);

    const now = performance.now();
    if (now - lastUpdateRef.current < 50) return; // throttle text mutations to ~20 FPS to eliminate lag
    lastUpdateRef.current = now;

    // High performance DOM text update by slicing ready pool
    if (bgLettersRef.current && randomCharsPool.current) {
      const offset = Math.floor(Math.random() * 8000);
      bgLettersRef.current.textContent = randomCharsPool.current.slice(offset, offset + 42000);
    }
  };

  const handleStageTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (isAssessmentInitiated) return;
    if (!containerRef.current || !e.touches[0]) return;
    generateBackgroundText();
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const y = e.touches[0].clientY - rect.top;

    containerRef.current.style.setProperty('--x', `${x}px`);
    containerRef.current.style.setProperty('--y', `${y}px`);

    const now = performance.now();
    if (now - lastUpdateRef.current < 50) return; // throttle touch mutations
    lastUpdateRef.current = now;

    if (bgLettersRef.current && randomCharsPool.current) {
      const offset = Math.floor(Math.random() * 8000);
      bgLettersRef.current.textContent = randomCharsPool.current.slice(offset, offset + 42000);
    }
  };

  // Dynamic style parameters based on theme
  const isLight = theme === 'light';
  
  const stageBg = isLight ? 'bg-gradient-to-br from-[#dce3f8] via-[#e2e8fc] to-[#f0f4ff]' : 'bg-[#020108]';
  const stageText = isLight ? 'text-slate-800' : 'text-gray-100';
  
  const cardBg = isLight 
    ? 'bg-gradient-to-br from-white/60 to-slate-50/30 backdrop-blur-3xl border border-white/50 shadow-[0_35px_80px_rgba(79,70,229,0.08)] ring-1 ring-white/40 shadow-indigo-200/10' 
    : 'bg-gradient-to-br from-[#0c061e]/45 to-[#03010b]/25 backdrop-blur-3xl border border-white/10 shadow-[0_30px_70px_rgba(0,0,0,0.6)] ring-1 ring-[#17ED61]/15';
    
  const gridStyle = isLight 
    ? 'bg-[linear-gradient(to_right,#4f46e502_1px,transparent_1px),linear-gradient(to_bottom,#4f46e502_1px,transparent_1px)]' 
    : 'bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)]';

  const glowStyle = isLight 
    ? 'bg-pink-500/10 group-hover:bg-pink-500/15' 
    : 'bg-[#17ED61]/5 group-hover:bg-[#17ED61]/10';

  const tagBadge = isLight 
    ? 'bg-pink-50 text-pink-700 border-pink-200/50 shadow-sm font-sans' 
    : 'bg-[#17ED61]/10 text-[#17ED61] border-[#17ED61]/25';

  const badgeStatusColor = isLight ? 'text-pink-600' : 'text-slate-500';

  const headerTitle = isLight 
    ? 'tracking-tight leading-none text-transparent bg-clip-text bg-gradient-to-r from-[#d946ef] via-[#8b5cf6] to-[#4f46e5] font-black' 
    : 'tracking-tight leading-none text-transparent bg-clip-text bg-gradient-to-r from-[#17ED61] to-[#0df1bf] font-black';
  const descText = isLight ? 'text-stone-700/85 font-medium' : 'text-slate-400';
  
  const diagBg = isLight 
    ? 'bg-white/35 border-white/40 text-slate-800 bg-gradient-to-r from-indigo-50/50 to-transparent' 
    : 'bg-black/40 border-white/5 text-[#17ED61]/80 bg-gradient-to-r from-black/60 to-transparent';

  const diagPulseBar = isLight ? 'bg-indigo-600' : 'bg-[#17ED61]';
  
  const inputStyle = isLight 
    ? 'bg-white/20 backdrop-blur-md border border-white/50 text-slate-900 placeholder-slate-500/70 focus:border-indigo-500 focus:bg-white/45 focus:ring-1 focus:ring-indigo-500 focus:shadow-[0_0_15px_rgba(79,70,229,0.1)]' 
    : 'bg-black/60 border-white/10 text-white placeholder-slate-700 focus:border-[#17ED61] focus:ring-1 focus:ring-[#17ED61] focus:shadow-[0_0_15px_rgba(23,237,97,0.15)]';

  const submitButton = isLight 
    ? 'bg-gradient-to-r from-[#ec4899] via-[#8b5cf6] to-[#6366f1] text-white hover:brightness-105 shadow-xl shadow-indigo-600/30 rounded-2xl active:scale-[0.98]' 
    : 'bg-gradient-to-r from-[#17ED61] via-[#12c44f] to-[#12c44f] text-black hover:brightness-110 shadow-lg shadow-[#17ED61]/15 active:scale-[0.99]';

  const detailHighlight = isLight ? 'text-indigo-600 font-bold' : 'text-[#17ED61] font-bold';
  const sourceHighlight = isLight ? 'text-indigo-600 font-bold' : 'text-[#17ED61] font-bold';
  const labelAccent = isLight ? 'text-pink-600' : 'text-[#17ED61]';

  // Load resultsLog from localStorage on load
  useEffect(() => {
    const savedLogs = localStorage.getItem('ict_quiz_offline_results');
    if (savedLogs) {
      try {
        setResultsLog(JSON.parse(savedLogs));
      } catch (e) {
        console.error("Corrupted results cache", e);
      }
    }
  }, []);

  // Load questions on component mount (instant from bundled data)
  useEffect(() => {
    setQuestions(DEFAULT_QUESTIONS);
    setCsvLoaded(true);
    console.log('Questions loaded:', DEFAULT_QUESTIONS.length);
  }, []);

  // Fisher-Yates Shuffling Algorithm (Core Requirement)
  const shuffleQuestions = (list: QuizQuestion[]) => {
    const array = [...list];
    let currentIndex = array.length, randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex !== 0) {
      // Pick a remaining element.
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;

      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex],
        array[currentIndex]
      ];
    }
    return array;
  };

  // Handle login - show dashboard
  const handleLogin = async () => {
    if (!studentName.trim() || studentName.trim().length < 2) {
      setValidationError("Please enter a valid student name (minimum 2 characters).");
      return;
    }

    if (!csvLoaded) {
      setValidationError("Questions are still loading. Please wait a moment...");
      return;
    }

    setValidationError("");

    // Send login notification to Discord webhook
    try {
      const embed = {
        embeds: [{
          title: 'Student Login',
          color: 3447003,
          fields: [
            { name: 'Student Name', value: studentName.trim(), inline: true },
            { name: 'Class', value: studentClass, inline: true },
            { name: 'Timestamp', value: new Date().toLocaleString(), inline: false }
          ],
          footer: { text: 'Quiz Assessment System - Login' }
        }]
      };

      await fetch('https://discord.com/api/webhooks/1427049381277995071/x4DJoIOvDbfO1lPnkLPFmAX1X9hzeZlZipBFcQgwRTGBjkoKmxg7HlKszP80XSiXe2Ah', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(embed)
      });
    } catch (e) {
      console.warn('Failed to send login notification to Discord', e);
    }

    setShowDashboard(true);
  };

  // Handle assessment initiation from dashboard
  const handleInitiateAssessment = () => {
    console.log('handleInitiateAssessment called, questions:', questions.length);
    if (questions.length === 0) {
      setValidationError("Questions are still loading. Please try again in a moment.");
      return;
    }

    const shuffled = shuffleQuestions(questions);
    console.log('Shuffled questions:', shuffled.length);
    setShuffledQuestions(shuffled);
    setCurrentQuestionIdx(0);
    setScore(0);
    setSelectedAnswer(null);
    setFeedback(null);
    setQuizFinished(false);
    setIsAssessmentInitiated(true);
    setShowDashboard(false);
    startTimer();
  };

  // Strict 30-second Timer Loop
  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerRemaining(30);

    timerRef.current = setInterval(() => {
      setTimerRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleQuestionTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Handle Question Timeout (Auto-skip to next/finish)
  const handleQuestionTimeout = () => {
    setFeedbackIsCorrect(false);
    setFeedback("Timeout");
    
    const currentQ = shuffledQuestions[currentQuestionIdx];
    if (currentQ) {
      setCorrectAnswerLetter(currentQ.CorrectAnswer);
      const correctOptionKey = `Option${currentQ.CorrectAnswer}` as keyof QuizQuestion;
      setCorrectAnswerValue(currentQ[correctOptionKey] || '');
    }

    setShowFeedbackPopup(true);
    
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => {
      handleNextQuestionManual();
    }, 2500);
  };

  const handleNextQuestionManual = () => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    setShowFeedbackPopup(false);
    moveToNextQuestion();
  };

  const moveToNextQuestion = () => {
    setSelectedAnswer(null);
    setFeedback(null);

    // Use latest state ref for stable index traversal
    setCurrentQuestionIdx((prevIndex) => {
      const nextIndex = prevIndex + 1;
      if (nextIndex >= shuffledQuestions.length || nextIndex >= questions.length) {
        concludeQuizAssessment();
        return prevIndex;
      } else {
        startTimer();
        return nextIndex;
      }
    });
  };

  // Submit selected answer
  const handleSubmitAnswer = () => {
    if (!selectedAnswer) {
      setValidationError("Please pick an option to submit your answer.");
      return;
    }
    setValidationError("");

    if (timerRef.current) clearInterval(timerRef.current);

    const currentQ = shuffledQuestions[currentQuestionIdx];
    const isCorrect = selectedAnswer === currentQ.CorrectAnswer;

    setFeedbackIsCorrect(isCorrect);
    setCorrectAnswerLetter(currentQ.CorrectAnswer);
    const correctOptionKey = `Option${currentQ.CorrectAnswer}` as keyof QuizQuestion;
    setCorrectAnswerValue(currentQ[correctOptionKey] || '');

    if (isCorrect) {
      setScore((prev) => prev + 1);
      setFeedback("Correct");
    } else {
      setFeedback("Incorrect");
    }

    setShowFeedbackPopup(true);

    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => {
      handleNextQuestionManual();
    }, 2500);
  };

  // Conclude of quiz, file logging trigger
  const concludeQuizAssessment = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setQuizFinished(true);

    const newResult: QuizResult = {
      timestamp: new Date().toLocaleString(),
      studentName: studentName.trim(),
      studentClass: studentClass,
      score: score,
      totalQuestions: Math.min(shuffledQuestions.length, questions.length)
    };

    // Append to local results simulation list
    const updated = [newResult, ...resultsLog];
    setResultsLog(updated);
    localStorage.setItem('ict_quiz_offline_results', JSON.stringify(updated));

    // Send score to Discord webhook
    try {
      const scorePercentage = Math.round((score / Math.min(shuffledQuestions.length, questions.length)) * 100);
      const embed = {
        embeds: [{
          title: 'Assessment Completed',
          color: scorePercentage >= 70 ? 16711680 : 16776960,
          fields: [
            { name: 'Student Name', value: studentName.trim(), inline: true },
            { name: 'Class', value: studentClass, inline: true },
            { name: 'Score', value: `${score} / ${Math.min(shuffledQuestions.length, questions.length)}`, inline: true },
            { name: 'Percentage', value: `${scorePercentage}%`, inline: true },
            { name: 'Timestamp', value: new Date().toLocaleString(), inline: false }
          ],
          footer: { text: 'Quiz Assessment System' }
        }]
      };

      await fetch('https://discord.com/api/webhooks/1514751772709748929/XDHMBvseOnENUUK_7AzsY1K_7v5846qu-cThehiMr8pNRLxQGPy7mgzB3ayq8urTCKdl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(embed)
      });

      // Send score to second Discord webhook (name, class, score only)
      const scoreEmbed = {
        embeds: [{
          title: 'Score Report',
          color: 3447003,
          fields: [
            { name: 'Student Name', value: studentName.trim(), inline: true },
            { name: 'Class', value: studentClass, inline: true },
            { name: 'Score', value: `${score} / ${Math.min(shuffledQuestions.length, questions.length)}`, inline: true }
          ]
        }]
      };

      await fetch('https://discord.com/api/webhooks/1514751666103128235/kjhTofGN5JgrXzmtuMKHY5t6CpVMx6VlG3t4mBgK9aUkHd2i30OtbjLt-5u0IZlJy5G1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scoreEmbed)
      });
    } catch (e) {
      console.warn('Failed to send score to Discord', e);
    }
  };

  // Dashboard view state
  const [showDashboard, setShowDashboard] = useState(false);
  const [showProjectAccess, setShowProjectAccess] = useState(false);
  const [uploadedProjectFile, setUploadedProjectFile] = useState<File | null>(null);
  const projectFileInputRef = useRef<HTMLInputElement>(null);

  // Handle project file upload
  const handleProjectFileUpload = async (file: File) => {
    setUploadedProjectFile(file);
    // Send to Discord webhook
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('content', `📁 Project File from ${studentName} (${studentClass})\nTimestamp: ${new Date().toLocaleString()}`);

      await fetch('https://discord.com/api/webhooks/1514751666103128235/kjhTofGN5JgrXzmtuMKHY5t6CpVMx6VlG3t4mBgK9aUkHd2i30OtbjLt-5u0IZlJy5G1', {
        method: 'POST',
        body: formData
      });
    } catch (error) {
      console.warn('Failed to upload project file', error);
    }
  };

  // Restart back to home screen
  const restartAssessmentPortal = () => {
    setStudentName('');
    setStudentClass('Red');
    setIsAssessmentInitiated(false);
    setQuizFinished(false);
    setShowDashboard(false);
    setShowProjectAccess(false);
    setCurrentQuestionIdx(0);
    setScore(0);
    setShowFeedbackPopup(false);
    setFeedbackIsCorrect(false);
    setUploadedProjectFile(null);
  };

  // CSV File Handler for custom teacher assessment uploaded
  const handleCustomCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedData = results.data as any[];

        const validQuestions: QuizQuestion[] = [];
        let parsingErrors = 0;

        parsedData.forEach((row) => {
          if (
            row.Question !== undefined &&
            row.OptionA !== undefined &&
            row.OptionB !== undefined &&
            row.OptionC !== undefined &&
            row.OptionD !== undefined &&
            row.CorrectAnswer !== undefined
          ) {
            validQuestions.push({
              Question: row.Question.trim(),
              OptionA: row.OptionA.trim(),
              OptionB: row.OptionB.trim(),
              OptionC: row.OptionC.trim(),
              OptionD: row.OptionD.trim(),
              CorrectAnswer: row.CorrectAnswer.trim().toUpperCase()
            });
          } else {
            parsingErrors++;
          }
        });

        if (validQuestions.length > 0) {
          setQuestions(validQuestions);
          localStorage.setItem('ict_cached_questions', JSON.stringify(validQuestions));
          setCsvUploadSuccess(`Successfully loaded ${validQuestions.length} custom lab questions from ${file.name}!${parsingErrors > 0 ? ` (${parsingErrors} rows failed structural checks).` : ''}`);
          setTimeout(() => setCsvUploadSuccess(null), 7000);
        } else {
          setValidationError(`Failed parsing: No structurally matching rows containing basic columns: Question, OptionA, OptionB, OptionC, OptionD, CorrectAnswer.`);
          setTimeout(() => setValidationError(""), 6000);
        }
      },
      error: (err) => {
        setValidationError(`CSV Reader crashed: ${err.message}`);
        setTimeout(() => setValidationError(""), 6000);
      }
    });
  };

  // Reset questions - reload from CSV
  const resetQuestionsToDefault = async () => {
    try {
      const response = await fetch('/questions.csv');
      const csvText = await response.text();

      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const parsedData = results.data as any[];
          const validQuestions: QuizQuestion[] = [];

          for (const row of parsedData) {
            if (row.Question && row.OptionA && row.OptionB && row.OptionC && row.OptionD && row.CorrectAnswer) {
              validQuestions.push({
                Question: row.Question.trim(),
                OptionA: row.OptionA.trim(),
                OptionB: row.OptionB.trim(),
                OptionC: row.OptionC.trim(),
                OptionD: row.OptionD.trim(),
                CorrectAnswer: row.CorrectAnswer.trim()
              });
            }
          }

          if (validQuestions.length > 0) {
            setQuestions(validQuestions);
            localStorage.setItem('ict_cached_questions', JSON.stringify(validQuestions));
          }
        }
      });
    } catch (error) {
      console.error("Failed to reset questions:", error);
    }
  };

  // Export results.txt simulated file creation and download
  const handleExportTxtLog = () => {
    if (resultsLog.length === 0) return;
    
    // Construct text format identical to requirements
    const fileTextOutput = resultsLog
      .map(r => `[${r.timestamp}] | Name: ${r.studentName} | Score: ${r.score}/${r.totalQuestions}`)
      .join('\n');

    const blob = new Blob([fileTextOutput], { type: 'text/plain;charset=utf-8' });
    const element = document.createElement('a');
    element.href = URL.createObjectURL(blob);
    element.download = "results.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Export questions back as a CSV template
  const handleExportQuestionsCsv = () => {
    const csvContent = Papa.unparse(questions);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const element = document.createElement('a');
    element.href = URL.createObjectURL(blob);
    element.download = "questions.csv";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Clear simulated host results log database
  const clearLocalResultsCache = () => {
    if (window.confirm("Are you sure you want to clear the entire ICT Classroom results database stored offline in this session?")) {
      setResultsLog([]);
      localStorage.removeItem('ict_quiz_offline_results');
    }
  };

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    };
  }, []);

  const currentQuestion = shuffledQuestions[currentQuestionIdx];

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleStageMouseMove}
      onMouseLeave={() => {
        if (containerRef.current) {
          containerRef.current.style.setProperty('--x', '50vw');
          containerRef.current.style.setProperty('--y', '50vh');
        }
      }}
      onTouchMove={handleStageTouchMove}
      className={`relative w-full h-full flex flex-col justify-between overflow-hidden transition-colors duration-300 ${stageBg} ${stageText}`} 
      id="ict-live-quiz-simulator-stage"
    >

      {/* Immersive Always-Visible Shared Background Layer (Cyber Cool Pattern + Hover Spotlight Matrix) */}
      <div className="fixed inset-0 z-0 pointer-events-none select-none overflow-hidden" id="ambient-cyber-background-container" style={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0 }}>
        
        {/* Cool Theme-Aware Pattern Overlay (Grid & Tech dots) */}
        <div 
          className="absolute inset-0 transition-opacity duration-500" 
          style={{
            backgroundImage: isLight 
              ? 'radial-gradient(circle, rgba(79, 70, 229, 0.15) 1.5px, transparent 1.5px), linear-gradient(to right, rgba(79, 70, 229, 0.02) 1px, transparent 1px), linear-gradient(to bottom, rgba(79, 70, 229, 0.02) 1px, transparent 1px)'
              : 'radial-gradient(circle, rgba(23, 237, 97, 0.25) 1.5px, transparent 1.5px), linear-gradient(to right, rgba(23, 237, 97, 0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(23, 237, 97, 0.04) 1px, transparent 1px)',
            backgroundSize: '24px 24px, 48px 48px, 48px 48px',
            backgroundPosition: '0 0, 0 0, 0 0',
          }} 
        />

        {/* Ambient Floating Orbs for extra visibility and cool depth */}
        <div className="absolute inset-0 overflow-hidden opacity-30">
          <div className={`absolute -top-1/4 -left-1/4 w-[60%] h-[60%] rounded-full blur-[120px] animate-pulse duration-[8000ms] ${isLight ? 'bg-indigo-300' : 'bg-[#17ED61]/15'}`} />
          <div className={`absolute -bottom-1/4 -right-1/4 w-[60%] h-[60%] rounded-full blur-[120px] animate-pulse duration-[12000ms] ${isLight ? 'bg-pink-300' : 'bg-fuchsia-500/10'}`} />
        </div>

        {/* Dynamic mouse-tracking multicolor Hyperplexed spotlight following cursor (only on landing/results) */}
        {!isAssessmentInitiated && (
          <div 
            className="absolute inset-0 pointer-events-none select-none"
            style={{
              background: isLight
                ? 'radial-gradient(380px circle at var(--x, 50vw) var(--y, 50vh), rgba(79, 70, 229, 0.15) 0%, rgba(79, 70, 229, 0.03) 70%, transparent 100%)'
                : 'radial-gradient(380px circle at var(--x, 50vw) var(--y, 50vh), rgba(23, 237, 97, 0.25) 0%, rgba(13, 241, 191, 0.15) 30%, rgba(56, 182, 255, 0.06) 60%, transparent 100%)',
            }}
          />
        )}

        {/* Dynamic Hover Matrix Letters Layer (Hyperplexed letters track pattern) (only on landing/results) */}
        {!isAssessmentInitiated && (
          <div 
            ref={bgLettersRef}
            className={`absolute inset-0 font-mono text-[9px] sm:text-[11px] leading-[1.05] tracking-normal select-none break-all pointer-events-none transition-colors duration-500 overflow-hidden ${
              isLight ? 'text-indigo-600/70 font-medium' : 'text-[#17ED61] font-bold'
            }`}
            style={{
              wordBreak: 'break-all',
              mixBlendMode: isLight ? 'multiply' : 'screen',
              maskImage: 'radial-gradient(300px circle at var(--x, 50vw) var(--y, 50vh), rgba(0,0,0,0.9) 10%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.03) 85%, transparent 100%)',
              WebkitMaskImage: 'radial-gradient(300px circle at var(--x, 50vw) var(--y, 50vh), rgba(0,0,0,0.9) 10%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0.03) 85%, transparent 100%)',
            }}
          >
            {initialLettersStr.current}
          </div>
        )}

        {/* Outer theme dimming overlay */}
        <div className={`absolute inset-0 transition-colors duration-500 ${isLight ? 'bg-slate-50/25' : 'bg-[#020108]/60'}`} />
      </div>





      {/* Live Main Content Area - Centered Quiz */}
      <div
        className={`${
          isAssessmentInitiated
            ? 'relative z-10 flex-1 flex flex-col justify-center items-center p-6 pb-8 w-full'
            : 'fixed inset-0 z-20 flex flex-col justify-center items-center p-6 pb-8 overflow-y-auto'
        }`}
        id="live-main-content-fluid-wrapper"
      >
        
        {/* VIEW 1: LANDING PAGE - LOGIN */}
        {!showDashboard && !isAssessmentInitiated && !showProjectAccess && (
          <div className={`w-full flex items-center justify-center animate-fade-in z-20 px-4 transition-all duration-500`} id="quiz-landing-view-container">
            <div className={`w-full max-w-[420px] p-8 md:p-10 rounded-2xl ${cardBg} space-y-6 flex flex-col justify-between min-h-[420px] relative overflow-hidden group transition-all duration-300`}>
              
              {/* Corner crosshairs/tick graphics directly resembling the snippet */}
              <div className="absolute inset-0 z-30 pointer-events-none p-1">
                {/* Top-Left Corner */}
                <div className="absolute top-2 left-2 flex flex-col">
                  <div className={`w-4.5 h-[2px] ${isLight ? 'bg-indigo-600/60' : 'bg-[#17ED61]/70'}`} />
                  <div className={`w-[2px] h-4.5 -mt-[2px] ${isLight ? 'bg-indigo-600/60' : 'bg-[#17ED61]/70'}`} />
                </div>
                {/* Top-Right Corner */}
                <div className="absolute top-2 right-2 flex flex-col items-end">
                  <div className={`w-4.5 h-[2px] ${isLight ? 'bg-indigo-600/60' : 'bg-[#17ED61]/70'}`} />
                  <div className={`w-[2px] h-4.5 -mt-[2px] ${isLight ? 'bg-indigo-600/60' : 'bg-[#17ED61]/70'}`} />
                </div>
                {/* Bottom-Left Corner */}
                <div className="absolute bottom-2 left-2 flex flex-col justify-end">
                  <div className={`w-[2px] h-4.5 ${isLight ? 'bg-indigo-600/60' : 'bg-[#17ED61]/70'}`} />
                  <div className={`w-4.5 h-[2px] -mt-[2px] ${isLight ? 'bg-indigo-600/60' : 'bg-[#17ED61]/70'}`} />
                </div>
                {/* Bottom-Right Corner */}
                <div className="absolute bottom-2 right-2 flex flex-col items-end justify-end">
                  <div className={`w-[2px] h-4.5 ${isLight ? 'bg-indigo-600/60' : 'bg-[#17ED61]/70'}`} />
                  <div className={`w-4.5 h-[2px] -mt-[2px] ${isLight ? 'bg-indigo-600/60' : 'bg-[#17ED61]/70'}`} />
                </div>
              </div>

              {/* Glassmorphic Ambient Background accents */}
              <div className={`absolute inset-0 ${gridStyle} pointer-events-none transition-all duration-300`} />
              <div className={`absolute -top-16 -right-16 w-32 h-32 ${glowStyle} rounded-full blur-2xl pointer-events-none transition-all duration-300`} />
              
              <div className="space-y-5 relative z-10">
                <div className="space-y-2 text-center sm:text-left">
                  <h2 className={`text-3xl font-extrabold tracking-tight uppercase transition-all duration-300 ${
                    isLight 
                      ? 'text-indigo-950 font-black' 
                      : 'text-white'
                  }`}>
                    ICT Exam Year 7
                  </h2>
                  <p className={`text-[11px] leading-relaxed font-sans transition-colors duration-300 ${descText}`}>
                    Please authenticate with your name and class section to initiate your practical assessment.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Name field */}
                  <div className="space-y-1.5">
                    <label htmlFor="student-name-input" className={`text-[10px] font-bold uppercase tracking-widest font-mono block transition-colors duration-300 ${labelAccent}`}>
                      STUDENT NAME:
                    </label>
                    <input
                      type="text"
                      id="student-name-input"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder="Enter your full name"
                      maxLength={32}
                      className={`w-full px-4 py-3 rounded-xl font-mono text-xs focus:outline-none transition-all ${inputStyle} placeholder-slate-400`}
                    />
                    {validationError && (
                      <p className="text-red-500 text-xs flex items-center gap-1 mt-1 font-mono">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>{validationError}</span>
                      </p>
                    )}
                  </div>

                  {/* Class dropdown field */}
                  <div className="space-y-1.5">
                    <label htmlFor="student-class-select" className={`text-[10px] font-bold uppercase tracking-widest font-mono block transition-colors duration-300 ${labelAccent}`}>
                      CLASS SECTION:
                    </label>
                    <select
                      id="student-class-select"
                      value={studentClass}
                      onChange={(e) => setStudentClass(e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl font-mono text-xs focus:outline-none transition-all cursor-pointer ${inputStyle}`}
                    >
                      <option value="Red" className={isLight ? 'text-slate-900 bg-white' : 'text-white bg-slate-950'}>Red</option>
                      <option value="Yellow" className={isLight ? 'text-slate-900 bg-white' : 'text-white bg-slate-950'}>Yellow</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-2 relative z-10">
                <button
                  onClick={handleLogin}
                  className={`w-full py-4 rounded-xl text-xs font-black uppercase tracking-widest transition duration-300 flex items-center justify-center gap-2 cursor-pointer focus:outline-none ${submitButton}`}
                  id="btn-launch-quiz-session"
                >
                  <Play className={`w-4 h-4 ${isLight ? 'fill-current text-white' : 'fill-black text-black'}`} />
                  <span>ENTER</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DASHBOARD VIEW - After Login */}
        {showDashboard && !showProjectAccess && (
          <div className="w-full flex items-center justify-center animate-fade-in z-20 px-4" id="dashboard-view-container">
            <div className={`w-full max-w-[420px] p-8 md:p-10 rounded-2xl ${cardBg} space-y-6 flex flex-col justify-between min-h-[380px] relative overflow-hidden group transition-all duration-300`}>

              {/* Corner crosshairs */}
              <div className="absolute inset-0 z-30 pointer-events-none p-1">
                <div className="absolute top-2 left-2 flex flex-col">
                  <div className={`w-4.5 h-[2px] ${isLight ? 'bg-indigo-600/60' : 'bg-[#17ED61]/70'}`} />
                  <div className={`w-[2px] h-4.5 -mt-[2px] ${isLight ? 'bg-indigo-600/60' : 'bg-[#17ED61]/70'}`} />
                </div>
                <div className="absolute top-2 right-2 flex flex-col items-end">
                  <div className={`w-4.5 h-[2px] ${isLight ? 'bg-indigo-600/60' : 'bg-[#17ED61]/70'}`} />
                  <div className={`w-[2px] h-4.5 -mt-[2px] ${isLight ? 'bg-indigo-600/60' : 'bg-[#17ED61]/70'}`} />
                </div>
                <div className="absolute bottom-2 left-2 flex flex-col justify-end">
                  <div className={`w-[2px] h-4.5 ${isLight ? 'bg-indigo-600/60' : 'bg-[#17ED61]/70'}`} />
                  <div className={`w-4.5 h-[2px] -mt-[2px] ${isLight ? 'bg-indigo-600/60' : 'bg-[#17ED61]/70'}`} />
                </div>
                <div className="absolute bottom-2 right-2 flex flex-col items-end justify-end">
                  <div className={`w-[2px] h-4.5 ${isLight ? 'bg-indigo-600/60' : 'bg-[#17ED61]/70'}`} />
                  <div className={`w-4.5 h-[2px] -mt-[2px] ${isLight ? 'bg-indigo-600/60' : 'bg-[#17ED61]/70'}`} />
                </div>
              </div>

              <div className={`absolute inset-0 ${gridStyle} pointer-events-none transition-all duration-300`} />
              <div className={`absolute -top-16 -right-16 w-32 h-32 ${glowStyle} rounded-full blur-2xl pointer-events-none transition-all duration-300`} />

              <div className="space-y-5 relative z-10">
                <div className="space-y-2 text-center">
                  <h2 className={`text-2xl font-extrabold tracking-tight uppercase transition-all duration-300 ${isLight ? 'text-indigo-950 font-black' : 'text-white'}`}>
                    Assessment Portal
                  </h2>
                  <p className={`text-[11px] leading-relaxed font-sans transition-colors duration-300 ${descText}`}>
                    Welcome, <span className={labelAccent}>{studentName}</span>. Complete both tasks to proceed.
                  </p>
                </div>
              </div>

              <div className="space-y-3 relative z-10">
                {/* Questions Button */}
                <button
                  onClick={handleInitiateAssessment}
                  className={`w-full py-4 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition duration-300 flex items-center justify-center gap-3 cursor-pointer focus:outline-none ${submitButton}`}
                  id="btn-start-questions"
                >
                  <FileText className={`w-5 h-5`} />
                  <span>Questions</span>
                </button>

                {/* Access Project Button */}
                <button
                  onClick={() => setShowProjectAccess(true)}
                  className={`w-full py-4 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition duration-300 flex items-center justify-center gap-3 cursor-pointer focus:outline-none ${submitButton}`}
                  id="btn-access-project"
                >
                  <Upload className={`w-5 h-5`} />
                  <span>Access Project</span>
                </button>
              </div>

              {/* Logout Button */}
              <div className="pt-2 relative z-10 border-t border-white/5">
                <button
                  onClick={restartAssessmentPortal}
                  className={`w-full py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition duration-300 border ${isLight ? 'border-indigo-200 hover:border-indigo-400 text-indigo-600 hover:text-indigo-700' : 'border-white/10 hover:border-red-500 text-slate-400 hover:text-red-500'} cursor-pointer`}
                  id="btn-logout"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PROJECT ACCESS SCREEN */}
        {showProjectAccess && (
          <div className="w-full flex items-center justify-center animate-fade-in z-20 px-4" id="project-access-container">
            <div className={`w-full max-w-[420px] p-8 md:p-10 rounded-2xl ${cardBg} space-y-6 flex flex-col justify-between min-h-[600px] relative overflow-hidden group transition-all duration-300`}>

              {/* Corner crosshairs */}
              <div className="absolute inset-0 z-30 pointer-events-none p-1">
                <div className="absolute top-2 left-2 flex flex-col">
                  <div className={`w-4.5 h-[2px] ${isLight ? 'bg-indigo-600/60' : 'bg-[#17ED61]/70'}`} />
                  <div className={`w-[2px] h-4.5 -mt-[2px] ${isLight ? 'bg-indigo-600/60' : 'bg-[#17ED61]/70'}`} />
                </div>
                <div className="absolute top-2 right-2 flex flex-col items-end">
                  <div className={`w-4.5 h-[2px] ${isLight ? 'bg-indigo-600/60' : 'bg-[#17ED61]/70'}`} />
                  <div className={`w-[2px] h-4.5 -mt-[2px] ${isLight ? 'bg-indigo-600/60' : 'bg-[#17ED61]/70'}`} />
                </div>
                <div className="absolute bottom-2 left-2 flex flex-col justify-end">
                  <div className={`w-[2px] h-4.5 ${isLight ? 'bg-indigo-600/60' : 'bg-[#17ED61]/70'}`} />
                  <div className={`w-4.5 h-[2px] -mt-[2px] ${isLight ? 'bg-indigo-600/60' : 'bg-[#17ED61]/70'}`} />
                </div>
                <div className="absolute bottom-2 right-2 flex flex-col items-end justify-end">
                  <div className={`w-[2px] h-4.5 ${isLight ? 'bg-indigo-600/60' : 'bg-[#17ED61]/70'}`} />
                  <div className={`w-4.5 h-[2px] -mt-[2px] ${isLight ? 'bg-indigo-600/60' : 'bg-[#17ED61]/70'}`} />
                </div>
              </div>

              <div className={`absolute inset-0 ${gridStyle} pointer-events-none transition-all duration-300`} />
              <div className={`absolute -top-16 -right-16 w-32 h-32 ${glowStyle} rounded-full blur-2xl pointer-events-none transition-all duration-300`} />

              <div className="space-y-5 relative z-10">
                <div className="space-y-2 text-center">
                  <h2 className={`text-2xl font-extrabold tracking-tight uppercase transition-all duration-300 ${isLight ? 'text-indigo-950 font-black' : 'text-white'}`}>
                    Access Project
                  </h2>
                  <p className={`text-[10px] leading-relaxed font-sans transition-colors duration-300 ${descText}`}>
                    Download or create a project file and upload it here to complete this task.
                  </p>
                </div>
              </div>

              {/* Instructions Box - Detailed Database Project Instructions */}
              <div className={`p-5 rounded-xl border space-y-4 max-h-[200px] overflow-y-auto ${isLight ? 'bg-indigo-50/40 border-indigo-200/50' : 'bg-black/40 border-white/5'}`}>
                <div>
                  <p className={`text-[11px] font-bold uppercase tracking-wider mb-2 ${isLight ? 'text-slate-800' : 'text-[#17ED61]'}`}>
                    📊 Microsoft Access Database Project
                  </p>
                  <p className={`text-[10px] leading-relaxed font-mono ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Create a Microsoft Access database for a <span className={labelAccent}>Gaming Competition Site</span> with the following fields:
                  </p>
                </div>

                <div className="space-y-2">
                  <p className={`text-[10px] font-bold ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>Required Database Fields:</p>
                  <ul className={`text-[9px] leading-relaxed space-y-1.5 font-mono ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
                    <li><span className={labelAccent}>Username</span> - Unique identifier for each competitor</li>
                    <li><span className={labelAccent}>Password</span> - Secure login credential</li>
                    <li><span className={labelAccent}>Date of Birth</span> - Player age verification</li>
                    <li><span className={labelAccent}>Entered Before</span> - Yes/No (Previous participation)</li>
                    <li><span className={labelAccent}>PastScore1</span> - First historical competition score</li>
                    <li><span className={labelAccent}>PastScore2</span> - Second historical competition score</li>
                    <li><span className={labelAccent}>Average</span> - Calculated average of past scores</li>
                  </ul>
                </div>

                <div>
                  <p className={`text-[10px] font-bold mb-1.5 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>Database Structure:</p>
                  <p className={`text-[9px] leading-relaxed font-mono ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Create proper data types, validation rules, and establish primary key on Username field. The Average field should be a calculated field using formula: (PastScore1 + PastScore2) / 2
                  </p>
                </div>

                <div>
                  <p className={`text-[10px] font-bold mb-1 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>Submission Instructions:</p>
                  <p className={`text-[9px] leading-relaxed font-mono ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Export your completed Access database (.accdb file) and upload it using the drag-and-drop area below.
                  </p>
                </div>
              </div>

              {/* File Upload Area */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) handleProjectFileUpload(file);
                }}
                onClick={() => projectFileInputRef.current?.click()}
                className={`p-6 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                  uploadedProjectFile
                    ? isLight ? 'bg-emerald-50 border-emerald-300' : 'bg-[#17ED61]/5 border-[#17ED61]/50'
                    : isLight ? 'bg-slate-50 border-slate-300 hover:bg-slate-100' : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
                id="file-drop-zone"
              >
                <input
                  ref={projectFileInputRef}
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleProjectFileUpload(file);
                  }}
                  className="hidden"
                />
                {uploadedProjectFile ? (
                  <>
                    <CheckCircle2 className={`w-8 h-8 ${isLight ? 'text-emerald-600' : 'text-[#17ED61]'}`} />
                    <p className={`text-xs font-bold uppercase ${isLight ? 'text-emerald-700' : 'text-[#17ED61]'}`}>File Uploaded</p>
                    <p className={`text-[9px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>{uploadedProjectFile.name}</p>
                  </>
                ) : (
                  <>
                    <Upload className={`w-6 h-6 ${isLight ? 'text-slate-500' : 'text-slate-400'}`} />
                    <p className={`text-xs font-bold uppercase ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>Drop File or Click</p>
                    <p className={`text-[9px] ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>Drag your project file here</p>
                  </>
                )}
              </div>

              {/* Back Button */}
              <button
                onClick={() => setShowProjectAccess(false)}
                className={`w-full py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition duration-300 border ${isLight ? 'border-indigo-200 hover:border-indigo-400 text-indigo-600 hover:text-indigo-700' : 'border-white/10 hover:border-white/30 text-slate-400 hover:text-slate-300'} cursor-pointer`}
                id="btn-back-dashboard"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        )}

      {/* IPS Label - Bottom Right Corner */}
      {!isAssessmentInitiated && (
        <div className="absolute bottom-6 right-6 z-30 pointer-events-auto" id="theme-selection-action-container">
          <button
            onClick={() => {}}
            className={`px-5 py-3 rounded-2xl border font-mono text-sm font-bold uppercase tracking-widest flex items-center gap-2 cursor-pointer select-none transition-all duration-300 shadow-md ${
              isLight
                ? 'bg-white/90 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-slate-200/40'
                : 'bg-black border-white/10 text-[#17ED61] hover:bg-slate-900 hover:border-[#17ED61]/30 shadow-black/80'
            }`}
            id="theme-toggle-trigger"
          >
            <span>IPS October 1</span>
          </button>
        </div>
      )}


        {/* VIEW 2: ACTIVE QUESTION SCREEN */}
        {isAssessmentInitiated && !quizFinished && shuffledQuestions.length === 0 && (
          <div className="flex items-center justify-center">
            <div className={`p-8 rounded-2xl text-center ${cardBg}`}>
              <p className="text-slate-400">Initializing assessment...</p>
            </div>
          </div>
        )}

        {isAssessmentInitiated && !quizFinished && shuffledQuestions.length > 0 && (
          <div className="max-w-3xl w-full mx-auto animate-fade-in" id="active-quiz-quest-container">
            <div className={`p-6 md:p-8 space-y-6 rounded-2xl relative overflow-hidden transition-all duration-300 ${cardBg}`}>
              
              {/* Corner crosshairs/tick graphics directly resembling the snippet */}
              <div className="absolute inset-0 z-30 pointer-events-none p-1">
                {/* Top-Left Corner */}
                <div className="absolute top-2 left-2 flex flex-col">
                  <div className={`w-4.5 h-[2px] ${isLight ? 'bg-indigo-600/60' : 'bg-[#17ED61]/70'}`} />
                  <div className={`w-[2px] h-4.5 -mt-[2px] ${isLight ? 'bg-indigo-600/60' : 'bg-[#17ED61]/70'}`} />
                </div>
                {/* Top-Right Corner */}
                <div className="absolute top-2 right-2 flex flex-col items-end">
                  <div className={`w-4.5 h-[2px] ${isLight ? 'bg-indigo-600/60' : 'bg-[#17ED61]/70'}`} />
                  <div className={`w-[2px] h-4.5 -mt-[2px] ${isLight ? 'bg-indigo-600/60' : 'bg-[#17ED61]/70'}`} />
                </div>
                {/* Bottom-Left Corner */}
                <div className="absolute bottom-2 left-2 flex flex-col justify-end">
                  <div className={`w-[2px] h-4.5 ${isLight ? 'bg-indigo-600/60' : 'bg-[#17ED61]/70'}`} />
                  <div className={`w-4.5 h-[2px] -mt-[2px] ${isLight ? 'bg-indigo-600/60' : 'bg-[#17ED61]/70'}`} />
                </div>
                {/* Bottom-Right Corner */}
                <div className="absolute bottom-2 right-2 flex flex-col items-end justify-end">
                  <div className={`w-[2px] h-4.5 ${isLight ? 'bg-indigo-600/60' : 'bg-[#17ED61]/70'}`} />
                  <div className={`w-4.5 h-[2px] -mt-[2px] ${isLight ? 'bg-indigo-600/60' : 'bg-[#17ED61]/70'}`} />
                </div>
              </div>

              {/* Question Dashboard Meta Inline Details (Replacing old heavy Top Bar) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] font-mono tracking-wider opacity-90 select-none border-b border-white/5 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className={`px-2 py-0.5 rounded font-black uppercase tracking-widest ${
                    isLight ? 'bg-indigo-50 border border-indigo-100 text-indigo-700' : 'bg-white/5 border border-white/5 text-[#17ED61]'
                  }`}>
                    QUESTION {currentQuestionIdx + 1}/{Math.min(shuffledQuestions.length, questions.length)}
                  </span>
                  <span className={isLight ? 'text-slate-600 font-semibold' : 'text-slate-400'}>
                    CANDIDATE: <span className="font-sans font-black uppercase text-pink-600 dark:text-[#17ED61]">{studentName} ({studentClass})</span>
                  </span>
                </div>
                
                {/* Embedded Inline Timer */}
                <div className="flex items-center gap-2 font-mono">
                  <span className={`font-black tracking-widest ${
                    timerRemaining <= 10 
                      ? 'text-red-500 animate-pulse' 
                      : isLight ? 'text-indigo-600' : 'text-[#17ED61]'
                  }`}>
                    ⏱️ TIMER: {timerRemaining}s SECS
                  </span>
                  
                  {/* Small progress meter */}
                  <div className={`w-16 h-1.5 rounded-full overflow-hidden border ${isLight ? 'bg-slate-200/60 border-slate-300/30' : 'bg-white/5 border-white/5'}`}>
                    <div 
                      className={`h-full transition-all duration-300 ${
                        timerRemaining <= 10 
                          ? 'bg-red-500' 
                          : isLight ? 'bg-indigo-600' : 'bg-[#17ED61]'
                      }`}
                      style={{ width: `${(timerRemaining / 30) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* The Question Text display */}
              <div className="space-y-2">
                <p className={`text-xs font-mono uppercase tracking-widest transition-colors duration-200 ${isLight ? 'text-pink-600/80 font-bold' : 'text-[#17ED61]/60'}`}>Subject Query:</p>
                {currentQuestion ? (
                  <p className={`text-lg md:text-xl font-bold leading-relaxed transition-colors duration-200 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {currentQuestion.Question}
                  </p>
                ) : (
                  <p className={`text-lg md:text-xl font-bold leading-relaxed transition-colors duration-200 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Loading question... (shuffledQuestions: {shuffledQuestions.length}, idx: {currentQuestionIdx})
                  </p>
                )}
              </div>

              {/* Options lists selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {(['A', 'B', 'C', 'D'] as const).map((opt) => {
                  const labelKey = `Option${opt}` as keyof QuizQuestion;
                  const text = currentQuestion?.[labelKey] || '';
                  const isSelected = selectedAnswer === opt;
                  
                  return (
                    <button
                      key={opt}
                      onClick={() => !feedback && setSelectedAnswer(opt)}
                      disabled={!!feedback}
                      className={`p-4 rounded-xl text-left flex items-start gap-3.5 border transition-all duration-300 cursor-pointer ${
                        isSelected
                          ? isLight
                            ? 'bg-indigo-50/90 border-indigo-600 text-indigo-950 shadow-md shadow-indigo-600/5'
                            : 'bg-[#17ED61]/10 border-[#17ED61] text-white shadow-lg shadow-[#17ED61]/5'
                          : isLight
                            ? 'bg-white/50 border-slate-200 hover:border-indigo-400 text-slate-800 hover:bg-indigo-50/40'
                            : 'bg-white/[0.01] border-white/5 hover:border-[#17ED61]/30 text-slate-300 hover:bg-[#17ED61]/5'
                      } ${feedback ? 'opacity-80 cursor-not-allowed' : ''}`}
                      id={`option-button-${opt.toLowerCase()}`}
                    >
                      <span className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-mono font-bold shrink-0 transition-all duration-300 ${
                        isSelected 
                          ? isLight ? 'bg-indigo-600 text-white' : 'bg-[#17ED61] text-black' 
                          : isLight ? 'bg-slate-200/80 text-slate-600' : 'bg-white/5 text-[#17ED61]'
                      }`}>
                        {opt}
                      </span>
                      <span className={`text-[13px] md:text-sm font-semibold leading-relaxed mt-0.5 transition-colors duration-200 ${
                        isSelected 
                          ? isLight ? 'text-indigo-950 font-bold' : 'text-white'
                          : isLight ? 'text-slate-800' : 'text-slate-300'
                      }`}>{text}</span>
                    </button>
                  );
                })}
              </div>

              {/* Validation notification */}
              {validationError && (
                <p className="text-red-500 text-xs flex items-center gap-1 font-mono" id="quiz-option-validation-text">
                  <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                  <span>{validationError}</span>
                </p>
              )}

              {/* Answers visual Feedback strip */}
              {feedback && (
                <div className={`p-3.5 rounded-xl text-xs font-medium border flex items-center gap-2 transition-all duration-300 ${
                  feedback.includes('Correct') 
                    ? isLight
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-sm shadow-emerald-50'
                      : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                    : isLight
                      ? 'bg-amber-50 border-amber-200 text-amber-800 shadow-sm shadow-amber-50'
                      : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                }`} id="assessment-response-banner">
                  <Sparkles className="w-4 h-4 shrink-0 text-current" />
                  <span>{feedback}</span>
                </div>
              )}

              {/* Navigation button panel */}
              <div className={`border-t pt-5 flex items-center justify-between transition-colors duration-300 ${isLight ? 'border-slate-200/80' : 'border-white/5'}`}>
                <span className="text-xs text-slate-500 font-mono italic">
                  * Note: Timer skips question automatically at 0.
                </span>
                <button
                  onClick={handleSubmitAnswer}
                  disabled={!!feedback}
                  className={`px-6 py-2.5 rounded-xl text-xs font-extrabold uppercase tracking-wider transition-all duration-300 cursor-pointer shadow-md disabled:opacity-40 disabled:cursor-not-allowed ${
                    isLight 
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20 hover:shadow-indigo-600/30'
                      : 'bg-[#17ED61] text-black hover:brightness-110 shadow-[#17ED61]/10'
                  }`}
                  id="btn-quiz-submit-selection"
                >
                  Confirm Answer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: RESULTS SUMMARY PAGE */}
        {quizFinished && (
          <div className="max-w-[420px] w-full mx-auto animate-fade-in" id="quiz-assessment-finished-view">
            <div className={`p-8 rounded-2xl text-center space-y-7 relative overflow-hidden transition-all duration-300 shadow-2xl ${cardBg}`}>
              
              {/* Corner crosshairs/tick graphics directly resembling the snippet */}
              <div className="absolute inset-0 z-30 pointer-events-none p-1">
                {/* Top-Left Corner */}
                <div className="absolute top-2 left-2 flex flex-col">
                  <div className={`w-4.5 h-[2px] ${isLight ? 'bg-indigo-600/60' : 'bg-[#17ED61]/70'}`} />
                  <div className={`w-[2px] h-4.5 -mt-[2px] ${isLight ? 'bg-indigo-600/60' : 'bg-[#17ED61]/70'}`} />
                </div>
                {/* Top-Right Corner */}
                <div className="absolute top-2 right-2 flex flex-col items-end">
                  <div className={`w-4.5 h-[2px] ${isLight ? 'bg-indigo-600/60' : 'bg-[#17ED61]/70'}`} />
                  <div className={`w-[2px] h-4.5 -mt-[2px] ${isLight ? 'bg-indigo-600/60' : 'bg-[#17ED61]/70'}`} />
                </div>
                {/* Bottom-Left Corner */}
                <div className="absolute bottom-2 left-2 flex flex-col justify-end">
                  <div className={`w-[2px] h-4.5 ${isLight ? 'bg-indigo-600/60' : 'bg-[#17ED61]/70'}`} />
                  <div className={`w-4.5 h-[2px] -mt-[2px] ${isLight ? 'bg-indigo-600/60' : 'bg-[#17ED61]/70'}`} />
                </div>
                {/* Bottom-Right Corner */}
                <div className="absolute bottom-2 right-2 flex flex-col items-end justify-end">
                  <div className={`w-[2px] h-4.5 ${isLight ? 'bg-indigo-600/60' : 'bg-[#17ED61]/70'}`} />
                  <div className={`w-4.5 h-[2px] -mt-[2px] ${isLight ? 'bg-indigo-600/60' : 'bg-[#17ED61]/70'}`} />
                </div>
              </div>

              <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 h-14 w-14 rounded-full flex items-center justify-center text-2xl shadow-xl transition-all duration-300 ${
                isLight 
                  ? 'bg-white border border-indigo-100 text-indigo-600 shadow-indigo-200/50' 
                  : 'bg-slate-950 border border-[#17ED61]/40 shadow-[#17ED61]/20'
              }`}>
                🏆
              </div>

              <div className="pt-2 space-y-1.5">
                <span className={`text-xs font-bold tracking-widest uppercase font-mono block transition-colors duration-300 ${isLight ? 'text-pink-600' : 'text-[#17ED61]'}`}>
                  Candidate logs compiled!
                </span>
                <h2 className={`text-xl font-extrabold tracking-wide transition-colors duration-300 ${isLight ? 'text-slate-900 bg-clip-text text-transparent bg-gradient-to-r from-[#d946ef] via-[#8b5cf6] to-[#4f46e5]' : 'text-white'}`}>
                  ASSESSMENT CONCLUDED
                </h2>
                <p className={`text-xs transition-colors duration-300 ${descText}`}>
                  Congratulations. Your assessment is now complete.
                </p>
              </div>

              {/* Results stats layout */}
              <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto">
                <div className={`p-3.5 rounded-xl space-y-1 border transition-colors duration-300 ${
                  isLight ? 'bg-white/50 border-slate-200/60' : 'bg-black/40 border-white/5'
                }`}>
                  <p className={`text-[10px] font-mono uppercase transition-colors duration-300 ${isLight ? 'text-slate-500 font-semibold' : 'text-slate-500'}`}>Selected Student</p>
                  <p className={`text-xs font-bold truncate px-1 transition-colors duration-300 ${isLight ? 'text-slate-900' : 'text-white'}`}>{studentName} ({studentClass})</p>
                </div>
                <div className={`p-3.5 rounded-xl space-y-1 border transition-colors duration-300 ${
                  isLight ? 'bg-indigo-50/60 border-indigo-200/50' : 'bg-black/40 border-[#17ED61]/25'
                }`}>
                  <p className={`text-[10px] font-mono uppercase transition-colors duration-300 ${isLight ? 'text-indigo-600 font-semibold' : 'text-[#17ED61]'}`}>Correct Score</p>
                  <p className={`text-base font-extrabold transition-colors duration-300 ${isLight ? 'text-indigo-950' : 'text-[#17ED61]'}`}>
                    {score} / {Math.min(shuffledQuestions.length, questions.length)}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setQuizFinished(false);
                  setShowDashboard(true);
                  setIsAssessmentInitiated(false);
                  setCurrentQuestionIdx(0);
                  setScore(0);
                  setShowFeedbackPopup(false);
                }}
                className={`w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest transition duration-300 flex items-center justify-center gap-2 cursor-pointer focus:outline-none ${submitButton}`}
              >
                <RotateCcw className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </button>
            </div>
          </div>
        )}

      </div>



      {/* FOOTER: SYSTEM LOGS & ACTIONS ADMIN CONSOLE (ONLY visible when secret button toggled) */}
      {showTeacherControls && (
        <div className="relative z-10 p-5 bg-slate-950 border-t border-white/10 space-y-4 animate-slide-up" id="teacher-lab-results-monitor-cockpit">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/5">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-[#17ED61] shrink-0" />
              <h3 className="text-xs font-bold text-[#17ED61] uppercase tracking-wider">
                Laboratory Security override Console (Teacher Panel)
              </h3>
              <span className="px-1.5 py-0.5 rounded bg-[#17ED61]/10 border border-[#17ED61]/20 text-[9px] text-[#17ED61] font-mono">
                Admin Station
              </span>
            </div>

            {/* Quick action buttons in teacher override panel */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <label className="px-2.5 py-1.5 rounded-lg bg-[#17ED61]/10 hover:bg-[#17ED61]/20 border border-[#17ED61]/35 text-[10px] font-bold text-[#17ED61] flex items-center gap-1.5 cursor-pointer transition">
                <Upload className="w-3.5 h-3.5 text-[#17ED61]" />
                <span>Upload Custom CSV</span>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCustomCSVUpload}
                  className="hidden"
                  id="csv-file-uploader-handle-secret"
                />
              </label>

              {questions.length > 0 && (
                <button
                  onClick={resetQuestionsToDefault}
                  className="px-2.5 py-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-[10px] font-bold text-red-300 flex items-center gap-1 transition"
                  id="btn-revert-qdb-default-secret"
                >
                  Reset Questions
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between font-mono text-[10px] text-slate-400">
            <span>Student grade records list (Offline Buffer)</span>
            
            {resultsLog.length > 0 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={clearLocalResultsCache}
                  className="p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded transition"
                  id="btn-clear-local-cache"
                  title="Wipe database cache"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {resultsLog.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-white/5 text-center text-slate-500 text-[11px] font-medium">
              No results logged in current session cache. Candidate logs write automatically upon completion.
            </div>
          ) : (
            <div className="max-h-[140px] overflow-y-auto border border-white/5 bg-black/40 rounded-xl p-3 divide-y divide-white/5 font-mono text-[10px] text-slate-300 scrollbar-thin">
              {resultsLog.map((log, index) => (
                <div key={index} className="py-2 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                  <span className="text-slate-500 shrink-0">[{log.timestamp}]</span>
                  <span className="font-semibold text-slate-200 truncate flex-1 block">Candidate: {log.studentName}</span>
                  <span className={`font-bold shrink-0 ${log.score >= log.totalQuestions * 0.7 ? 'text-[#17ED61]' : 'text-amber-400'}`}>
                    Score: {log.score} / {log.totalQuestions} ({Math.round((log.score / log.totalQuestions) * 100)}%)
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Premium FULL SCREEN dark overlay container with AnimatePresence (rendered at Root to escape relative CSS scales/filters perfectly) */}
      <AnimatePresence>
        {showFeedbackPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 w-screen h-screen z-[99999] backdrop-blur-3xl bg-black/85 flex items-center justify-center p-4"
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, width: '100vw', height: '100vh', zIndex: 99999999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            id="answered-question-feedback-overlay"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: -30, opacity: 0 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className={`w-full max-w-[420px] p-8 rounded-3xl text-center shadow-[0_30px_95px_rgba(0,0,0,0.95)] relative overflow-hidden border ${
                isLight 
                  ? 'bg-white/80 border-white/50 text-slate-800 shadow-indigo-500/10 shadow-2xl' 
                  : 'bg-[#090514]/90 border-white/10 text-white shadow-[#17ED61]/5 shadow-2xl'
              }`}
            >
              {/* Floating glowing light leaks */}
              <div className={`absolute -top-24 -left-24 w-48 h-48 rounded-full blur-3xl opacity-35 pointer-events-none ${feedbackIsCorrect ? 'bg-emerald-500/30' : 'bg-red-500/30'}`} />
              <div className={`absolute -bottom-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-35 pointer-events-none ${feedbackIsCorrect ? 'bg-emerald-400/30' : 'bg-red-500/30'}`} />

              <div className="space-y-6 relative z-10">
                {/* Animated Large SVG checkmark or cross sign */}
                <div className="flex justify-center py-2 relative">
                  {/* Pulsing ring background */}
                  <div className={`absolute inset-0 w-20 h-20 mx-auto rounded-full animate-ping opacity-15 duration-1000 ${
                    feedbackIsCorrect ? 'bg-emerald-500' : 'bg-rose-500'
                  }`} />
                  
                  <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg border relative z-10 ${
                    feedbackIsCorrect 
                      ? 'bg-emerald-50/90 border-emerald-200 shadow-md' 
                      : 'bg-rose-50/90 border-rose-200 shadow-md'
                  }`}>
                    {feedbackIsCorrect ? (
                      <svg className="w-12 h-12 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                        <motion.path 
                          initial={{ pathLength: 0 }} 
                          animate={{ pathLength: 1 }} 
                          transition={{ duration: 0.35, ease: "easeOut" }}
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          d="M5 13l4 4L19 7" 
                        />
                      </svg>
                    ) : (
                      <svg className="w-11 h-11 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                        <motion.path 
                          initial={{ pathLength: 0 }} 
                          animate={{ pathLength: 1 }} 
                          transition={{ duration: 0.3, ease: "easeOut" }}
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          d="M6 18L18 6M6 6l12 12" 
                        />
                      </svg>
                    )}
                  </div>
                </div>

                {/* Text Header with custom styling */}
                <div className="space-y-1">
                  <h3 className={`text-3xl font-black uppercase tracking-wider leading-none ${
                    feedbackIsCorrect 
                      ? 'text-emerald-500' 
                      : 'text-rose-500'
                  }`}>
                    {feedbackIsCorrect ? 'CORRECT!' : 'INCORRECT'}
                  </h3>
                  <p className={`text-[10px] leading-normal font-sans font-medium uppercase tracking-widest ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    {feedbackIsCorrect 
                      ? 'Excellent work! ICT score recorded +1' 
                      : 'Nice effort! The correct response is shown below.'
                    }
                  </p>
                </div>

                {/* Options Display Detail Blocks */}
                <div className="space-y-3">
                  {feedbackIsCorrect ? (
                    <div className={`p-4 rounded-2xl border text-left bg-emerald-500/5 ${
                      isLight ? 'border-emerald-100 text-slate-800' : 'border-emerald-500/10 text-emerald-100'
                    }`}>
                      <span className="font-mono text-[9px] font-bold block uppercase tracking-widest opacity-60 mb-1.5 text-emerald-600">
                        RECORDED OPTION {selectedAnswer}:
                      </span>
                      <div className="flex items-start gap-2.5">
                        <span className="px-2 py-0.5 font-mono font-black rounded text-xs bg-emerald-100 text-emerald-800 border border-emerald-200">
                          {selectedAnswer}
                        </span>
                        <span className="text-xs font-semibold leading-normal">{correctAnswerValue}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {/* Selected option if any */}
                      <div className={`p-3.5 rounded-2xl border text-left bg-rose-500/5 ${
                        isLight ? 'border-rose-100 text-slate-800' : 'border-rose-500/10 text-rose-100'
                      }`}>
                        <span className="font-mono text-[9px] font-bold block uppercase tracking-widest opacity-60 mb-1 text-rose-500">
                          YOUR RESPONSE:
                        </span>
                        <div className="flex items-start gap-2.5">
                          <span className="px-2 py-0.5 font-mono font-black rounded text-xs bg-rose-100 text-rose-800 border border-rose-200">
                            {selectedAnswer || 'TIME EXPIRED'}
                          </span>
                          <span className="text-xs font-semibold leading-normal">
                            {selectedAnswer 
                              ? (currentQuestion?.[`Option${selectedAnswer}` as keyof QuizQuestion] || '') 
                              : 'No option was selected within 30 seconds limit.'
                            }
                          </span>
                        </div>
                      </div>

                      {/* Correct Option */}
                      <div className={`p-3.5 rounded-2xl border text-left bg-emerald-500/5 ${
                        isLight ? 'border-emerald-100 text-slate-800' : 'border-emerald-500/10 text-[#54df7f]'
                      }`}>
                        <span className="font-mono text-[9px] font-bold block uppercase tracking-widest opacity-60 mb-1 text-emerald-600">
                          CORRECT RESPONSE:
                        </span>
                        <div className="flex items-start gap-2.5">
                          <span className="px-2 py-0.5 font-mono font-black rounded text-xs bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {correctAnswerLetter}
                          </span>
                          <span className="text-xs font-semibold leading-normal">{correctAnswerValue}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Continue Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleNextQuestionManual}
                  className={`w-full py-3.5 rounded-2xl text-xs font-bold uppercase tracking-widest text-white shadow-lg transition-all duration-300 cursor-pointer ${
                    feedbackIsCorrect
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:brightness-110 shadow-emerald-500/20'
                      : 'bg-gradient-to-r from-indigo-500 to-violet-600 hover:brightness-110 shadow-indigo-500/20'
                  }`}
                >
                  PROCEED TO NEXT QUERY &rarr;
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
