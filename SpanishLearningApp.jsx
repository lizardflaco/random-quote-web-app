import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Play, Pause, Mic, MicOff, Volume2, Globe, Settings, Award,
  BarChart3, Headphones, Eye, Brain, Zap, Target, Book, Users,
  Camera, MessageSquare, TrendingUp, Star, CheckCircle, Lock,
  Flame, Trophy, Shield, Swords, Heart, Bell, BellRing, X,
  Menu, RefreshCw
} from 'lucide-react';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-900 to-pink-900 flex items-center justify-center text-white p-4">
          <div className="text-center bg-black/30 rounded-2xl p-8 border border-red-400/30">
            <h1 className="text-2xl font-bold mb-4">¡Oops! Something went wrong</h1>
            <p className="text-red-200 mb-6">Don't worry, your progress is saved!</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-600 hover:bg-red-700 px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Restart App
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Custom Hooks
const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      setStoredValue(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key]);

  return [storedValue, setValue];
};

const useAudioRecording = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState(null);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      setIsRecording(true);
      recorder.start();
    } catch (error) {
      console.warn('Microphone access denied, using simulation mode');
      setIsRecording(true); // Fallback to simulation
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
    }
    setIsRecording(false);
    setRecordingTime(0);
  }, [mediaRecorder]);

  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  return { isRecording, recordingTime, startRecording, stopRecording };
};

const useGameification = () => {
  const [currentXP, setCurrentXP] = useLocalStorage('currentXP', 2350);
  const [userLevel, setUserLevel] = useLocalStorage('userLevel', 8);
  const [totalPoints, setTotalPoints] = useLocalStorage('totalPoints', 18750);
  const [streakDays, setStreakDays] = useLocalStorage('streakDays', 12);
  const [recentXPGain, setRecentXPGain] = useState(0);
  const [showXPAnimation, setShowXPAnimation] = useState(false);

  const xpToNextLevel = useMemo(() => userLevel * 500 + 1000, [userLevel]);

  const addXP = useCallback((score, difficulty = 'beginner') => {
    const baseXP = Math.floor(score / 10) * 10;
    const difficultyMultiplier = {
      beginner: 1,
      intermediate: 1.2,
      advanced: 1.5
    };
    const xpGained = Math.floor(baseXP * (difficultyMultiplier[difficulty] || 1));

    setRecentXPGain(xpGained);
    setShowXPAnimation(true);

    setCurrentXP(prev => {
      const newXP = prev + xpGained;
      if (newXP >= xpToNextLevel) {
        setUserLevel(prevLevel => prevLevel + 1);
        // unlockAchievement('level_up'); // This needs to be handled in the component
        // showNotification('Level Up!', `Congratulations! You reached level ${userLevel + 1}!`); // Handled in component
      }
      return newXP; // Return newXP so it can be used to check against xpToNextLevel in component
    });

    setTotalPoints(prev => prev + xpGained);

    // Auto-hide animation
    setTimeout(() => {
      setShowXPAnimation(false);
      setRecentXPGain(0);
    }, 2000);
  }, [xpToNextLevel, setCurrentXP, setUserLevel, setTotalPoints]);


  return {
    currentXP,
    userLevel,
    totalPoints,
    streakDays,
    xpToNextLevel,
    recentXPGain,
    showXPAnimation,
    addXP,
    setStreakDays, // Added to allow modification from component
    setCurrentXP,  // Added for reset
    setUserLevel,  // Added for reset
    setTotalPoints // Added for reset
  };
};

// Main Component
const SpanishLearningApp = () => {
  // Core State
  const processingTimeoutRef = useRef(null); // Ref for the AI processing timeout
  const [selectedDialect, setSelectedDialect] = useLocalStorage('selectedDialect','mexico');
  const [currentModule, setCurrentModule] = useLocalStorage('currentModule','pronunciation');
  const [currentWord, setCurrentWord] = useLocalStorage('currentWordIndex',0); // Changed to currentWordIndex for clarity
  const [pronunciationScore, setPronunciationScore] = useState(0);
  const [realTimeScore, setRealTimeScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showVisualFeedback, setShowVisualFeedback] = useState(false);
  const [hasRecorded, setHasRecorded] = useState(false);

  // Gamification
  const gamification = useGameification();

  // Progress & Settings
  const [dailyGoal, setDailyGoal] = useLocalStorage('dailyGoal', 15);
  const [dailyProgress, setDailyProgress] = useLocalStorage('dailyProgress', 11);
  const [notificationsEnabled, setNotificationsEnabled] = useLocalStorage('notificationsEnabled', false); // Key name consistency
  const [dailyReminder, setDailyReminder] = useLocalStorage('dailyReminder', '18:00');

  // Modal States
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [newAchievement, setNewAchievement] = useState(null);

  // Audio Recording
  const { isRecording, recordingTime, startRecording, stopRecording } = useAudioRecording();

  // Achievements
  const initialAchievements = [
    { id: 'first_perfect', name: 'Perfect Score', desc: 'Score 100% on pronunciation', unlocked: false, xp: 100, icon: '🎯' },
    { id: 'dialect_master', name: 'Dialect Master', desc: 'Master 3 different dialects', unlocked: false, xp: 500, icon: '🌍' },
    { id: 'streak_warrior', name: 'Streak Warrior', desc: '10-day learning streak', unlocked: false, xp: 300, icon: '🔥' },
    { id: 'conversation_hero', name: 'Conversation Hero', desc: 'Complete 25 conversations', unlocked: false, xp: 750, icon: '💬' },
    { id: 'phonetic_master', name: 'Phonetic Master', desc: 'Master advanced phonetics', unlocked: false, xp: 1000, icon: '🔬' },
    { id: 'cultural_expert', name: 'Cultural Expert', desc: 'Complete cultural modules', unlocked: false, xp: 600, icon: '🎭' },
    { id: 'level_up', name: 'Level Up!', desc: 'Reach a new level', unlocked: false, xp: 50, icon: '🚀' }, // Added level up achievement
    { id: 'daily_warrior', name: 'Daily Warrior', desc: 'Complete your daily goal', unlocked: false, xp: 50, icon: '📅' } // Added daily goal achievement
  ];
  const [achievements, setAchievements] = useLocalStorage('achievements', initialAchievements);


  // Waveform Animation
  const [waveformData, setWaveformData] = useState(() =>
    Array.from({ length: 50 }, () => Math.random() * 30 + 5)
  );

  // Practice Words Data
  const practiceWords = useMemo(() => ({
    pronunciation: [
      { word: "pronunciación", ipa: "/pɾo.nun.θja.ˈθjon/", difficulty: "intermediate", meaning: "pronunciation" },
      { word: "rápidamente", ipa: "/ˈra.pi.ða.ˈmen.te/", difficulty: "advanced", meaning: "quickly" },
      { word: "trabajar", ipa: "/tɾa.ba.ˈxar/", difficulty: "beginner", meaning: "to work" },
      { word: "desarrollar", ipa: "/de.sa.ro.ˈʎar/", difficulty: "advanced", meaning: "to develop" }
    ],
    conversation: [
      { word: "¿Cómo está usted?", ipa: "/ˈko.mo es.ˈta us.ˈteð/", difficulty: "beginner", meaning: "How are you? (formal)" },
      { word: "Me gustaría", ipa: "/me ɣus.ta.ˈri.a/", difficulty: "intermediate", meaning: "I would like" }
    ],
    cultural: [
      { word: "saludos", ipa: "/sa.ˈlu.ðos/", difficulty: "beginner", meaning: "greetings" },
      { word: "cortesía", ipa: "/koɾ.te.ˈsi.a/", difficulty: "intermediate", meaning: "courtesy" }
    ],
    phonetics: [
      { word: "rr fuerte", ipa: "/ˈrr ˈfweɾ.te/", difficulty: "advanced", meaning: "strong R sound" },
      { word: "ñoño", ipa: "/ˈɲo.ɲo/", difficulty: "intermediate", meaning: "nerdy" }
    ],
    immersion: [
      { word: "inmersión total", ipa: "/in.meɾ.ˈsjon to.ˈtal/", difficulty: "advanced", meaning: "total immersion" }
    ],
    assessment: [
      { word: "evaluación", ipa: "/e.ba.lua.ˈθjon/", difficulty: "intermediate", meaning: "evaluation" }
    ]
  }), []);

  // Dialects Data
  const dialects = useMemo(() => [
    {
      id: 'mexico', name: 'Mexican Spanish', flag: '🇲🇽', accent: 'Neutral Mexican',
      difficulty: 'Beginner', users: '2.1M', masteryLevel: 85, unlockedLessons: 24, totalLessons: 30,
      culturalNote: 'Uses neutral pronunciation, heavy use of diminutives (-ito, -ita)'
    },
    {
      id: 'spain', name: 'Castilian Spanish', flag: '🇪🇸', accent: 'Madrid Standard',
      difficulty: 'Intermediate', users: '890K', masteryLevel: 67, unlockedLessons: 18, totalLessons: 28,
      culturalNote: 'Features distinción (th/s distinction) and vosotros form'
    },
    {
      id: 'argentina', name: 'Argentine Spanish', flag: '🇦🇷', accent: 'Rioplatense',
      difficulty: 'Advanced', users: '650K', masteryLevel: 45, unlockedLessons: 12, totalLessons: 35,
      culturalNote: 'Uses vos instead of tú, Italian influence in intonation'
    },
    {
      id: 'colombia', name: 'Colombian Spanish', flag: '🇨🇴', accent: 'Bogotá Clear',
      difficulty: 'Beginner', users: '1.2M', masteryLevel: 92, unlockedLessons: 27, totalLessons: 30,
      culturalNote: 'Known for clear pronunciation, formal register'
    }
    // Removed 'global' dialect as it's not fully integrated and causes issues with getPronunciationData
  ], []);

  // Learning Modules
  const learningModules = useMemo(() => [
    {
      id: 'pronunciation', name: 'AI Pronunciation', icon: Mic,
      color: 'from-green-500 to-emerald-500', progress: 78, xpEarned: 1250, streak: 5, lastScore: 94,
      description: 'Master pronunciation with AI feedback'
    },
    {
      id: 'conversation', name: 'Real Scenarios', icon: MessageSquare,
      color: 'from-blue-500 to-cyan-500', progress: 65, xpEarned: 890, streak: 3, lastScore: 87,
      description: 'Practice with real-world conversations'
    },
    {
      id: 'cultural', name: 'Cultural Context', icon: Globe,
      color: 'from-purple-500 to-violet-500', progress: 45, xpEarned: 650, streak: 2, lastScore: 82,
      description: 'Learn cultural nuances and customs'
    },
    {
      id: 'phonetics', name: 'Advanced Phonetics', icon: Eye,
      color: 'from-orange-500 to-red-500', progress: 32, xpEarned: 420, streak: 1, lastScore: 76,
      description: 'Deep dive into Spanish sound system'
    },
    {
      id: 'immersion', name: 'AI Immersion', icon: Brain,
      color: 'from-pink-500 to-rose-500', progress: 58, xpEarned: 780, streak: 4, lastScore: 91,
      description: 'Full immersion learning experience'
    },
    {
      id: 'assessment', name: 'Skill Testing', icon: Target,
      color: 'from-indigo-500 to-blue-600', progress: 71, xpEarned: 1100, streak: 6, lastScore: 88,
      description: 'Test and certify your skills'
    }
  ], []);


  const showNotification = useCallback((title, body) => {
    if (notificationsEnabled && 'Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, { body, icon: '/favicon.ico' }); // Assuming you have a favicon
      } catch (error) {
        console.error('Notification error:', error);
      }
    } else {
      console.log(`Notification (simulated): ${title} - ${body}`);
    }
  }, [notificationsEnabled]);


  const unlockAchievement = useCallback((achievementId) => {
    setAchievements(prev => {
      const achievementToUnlock = prev.find(ach => ach.id === achievementId);
      if (achievementToUnlock && !achievementToUnlock.unlocked) {
        const updatedAchievements = prev.map(ach =>
          ach.id === achievementId ? { ...ach, unlocked: true } : ach
        );
        setNewAchievement(achievementToUnlock); //
        setShowAchievementModal(true);
        gamification.addXP(achievementToUnlock.xp); // Add XP for achievement
        showNotification('Achievement Unlocked!', `${achievementToUnlock.name} - +${achievementToUnlock.xp} XP`);
        return updatedAchievements;
      }
      return prev;
    });
  }, [setAchievements, gamification, showNotification]);


  // Add this useEffect to handle level up notifications based on gamification hook changes
  useEffect(() => {
    const previousUserLevel = parseInt(localStorage.getItem('userLevelBeforeUpdate') || gamification.userLevel.toString(), 10);
    if (gamification.userLevel > previousUserLevel) {
      unlockAchievement('level_up');
      showNotification('Level Up!', `Congratulations! You reached level ${gamification.userLevel}!`);
    }
    localStorage.setItem('userLevelBeforeUpdate', gamification.userLevel.toString());
  }, [gamification.userLevel, unlockAchievement, showNotification]);


  // Computed Values
  const getCurrentWordData = useCallback(() => { // Renamed from getCurrentWord to avoid conflict
    const moduleWords = practiceWords[currentModule] || practiceWords.pronunciation;
    return moduleWords[currentWord] || moduleWords[0];
  }, [practiceWords, currentModule, currentWord]);

  const getCurrentDialect = useCallback(() => {
    return dialects.find(d => d.id === selectedDialect) || dialects[0];
  }, [dialects, selectedDialect]);


  const getPronunciationData = useCallback(() => {
    const wordData = getCurrentWordData();
    if (!wordData) return { dialects: {} }; // Graceful handling if wordData is undefined

    const baseIpa = wordData.ipa || "";
    const baseWord = wordData.word || "";

    return {
      ...wordData,
      dialects: {
        spain: { ipa: baseIpa.replace(/s/g, 'θ'), audio: baseWord.replace(/[cs]([ei])/g, 'th$1'), accuracy: 92 },
        mexico: { ipa: baseIpa, audio: baseWord, accuracy: 89 },
        argentina: { ipa: baseIpa.replace(/ʎ/g, 'ʃ'), audio: baseWord.replace(/ll/g, 'sh'), accuracy: 76 },
        colombia: { ipa: baseIpa, audio: baseWord, accuracy: 94 },
        // Removed 'global' to prevent errors if not in dialects array
      }
    };
  }, [getCurrentWordData]);


  // Effects
  useEffect(() => { // Real-time score simulation
    let interval;
    if (isRecording && recordingTime > 10) { // Start simulation after 1s (10 * 100ms)
      interval = setInterval(() => {
        // Simulate real-time scoring with more realistic progression
        const targetScore = 75 + Math.random() * 20; // Target score between 75-95
        // Progress towards target score based on recording time
        const currentProgress = Math.min(targetScore, (recordingTime / 10) * 15 + Math.random() * 20);
        setRealTimeScore(Math.min(100, currentProgress)); // Cap at 100
      }, 200); // Update every 200ms
    } else if (!isRecording) {
      setRealTimeScore(0); // Reset when not recording
    }
    return () => clearInterval(interval);
  }, [isRecording, recordingTime]);


  useEffect(() => { // Waveform update
    if (isRecording) {
      const interval = setInterval(() => {
        setWaveformData(prev =>
          prev.map((_, i) => {
            const time = Date.now() * 0.001;
            // More dynamic waveform
            return Math.abs(Math.sin(time * 2 + i * 0.3) * (20 + Math.random()*10) ) + Math.random() * 10 + 5;
          })
        );
      }, 150); // Update rate
      return () => clearInterval(interval);
    }
  }, [isRecording]);

  // Event Handlers
  const toggleRecording = useCallback(() => {
    if (!isRecording) {
      startRecording();
      setHasRecorded(true);
      setShowVisualFeedback(true);
      setPronunciationScore(0); // Reset score before new recording

      // Simulate AI processing delay and result
      setTimeout(() => {
        if (!isRecording) return; // Check if recording was stopped prematurely

        const wordData = getCurrentWordData();
        const baseScore = 65 + Math.random() * 35; // Score between 65-100
        const difficulty = wordData?.difficulty || 'beginner';
        const difficultyMultiplier = { beginner: 1.05, intermediate: 1.0, advanced: 0.95 }[difficulty];
        const finalScore = Math.min(100, Math.floor(baseScore * difficultyMultiplier));

        setPronunciationScore(finalScore);
        gamification.addXP(finalScore, difficulty);
        updateDailyProgress(); // This function needs to be defined or integrated

        if (finalScore === 100) {
          unlockAchievement('first_perfect');
        }
        stopRecording(); // Stop recording after processing
      }, 2500 + Math.random() * 1000); // Realistic AI processing time
    } else {
      stopRecording();
    }
  }, [isRecording, startRecording, stopRecording, getCurrentWordData, gamification, unlockAchievement, showNotification]);


  const togglePlayAudio = useCallback(() => {
    setIsPlaying(prev => !prev);
    if (!isPlaying) {
      // In a real app, this would play actual audio
      // For now, simulate playback duration
      setTimeout(() => setIsPlaying(false), 2000);
    }
  }, [isPlaying]);

  const nextWord = useCallback(() => {
    const moduleWords = practiceWords[currentModule] || practiceWords.pronunciation;
    setCurrentWord((prev) => (prev + 1) % moduleWords.length);
    setPronunciationScore(0);
    setShowVisualFeedback(false);
    setHasRecorded(false);
    setIsPlaying(false); // Stop audio if playing
  }, [practiceWords, currentModule, setCurrentWord]);


  const updateDailyProgress = useCallback(() => {
    setDailyProgress(prev => {
      const newProgress = Math.min(dailyGoal, prev + 1);
      if (newProgress === dailyGoal && prev < dailyGoal) { // Check if goal was just completed
        showNotification('Daily Goal Complete!', `Amazing! You've completed all ${dailyGoal} exercises today! 🎉`);
        unlockAchievement('daily_warrior'); // Unlock daily achievement
      }
      return newProgress;
    });
  }, [dailyGoal, setDailyProgress, showNotification, unlockAchievement]);


  const selectDialect = useCallback((dialectId) => {
    const dialect = dialects.find(d => d.id === dialectId);
    // Allow selection if dialect exists and meets criteria (or is a default unlocked one)
    if (dialect && (dialect.masteryLevel >= 20 || ['mexico', 'colombia'].includes(dialect.id))) {
      setSelectedDialect(dialectId);
      setPronunciationScore(0); // Reset score for new dialect
      setShowVisualFeedback(false);
      setHasRecorded(false);
    } else {
      showNotification("Dialect Locked", "Improve your mastery or choose an unlocked dialect.");
    }
  }, [dialects, setSelectedDialect, showNotification]);

  const selectModule = useCallback((moduleId) => {
    setCurrentModule(moduleId);
    setCurrentWord(0); // Reset to first word of new module
    setPronunciationScore(0);
    setShowVisualFeedback(false);
    setHasRecorded(false);
    setIsPlaying(false);
  }, [setCurrentModule, setCurrentWord]);


  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      showNotification("Feature Not Supported", "Notifications are not supported in your browser.");
      setNotificationsEnabled(true); // Simulate for demo
      setShowNotificationModal(false);
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotificationsEnabled(true);
        setShowNotificationModal(false);
        showNotification('Success!', 'Daily reminders are now enabled 🎉');
        // scheduleNotification(); // Implement scheduling logic if needed
      } else {
        setNotificationsEnabled(false);
        showNotification('Permission Denied', 'Notifications were not enabled. You can enable them later in settings.');
      }
    } catch (error) {
      console.error('Notification permission error:', error);
      // Fallback for browsers that might throw an error or for demo
      setNotificationsEnabled(true); // Simulate success for demo
      setShowNotificationModal(false);
      showNotification('Notifications Enabled (Simulated)', 'Daily reminders are now active.');
    }
  }, [setNotificationsEnabled, showNotification]);


  const resetProgress = useCallback(() => {
    if (window.confirm('Are you sure you want to reset ALL your progress? This cannot be undone.')) {
      // Clear specific items from localStorage
      localStorage.removeItem('currentXP');
      localStorage.removeItem('userLevel');
      localStorage.removeItem('totalPoints');
      localStorage.removeItem('streakDays');
      localStorage.removeItem('dailyGoal');
      localStorage.removeItem('dailyProgress');
      localStorage.removeItem('notificationsEnabled');
      localStorage.removeItem('dailyReminder');
      localStorage.removeItem('achievements');
      localStorage.removeItem('selectedDialect');
      localStorage.removeItem('currentModule');
      localStorage.removeItem('currentWordIndex');
      localStorage.removeItem('learnedWordsByModule'); // Ensure module progress is cleared

      // Reset state, then reload to ensure all defaults are applied
      // This is a bit of a hard reset, but effective for localStorage backed states
      window.location.reload();
    }
  }, []);

  // MODULE COMPLETION LOGIC (NEW)
  const [learnedWordsByModule, setLearnedWordsByModule] = useLocalStorage('learnedWordsByModule', {});
  const [moduleCompleted, setModuleCompleted] = useState(false);

  // Update learned words within toggleRecording
  // Modified toggleRecording to include this:
  const toggleRecordingWithModuleTracking = useCallback(() => {
    if (!isRecording) {
      startRecording();
      setHasRecorded(true);
      setShowVisualFeedback(true);
      setPronunciationScore(0);

      // Clear any existing timeout before setting a new one
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }

      processingTimeoutRef.current = setTimeout(() => {
        // Check if component is still mounted or recording is still relevant
        // This check might be redundant if stopRecording in timeout is effective
        // and cleanup effect handles unmount.
        if (!isRecording && mediaRecorder && mediaRecorder.state === 'inactive' && !document.hidden) {
            // This condition implies recording was already stopped or not relevant.
            // The original logic was to check if it can proceed, but if it's already stopped,
            // it shouldn't proceed with setting scores.
            // The primary goal is to avoid state updates if unmounted or processing is stale.
            // The `stopRecording()` call at the end of this timeout is crucial.
        } else if (!isRecording) { 
            return; // Already stopped, don't update state
        }


        const wordData = getCurrentWordData();
        } else if (!isRecording) { // If recording stopped for other reasons, exit
            return;
        }


        const wordData = getCurrentWordData();
        const baseScore = 65 + Math.random() * 35;
        const difficulty = wordData?.difficulty || 'beginner';
        const difficultyMultiplier = { beginner: 1.05, intermediate: 1.0, advanced: 0.95 }[difficulty];
        const finalScore = Math.min(100, Math.floor(baseScore * difficultyMultiplier));

        setPronunciationScore(finalScore);
        gamification.addXP(finalScore, difficulty);
        updateDailyProgress();

        if (finalScore === 100) {
          unlockAchievement('first_perfect');
        }

        // Add to learnedWordsByModule
        setLearnedWordsByModule(prev => {
          const currentModuleLearnedWords = prev[currentModule] || [];
          if (!currentModuleLearnedWords.includes(currentWord)) {
            return {
              ...prev,
              [currentModule]: [...currentModuleLearnedWords, currentWord]
            };
          }
          return prev;
        });
        if (stopRecording) stopRecording(); 
        processingTimeoutRef.current = null; // Clear ref after execution
      }, 2500 + Math.random() * 1000);
    } else {
       if (stopRecording) stopRecording();
       if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
        processingTimeoutRef.current = null;
      }
    }
  }, [
      isRecording, startRecording, stopRecording, getCurrentWordData, gamification,
      unlockAchievement, updateDailyProgress, currentModule, currentWord,
      setLearnedWordsByModule, mediaRecorder // Added mediaRecorder
    ]);


  useEffect(() => { // Check for module completion
    const wordsInCurrentModule = practiceWords[currentModule] || [];
    const learnedIndicesForModule = learnedWordsByModule[currentModule] || [];
    if (wordsInCurrentModule.length > 0 && learnedIndicesForModule.length === wordsInCurrentModule.length) {
      setModuleCompleted(true);
    } else {
      setModuleCompleted(false);
    }
  }, [learnedWordsByModule, currentModule, practiceWords]);

  // Cleanup timeout on component unmount
  useEffect(() => {
    return () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
    };
  }, []);

  // Reset learnedWordsByModule in resetProgress
  // (This is handled by localStorage.clear() in the current resetProgress,
  // but if a more granular reset is needed, it should be added there)


  const currentWordDisplay = getCurrentWordData()?.word || "Loading...";
  const currentWordIPA = getPronunciationData().dialects[selectedDialect]?.ipa || getCurrentWordData()?.ipa || "N/A";
  const currentDialectName = getCurrentDialect()?.name || "Dialect";
  const currentWordDifficulty = getCurrentWordData()?.difficulty || "N/A";
  const currentWordMeaning = getCurrentWordData()?.meaning || "N/A";
  const audioGuideText = getPronunciationData().dialects[selectedDialect]?.audio || getCurrentWordData()?.word || "N/A";
  const communityAccuracy = getPronunciationData().dialects[selectedDialect]?.accuracy || 85;


  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white font-sans"> {/* Added font-sans */}
        {/* XP Animation */}
        {gamification.showXPAnimation && gamification.recentXPGain > 0 && (
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[100] pointer-events-none"> {/* Increased z-index */}
            <div className="animate-bounce bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-6 py-3 rounded-full text-xl font-bold shadow-lg">
              +{gamification.recentXPGain} XP!
            </div>
          </div>
        )}

        {/* Achievement Modal */}
        {showAchievementModal && newAchievement && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[90] flex items-center justify-center p-4"> {/* Increased z-index */}
            <div className="bg-gradient-to-br from-yellow-500/20 via-orange-500/20 to-red-500/20 rounded-2xl p-8 max-w-md w-full border border-yellow-400/50 text-center shadow-2xl">
              <div className="text-6xl mb-4 transition-transform hover:scale-110">{newAchievement.icon}</div>
              <h2 className="text-2xl font-bold text-yellow-400 mb-2">{newAchievement.name}</h2>
              <h3 className="text-xl font-semibold mb-2">Achievement Unlocked!</h3>
              <p className="text-gray-300 mb-4">{newAchievement.desc}</p>
              <div className="text-lg font-bold text-green-400 mb-6">+{newAchievement.xp} XP Earned!</div>
              <button
                onClick={() => setShowAchievementModal(false)}
                className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 px-6 py-2 rounded-lg font-bold transition-all duration-300 transform hover:scale-105"
              >
                Awesome!
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-black/30 backdrop-blur-md border-b border-white/20 sticky top-0 z-50"> {/* Increased blur */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3"> {/* Adjusted padding */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white/30">
                    <Brain className="w-7 h-7 text-white" /> {/* Slightly smaller icon */}
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-xs font-bold border-2 border-black/50">
                    {gamification.userLevel}
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
                    SpanishAI Pro
                  </h1>
                  <p className="text-xs sm:text-sm text-blue-200">Lvl {gamification.userLevel} • {gamification.totalPoints.toLocaleString()} XP</p> {/* Shorter labels */}
                </div>
              </div>

              <div className="hidden md:flex items-center space-x-4"> {/* Hide on small screens */}
                <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 px-3 py-1.5 rounded-full border border-green-400/30">
                  <div className="flex items-center space-x-1.5">
                    <Target className="w-3.5 h-3.5 text-green-400" />
                    <span className="text-xs font-medium">{dailyProgress}/{dailyGoal}</span>
                  </div>
                  <div className="w-20 bg-black/30 rounded-full h-1.5 mt-1">
                    <div
                      className="h-1.5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (dailyProgress / dailyGoal) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 px-3 py-1.5 rounded-full border border-orange-400/30">
                  <div className="flex items-center space-x-1.5">
                    <Flame className="w-3.5 h-3.5 text-orange-400" />
                    <span className="font-bold text-sm">{gamification.streakDays}</span>
                    <span className="text-xs">streak</span>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 px-3 py-1.5 rounded-full border border-purple-400/30 text-center">
                    <div className="text-xxs text-purple-200">Next Lvl</div> {/* Even smaller text */}
                    <div className="font-bold text-xs">{Math.max(0, gamification.xpToNextLevel - gamification.currentXP)}</div>
                  <div className="w-16 bg-black/30 rounded-full h-1.5 mt-0.5">
                    <div
                      className="h-1.5 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (gamification.currentXP / gamification.xpToNextLevel) * 100)}%` }}
                    />
                  </div>
                </div>

                <button
                  onClick={() => setShowNotificationModal(true)}
                  className={`p-2.5 rounded-full border-2 transition-all duration-300 ${
                    notificationsEnabled
                      ? 'bg-green-500/20 border-green-400/50 text-green-400'
                      : 'bg-gray-500/20 border-gray-400/50 text-gray-400 hover:border-yellow-400/50 hover:text-yellow-400'
                  }`}
                  title={notificationsEnabled ? 'Notifications enabled' : 'Enable notifications'}
                >
                  {notificationsEnabled ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                </button>

                <button
                  onClick={() => setShowSettingsModal(true)}
                  className="p-2.5 rounded-full border-2 border-gray-400/50 text-gray-400 hover:border-blue-400/50 hover:text-blue-400 transition-all duration-300"
                  title="Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
               {/* Mobile Menu Button - You'll need to implement the dropdown logic */}
              <div className="md:hidden">
                <button className="p-2.5 rounded-full border-2 border-gray-400/50 text-gray-400">
                    <Menu className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>


        {/* Notification Modal */}
        {showNotificationModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4"> {/* z-index */}
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-2xl p-6 max-w-md w-full border border-white/20 shadow-xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-bold flex items-center text-yellow-400">
                  <Bell className="w-6 h-6 mr-2" />
                  Smart Notifications
                </h3>
                <button
                  onClick={() => setShowNotificationModal(false)}
                  className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-gray-300 mb-6 text-sm">
                Get personalized reminders, streak alerts, and achievement notifications to stay motivated!
              </p>
              <div className="space-y-5 mb-6">
                <div>
                  <label htmlFor="dailyReminderTime" className="block text-sm font-medium mb-1.5">Daily Reminder Time</label>
                  <input
                    id="dailyReminderTime"
                    type="time"
                    value={dailyReminder}
                    onChange={(e) => setDailyReminder(e.target.value)}
                    className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2.5 text-white focus:ring-yellow-500 focus:border-yellow-500"
                  />
                </div>
                 <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Enable Notifications</span>
                  <button
                    onClick={() => setNotificationsEnabled(!notificationsEnabled)}
                    className={`w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none ${
                      notificationsEnabled ? 'bg-green-500' : 'bg-gray-600'
                    }`}
                  >
                    <span className={`block w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-300 ${
                      notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={requestNotificationPermission}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 px-4 py-2.5 rounded-lg font-medium transition-all duration-300 transform hover:scale-105 text-sm"
                >
                  {notificationsEnabled ? 'Update Settings' : 'Enable Notifications'}
                </button>
                <button
                  onClick={() => setShowNotificationModal(false)}
                  className="px-4 py-2.5 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors text-sm"
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Settings Modal */}
        {showSettingsModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4"> {/* z-index */}
            <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-2xl p-6 max-w-md w-full border border-white/20 shadow-xl">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-xl font-bold flex items-center text-blue-400">
                  <Settings className="w-6 h-6 mr-2" />
                  Settings
                </h3>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="text-gray-400 hover:text-white p-1 rounded-full hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label htmlFor="dailyGoalSelect" className="block text-sm font-medium mb-1.5">Daily Goal (exercises)</label>
                  <select
                    id="dailyGoalSelect"
                    value={dailyGoal}
                    onChange={(e) => setDailyGoal(Number(e.target.value))}
                    className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2.5 text-white focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={5}>5 exercises</option>
                    <option value={10}>10 exercises</option>
                    <option value={15}>15 exercises</option>
                    <option value={20}>20 exercises</option>
                    <option value={25}>25 exercises</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="difficultyPref" className="block text-sm font-medium mb-1.5">Difficulty Preference</label>
                  <select
                    id="difficultyPref"
                    className="w-full bg-black/40 border border-white/20 rounded-lg px-3 py-2.5 text-white focus:ring-blue-500 focus:border-blue-500"
                    defaultValue="adaptive" // This should be a state if you want it to be dynamic
                  >
                    <option value="beginner">Beginner Focus</option>
                    <option value="adaptive">Adaptive (Recommended)</option>
                    <option value="advanced">Advanced Challenge</option>
                  </select>
                </div>

                <div className="pt-4 border-t border-white/10">
                  <button
                    onClick={resetProgress}
                    className="w-full bg-red-600 hover:bg-red-700 px-4 py-2.5 rounded-lg transition-colors flex items-center justify-center space-x-2 text-sm font-medium transform hover:scale-105"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Reset All Progress</span>
                  </button>
                </div>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowSettingsModal(false)} // This should ideally save settings
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-2.5 rounded-lg transition-colors text-sm font-medium"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {/* Achievement Banner - High Score */}
          {pronunciationScore >= 90 && hasRecorded && !isRecording && ( // only when not recording
            <div className="mb-6 bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-red-500/20 border border-yellow-400/30 rounded-2xl p-4 shadow-lg animate-fade-in-down">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Trophy className="w-8 h-8 text-yellow-400 animate-pulse" />
                  <div>
                    <h3 className="font-bold text-yellow-400">Outstanding Performance!</h3>
                    <p className="text-sm text-yellow-200">You scored {pronunciationScore}% - ¡Excelente trabajo!</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-yellow-400">+{Math.floor(pronunciationScore/10) * 10} XP</div>
              </div>
            </div>
          )}

          {/* MODULE COMPLETION BANNER (NEW) */}
          {moduleCompleted && (
            <div className="mb-6 bg-gradient-to-r from-green-500/20 via-teal-500/20 to-blue-500/20 border border-green-400/30 rounded-2xl p-4 shadow-lg animate-fade-in-down">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-8 h-8 text-green-400" />
                  <div>
                    <h3 className="font-bold text-green-400">¡Módulo Completado!</h3>
                    <p className="text-sm text-green-200">
                      Has aprendido todas las palabras en el módulo de {learningModules.find(m => m.id === currentModule)?.name || 'actual'}.
                    </p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-green-400">+100 XP Bonus!</div> {/* Example bonus */}
              </div>
            </div>
          )}


          {/* Learning Modules */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-5 flex items-center text-purple-300">
              <Swords className="w-6 h-6 mr-3" />
              Your Learning Quest
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {learningModules.map((module) => {
                const IconComponent = module.icon;
                const isActive = currentModule === module.id;
                return (
                  <button
                    key={module.id}
                    onClick={() => selectModule(module.id)}
                    className={`relative group p-3 sm:p-4 rounded-2xl border-2 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
                      isActive
                        ? 'border-yellow-400 bg-gradient-to-br from-yellow-400/25 to-orange-500/25 shadow-xl shadow-yellow-400/30'
                        : 'border-white/20 bg-white/10 hover:border-white/40 hover:bg-white/15'
                    }`}
                    title={module.description}
                  >
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-r ${module.color} flex items-center justify-center mx-auto mb-2 sm:mb-3 shadow-lg group-hover:scale-110 transition-transform`}>
                      <IconComponent className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div className="font-semibold text-xs sm:text-sm text-center mb-1.5 sm:mb-2 truncate w-full">{module.name}</div>

                    <div className="w-full bg-black/30 rounded-full h-1.5 sm:h-2 mb-1.5 sm:mb-2">
                      <div
                        className={`h-1.5 sm:h-2 rounded-full bg-gradient-to-r ${module.color} transition-all duration-500`}
                        style={{ width: `${module.progress}%` }} // This progress should be dynamic
                      />
                    </div>

                    <div className="text-xxs sm:text-xs text-gray-300 space-y-0.5">
                      <div className="truncate">{module.progress}% done</div>
                      <div className="flex items-center justify-between">
                        <span>{module.xpEarned} XP</span>
                        <div className="flex items-center space-x-0.5">
                          <Flame className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-orange-400" />
                          <span>{module.streak}</span>
                        </div>
                      </div>
                    </div>

                    {isActive && (
                      <div className="absolute -top-1.5 -right-1.5 w-5 h-5 sm:w-6 sm:h-6 bg-yellow-400 rounded-full flex items-center justify-center border-2 border-black/50">
                        <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-black" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dialect Selector */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-5 flex items-center text-blue-300">
              <Shield className="w-6 h-6 mr-3" />
              Master Spanish Dialects
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {dialects.map((dialect) => {
                const isSelected = selectedDialect === dialect.id;
                const isLocked = dialect.masteryLevel < 20 && !['mexico', 'colombia'].includes(dialect.id); // Example lock condition

                return (
                  <button
                    key={dialect.id}
                    onClick={() => selectDialect(dialect.id)}
                    disabled={isLocked}
                    className={`relative group p-4 sm:p-5 rounded-2xl border-2 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
                      isLocked
                        ? 'border-gray-600/50 bg-gray-800/60 opacity-60 cursor-not-allowed'
                        : isSelected
                          ? 'border-yellow-400 bg-gradient-to-br from-yellow-400/20 via-orange-500/20 to-red-500/20 shadow-xl shadow-yellow-400/30'
                          : 'border-white/20 bg-white/10 hover:border-white/40 hover:bg-white/15'
                    }`}
                    title={dialect.culturalNote}
                  >
                    {isLocked && (
                      <div className="absolute top-2 right-2 p-1 bg-black/50 rounded-full">
                        <Lock className="w-3 h-3 sm:w-4 sm:h-4 text-gray-300" />
                      </div>
                    )}

                    <div className="text-3xl sm:text-4xl mb-2 sm:mb-3 transition-transform group-hover:scale-110">{dialect.flag}</div>
                    <div className="font-bold text-sm sm:text-base mb-1 sm:mb-2 truncate w-full">{dialect.name}</div>
                    <div className="text-xs sm:text-sm text-blue-200 mb-2 sm:mb-3 truncate w-full">{dialect.accent}</div>

                    <div className="mb-2 sm:mb-3">
                      <div className="flex justify-between text-xxs sm:text-xs mb-0.5 sm:mb-1">
                        <span>Mastery</span>
                        <span className="font-bold">{dialect.masteryLevel}%</span>
                      </div>
                      <div className="w-full bg-black/30 rounded-full h-1.5 sm:h-2">
                        <div
                          className={`h-1.5 sm:h-2 rounded-full transition-all duration-500 ${
                            dialect.masteryLevel >= 80 ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                            dialect.masteryLevel >= 50 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                            'bg-gradient-to-r from-red-400 to-pink-500'
                          }`}
                          style={{ width: `${dialect.masteryLevel}%` }}
                        />
                      </div>
                    </div>

                    <div className="text-xxs sm:text-xs text-gray-400 mb-1.5 sm:mb-2">
                      {dialect.unlockedLessons}/{dialect.totalLessons} lessons
                    </div>

                    <div className="flex items-center justify-between text-xxs sm:text-xs">
                      <span className="text-gray-400 truncate">Diff: {dialect.difficulty}</span>
                      <div className="flex items-center space-x-1 text-green-400">
                        <Users className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        <span>{dialect.users}</span>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="absolute -top-2 -right-2 w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg border-2 border-black/50">
                        <Star className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>


          {/* Main Learning Interface */}
          <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
            {/* AI Pronunciation Analysis */}
            <div className="lg:col-span-2 bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/20 shadow-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 sm:mb-6">
                <h3 className="text-lg sm:text-xl font-semibold flex items-center mb-2 sm:mb-0 text-green-300">
                  <Mic className="w-5 h-5 mr-2" />
                  AI Pronunciation Master
                </h3>
                <div className="flex items-center space-x-2 sm:space-x-3">
                  {realTimeScore > 0 && isRecording && (
                    <div className="flex items-center space-x-1.5 text-xs sm:text-sm bg-green-500/20 px-2 py-1 rounded-full animate-pulse">
                      <BarChart3 className="w-3.5 h-3.5" />
                      <span className="font-bold">{Math.floor(realTimeScore)}%</span>
                    </div>
                  )}
                  {pronunciationScore > 0 && !isRecording && (
                    <div className="flex items-center space-x-1.5 text-xs sm:text-sm bg-blue-500/20 px-2 py-1 rounded-full">
                      <Trophy className="w-3.5 h-3.5" />
                      <span>Score: {pronunciationScore}%</span>
                    </div>
                  )}
                  <button
                    onClick={nextWord}
                    className="bg-purple-500/20 hover:bg-purple-500/30 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm transition-colors border border-purple-400/30"
                    title="Next word"
                  >
                    Next
                  </button>
                </div>
              </div>

              <div className="text-center mb-5 sm:mb-6 bg-black/25 rounded-xl p-4 sm:p-6 shadow-inner">
                <div className="text-4xl sm:text-5xl font-bold mb-2 sm:mb-3 text-transparent bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 bg-clip-text min-h-[60px] sm:min-h-[72px]">
                  {currentWordDisplay}
                </div>
                <div className="text-sm sm:text-lg text-blue-200 mb-1.5 sm:mb-2 font-mono">
                  IPA: {currentWordIPA}
                </div>
                <div className="text-xs sm:text-sm text-gray-300 mb-1.5 sm:mb-2">
                  {currentDialectName} • {currentWordDifficulty}
                </div>
                <div className="text-xs sm:text-sm text-green-300 bg-green-500/20 rounded-lg p-1.5 sm:p-2 inline-block">
                  Meaning: {currentWordMeaning}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm mt-3 sm:mt-4">
                  <div className="bg-purple-500/20 rounded-lg p-2 sm:p-3">
                    <div className="font-semibold text-purple-300">Audio Guide</div>
                    <div className="text-purple-100 truncate">{audioGuideText}</div>
                  </div>
                  <div className="bg-blue-500/20 rounded-lg p-2 sm:p-3">
                    <div className="font-semibold text-blue-300">Community Accuracy</div>
                    <div className="text-blue-100">{communityAccuracy}% avg</div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-center items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-5 sm:mb-6">
                <button
                  onClick={toggleRecordingWithModuleTracking} // Use new function
                  disabled={isRecording && recordingTime < 10} // Disable stop briefly
                  className={`flex items-center justify-center space-x-2 sm:space-x-3 px-6 sm:px-8 py-3 sm:py-4 rounded-full font-bold text-base sm:text-lg transition-all duration-300 shadow-lg hover:scale-105 w-full sm:w-auto ${
                    isRecording
                      ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 animate-pulse shadow-red-500/50'
                      : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 shadow-green-500/50'
                  }`}
                >
                  {isRecording ? <MicOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Mic className="w-5 h-5 sm:w-6 sm:h-6" />}
                  <span>{isRecording ? 'Analysing...' : 'Start AI Analysis'}</span>
                  {isRecording && (
                    <div className="text-xs sm:text-sm opacity-80 w-10 text-center">
                      {(recordingTime / 10).toFixed(1)}s
                    </div>
                  )}
                </button>
                <button
                  onClick={togglePlayAudio}
                  className={`flex items-center justify-center space-x-2 px-5 sm:px-6 py-3 sm:py-4 rounded-full font-bold transition-all duration-300 shadow-lg hover:scale-105 w-full sm:w-auto text-sm sm:text-base ${
                    isPlaying
                      ? 'bg-gradient-to-r from-orange-500 to-red-600 shadow-orange-500/50'
                      : 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-blue-500/50'
                  } hover:from-blue-600 hover:to-blue-700`}
                >
                  {isPlaying ? <Pause className="w-4 h-4 sm:w-5 sm:h-5" /> : <Play className="w-4 h-4 sm:w-5 sm:h-5" />}
                  <span>Native Audio</span>
                </button>
              </div>

              {showVisualFeedback && (
                <div className="space-y-5 sm:space-y-6 animate-fade-in">
                  <div className="bg-gradient-to-r from-black/40 to-gray-900/50 rounded-2xl p-4 sm:p-6 border border-gray-700/50 shadow-inner">
                    <h4 className="font-bold mb-3 sm:mb-4 flex items-center text-base sm:text-lg text-purple-300">
                      <Eye className="w-5 h-5 mr-2" />
                      Real-Time AI Analysis
                    </h4>
                    <div className="mb-5 sm:mb-6">
                      <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <div className="text-xs sm:text-sm text-gray-300">Voice Waveform</div>
                        <div className={`text-xxs sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded ${
                          isRecording
                            ? 'text-green-300 bg-green-500/20 animate-pulse'
                            : 'text-blue-300 bg-blue-500/20'
                        }`}>
                          {isRecording ? `Recording... ${(recordingTime / 10).toFixed(1)}s` : (pronunciationScore > 0 ? 'Analysis Complete' : 'Ready')}
                        </div>
                      </div>
                      <div className="flex items-end justify-center space-x-0.5 sm:space-x-1 h-20 sm:h-24 bg-black/50 rounded-lg p-2 sm:p-3 border border-green-500/20 overflow-hidden">
                        {waveformData.map((height, i) => (
                          <div
                            key={i}
                            className={`rounded-sm transition-all duration-150 ${
                              isRecording
                                ? 'bg-gradient-to-t from-green-500 via-green-400 to-green-300'
                                : (pronunciationScore > 0 ? 'bg-gradient-to-t from-blue-500 via-blue-400 to-blue-300' : 'bg-gray-500')
                            }`}
                            style={{ height: `${Math.max(2, Math.abs(height))}px`, width: '3px sm:4px' }} // min height
                          />
                        ))}
                      </div>
                    </div>

                    {pronunciationScore > 0 && !isRecording && (
                      <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-xl p-3 sm:p-4 border border-green-400/30 animate-fade-in-up">
                        <h4 className="font-medium mb-2 sm:mb-3 text-green-300 flex items-center text-sm sm:text-base">
                          <Brain className="w-4 h-4 mr-1.5 sm:mr-2" />
                          AI Analysis Results
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm mb-3 sm:mb-4">
                          {[
                            { label: "Vowel Clarity", score: Math.min(100, pronunciationScore + 5) },
                            { label: "Consonant Precision", score: Math.max(60, pronunciationScore - 8) },
                            { label: "Rhythm & Stress", score: Math.min(100, pronunciationScore + 2) },
                            { label: "Dialect Accuracy", score: pronunciationScore },
                          ].map(item => (
                            <div key={item.label} className="space-y-1">
                              <div className="flex justify-between">
                                <span>{item.label}:</span>
                                <span className={`font-medium ${item.score >= 90 ? 'text-green-400' : item.score >= 75 ? 'text-yellow-400' : 'text-red-400'}`}>
                                  {item.score >= 90 ? 'Excellent' : item.score >= 75 ? 'Good' : 'Needs Work'} ({item.score}%)
                                </span>
                              </div>
                               <div className="w-full bg-black/30 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full ${item.score >= 90 ? 'bg-green-400' : item.score >= 75 ? 'bg-yellow-400' : 'bg-red-400'}`}
                                  style={{ width: `${item.score}%`}}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="bg-blue-600/20 rounded-lg p-2.5 sm:p-3 border border-blue-400/30">
                          <p className="text-xs sm:text-sm">
                            <strong className="text-blue-300">🤖 AI Coach:</strong> {
                              pronunciationScore >= 95 ? `Perfecto! You've mastered "${currentWordDisplay}" in ${currentDialectName}. Try a harder word!` :
                              pronunciationScore >= 85 ? `Great job on "${currentWordDisplay}"! Focus on the stress pattern: ${currentWordDisplay.replace(/[aeiou]/gi, (match, offset) => offset === (currentWordDisplay.toLowerCase().split('').findIndex(char => 'aeiouáéíóú'.includes(char))) ? match.toUpperCase() : match)}` :
                              pronunciationScore >= 70 ? `Good progress with "${currentWordDisplay}"! Pay attention to the ${selectedDialect === 'spain' ? 'θ/s distinction' : 'clear vowel sounds'}.` :
                              `Keep practicing "${currentWordDisplay}"! Focus on one syllable at a time. Try: ${currentWordDisplay.split('').join('-')}`
                            }
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar with Analytics and Progress */}
            <div className="space-y-6 sm:space-y-8">
              {/* Quick Stats - Replace with dynamic data */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/20 shadow-xl">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center text-purple-300">
                  <TrendingUp className="w-5 h-5 mr-2" />
                  Your Progress
                </h3>
                <div className="space-y-3 text-xs sm:text-sm">
                  {[
                    {label: "This Week", value: "127 min", color: "text-green-400"}, // Example data
                    {label: "Avg Score", value: "89%", color: "text-blue-400"},
                    {label: "Perfect Scores", value: "8", color: "text-yellow-400"},
                    {label: "Sessions", value: "45", color: "text-purple-400"},
                    {label: "Improvement", value: "+23%", color: "text-green-400"},
                  ].map(stat => (
                     <div key={stat.label} className="flex items-center justify-between">
                        <span className="text-gray-300">{stat.label}</span>
                        <span className={`font-bold ${stat.color}`}>{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Achievements */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/20 shadow-xl">
                <h3 className="text-base sm:text-lg font-semibold mb-3 sm:mb-4 flex items-center text-yellow-300">
                  <Trophy className="w-5 h-5 mr-2" />
                  Achievements
                </h3>
                <div className="space-y-2.5 sm:space-y-3 max-h-60 sm:max-h-64 overflow-y-auto pr-1"> {/* Added pr for scrollbar */}
                  {achievements.map((achievement) => (
                    <div
                      key={achievement.id}
                      className={`flex items-center space-x-2.5 sm:space-x-3 p-2 sm:p-2.5 rounded-lg transition-all duration-300 cursor-pointer hover:shadow-md ${
                        achievement.unlocked
                          ? 'bg-gradient-to-r from-yellow-500/25 to-orange-500/25 border border-yellow-400/40 hover:from-yellow-500/30 hover:to-orange-500/30'
                          : 'bg-gray-600/30 border border-gray-500/40 hover:bg-gray-600/40'
                      }`}
                      title={achievement.desc}
                      onClick={() => { if(achievement.unlocked) { setNewAchievement(achievement); setShowAchievementModal(true);}}} // Show modal on click if unlocked
                    >
                      <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-lg sm:text-xl shadow-md ${
                        achievement.unlocked ? 'bg-yellow-400 text-black' : 'bg-gray-700 text-gray-400'
                      }`}>
                        {achievement.unlocked ? achievement.icon : '🔒'}
                      </div>
                      <div className="flex-1 min-w-0"> {/* Ensure text truncates */}
                        <div className={`font-medium text-xs sm:text-sm truncate ${achievement.unlocked ? 'text-yellow-300' : 'text-gray-400'}`}>
                          {achievement.name}
                        </div>
                        <div className="text-xxs sm:text-xs text-gray-400 truncate">{achievement.desc}</div>
                        {achievement.unlocked && <div className="text-xxs sm:text-xs text-green-400">+{achievement.xp} XP</div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Daily Challenge / Completion Celebration */}
            <div className="mt-6 sm:mt-8">
            {dailyProgress >= dailyGoal ? (
                 <div className="bg-gradient-to-r from-green-500/20 via-emerald-500/20 to-teal-500/20 rounded-2xl p-5 sm:p-6 border border-green-400/30 shadow-xl text-center animate-fade-in">
                    <div className="text-5xl sm:text-6xl mb-3 sm:mb-4 animate-bounce">🎉</div>
                    <h3 className="text-xl sm:text-2xl font-bold text-green-300 mb-1.5 sm:mb-2">Daily Goal Complete!</h3>
                    <p className="text-sm sm:text-base text-green-100 mb-3 sm:mb-4">
                    Amazing work! You've completed all {dailyGoal} exercises today and kept your {gamification.streakDays}-day streak!
                    </p>
                    <div className="flex items-center justify-center space-x-4 sm:space-x-6 text-sm sm:text-lg">
                    <div className="flex items-center space-x-1.5 sm:space-x-2 text-yellow-300">
                        <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />
                        <span>+75 XP Bonus</span>
                    </div>
                    <div className="flex items-center space-x-1.5 sm:space-x-2 text-green-300">
                        <Flame className="w-5 h-5 sm:w-6 sm:h-6" />
                        <span>{gamification.streakDays} Day Streak!</span>
                    </div>
                    </div>
                </div>
            ) : (
                 <div className="bg-gradient-to-r from-orange-500/20 via-red-500/20 to-pink-500/20 rounded-2xl p-5 sm:p-6 border border-orange-400/30 shadow-xl">
                    <div className="flex flex-col sm:flex-row items-center justify-between mb-3 sm:mb-4">
                        <h3 className="text-lg sm:text-xl font-bold flex items-center text-orange-300 mb-2 sm:mb-0">
                        <Flame className="w-6 h-6 mr-2 animate-pulse" />
                        Daily Challenge: Keep Your Streak!
                        </h3>
                        <div className="text-xl sm:text-2xl font-bold text-orange-300">
                        {dailyGoal - dailyProgress} more to go!
                        </div>
                    </div>
                    <p className="text-sm sm:text-base text-orange-100 mb-3 sm:mb-4">
                        You're {dailyProgress}/{dailyGoal} exercises from today's goal.
                        Complete {dailyGoal - dailyProgress} more to maintain your {gamification.streakDays}-day streak!
                    </p>
                    <div className="w-full bg-black/30 rounded-full h-3 sm:h-4 mb-3 sm:mb-4 shadow-inner">
                        <div
                        className="h-3 sm:h-4 bg-gradient-to-r from-orange-400 to-red-500 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                        style={{ width: `${Math.min(100, (dailyProgress / dailyGoal) * 100)}%` }}
                        >
                        { (dailyProgress / dailyGoal) * 100 > 10 && <Flame className="w-2 h-2 sm:w-3 sm:h-3 text-white" /> }
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-4 text-xs sm:text-sm">
                        <div className="flex items-center space-x-1.5 text-green-400">
                        <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span>Complete goal: +50 XP bonus</span>
                        </div>
                        <div className="flex items-center space-x-1.5 text-yellow-400">
                        <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span>Maintain streak: +25 XP bonus</span>
                        </div>
                    </div>
                </div>
            )}
            </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default SpanishLearningApp;
