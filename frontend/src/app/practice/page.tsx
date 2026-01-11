"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, X, Play, RotateCcw } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

type Mode = "record" | "type";
type RecordingState = "idle" | "recording" | "stopped";
type MicPermission = "granted" | "denied" | "unknown";
type Question = {
  id: string;
  category: string;
  question: string;
  sampleAnswers?: any;
};

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes < 10 ? "0" : ""}${minutes}:${
    remainingSeconds < 10 ? "0" : ""
  }${remainingSeconds}`;
}

export default function Practice() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isDarkMode } = useTheme();
  const existingSessionId = searchParams.get("sessionId");
  const isMounted = useRef(true);

  // --- STATE ---
  const [prefs, setPrefs] = useState({
    enableTimer: true,
    countdownSeconds: 0,
    autoSubmitOnSilence: false, // 1. Default state (matches your DB default)
  });

  const [countdown, setCountdown] = useState<number | null>(null);

  const [interviewType, setInterviewType] = useState("Software Engineering");
  const [difficulty, setDifficulty] = useState("Basic");
  const [sessionId, setSessionId] = useState<string | null>(null);

  const isSessionActive = !!sessionId;

  const [qId, setQId] = useState("");
  const [question, setQuestion] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);

  const [loadingQuestion, setLoadingQuestion] = useState(false);

  const [mode, setMode] = useState<Mode>("record");
  const [typedAnswer, setTypedAnswer] = useState("");

  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [micPermission, setMicPermission] = useState<MicPermission>("unknown");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorTitle, setErrorTitle] = useState("Error");
  const [errorMessage, setErrorMessage] = useState("");

  const isCreatingSession = useRef(false);

  // --- SILENCE REFS ---
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const silenceStartRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isAutoSubmittingRef = useRef(false);

  const timeLabel = useMemo(() => formatTime(elapsedTime), [elapsedTime]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // --- 2. FETCH PREFERENCES FROM DB ---
  useEffect(() => {
    const fetchPrefs = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;
      try {
        const res = await fetch(
          "http://localhost:5000/api/profile/preferences",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (res.ok) {
          const data = await res.json();
          const p = data.preferences;
          if (p) {
            setPrefs({
              enableTimer: p.enableTimer ?? true,
              countdownSeconds: p.countdownSeconds ?? 0,
              // Update state with value from DB
              autoSubmitOnSilence: p.autoSubmitOnSilence ?? false,
            });

            if (!existingSessionId) {
              if (p.defaultRole) setInterviewType(p.defaultRole);
              if (p.defaultDifficulty) setDifficulty(p.defaultDifficulty);
            }
          }
        }
      } catch (e) {
        console.error("Failed to load prefs", e);
      }
    };
    fetchPrefs();
  }, [existingSessionId]);

  // --- HELPER FUNCTIONS ---
  const fetchSessionDetails = async (id: string) => {
    setLoadingQuestion(true);
    try {
      const res = await fetch(
        `http://localhost:5000/api/practice/session/${id}`
      );
      if (res.ok) {
        const sessionData = await res.json();

        if (sessionData.interviewType)
          setInterviewType(sessionData.interviewType);
        if (sessionData.difficulty) setDifficulty(sessionData.difficulty);

        if (sessionData.currentQuestion) {
          setCurrentQuestion(sessionData.currentQuestion);
          setQId(sessionData.currentQuestion.id);
          setQuestion(sessionData.currentQuestion.question);
        } else {
          setCurrentQuestion(null);
          setQuestion("");
        }

        if (sessionData.status === "COMPLETED") {
          router.push("/analytics");
        }
      }
    } catch (error) {
      console.error("Error fetching session:", error);
    } finally {
      setLoadingQuestion(false);
    }
  };

  const startNewSession = async () => {
    if (isCreatingSession.current) return;
    isCreatingSession.current = true;

    setLoadingQuestion(true);
    setQuestion("");
    setCurrentQuestion(null);
    setQId("");

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const res = await fetch("http://localhost:5000/api/session/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ interviewType, difficulty }),
      });

      if (res.ok) {
        const data = await res.json();
        setSessionId(data.sessionId);
        router.replace(`/practice?sessionId=${data.sessionId}`, {
          scroll: false,
        });
        await fetchSessionDetails(data.sessionId);
      }
    } catch (err) {
      console.error("Failed to start session:", err);
      setLoadingQuestion(false);
    } finally {
      isCreatingSession.current = false;
    }
  };

  const handleStartOver = () => {
    router.replace("/practice");
    setSessionId(null);
    setCurrentQuestion(null);
    setQuestion("");
    setLoadingQuestion(false);
  };

  const handleTypeChange = (newType: string) => {
    setInterviewType(newType);
  };

  const handleDifficultyChange = (newDiff: string) => {
    setDifficulty(newDiff);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    if (existingSessionId) {
      setSessionId(existingSessionId);
      fetchSessionDetails(existingSessionId);
    } else {
      setSessionId(null);
      setLoadingQuestion(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingSessionId]);

  function clearTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  function startTimer() {
    clearTimer();
    timerRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
  }

  function showError(title: string, message: string) {
    setErrorTitle(title);
    setErrorMessage(message);
    setShowErrorModal(true);
  }

  useEffect(() => {
    setTypedAnswer("");
    handleRerecord();
    setSubmitError(null);
  }, [qId]);

  // --- SILENCE LOGIC START ---

  // 3. Setup Logic: Check Preference Here
  const setupSilenceDetection = (stream: MediaStream) => {
    // If user's preference is FALSE, we simply exit.
    // The Web Audio API never initializes, saving resources.
    if (!prefs.autoSubmitOnSilence) return;

    const AudioContext =
      window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();

    analyser.fftSize = 256;
    source.connect(analyser);

    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
    silenceStartRef.current = null;

    detectSilenceLoop();
  };

  const detectSilenceLoop = () => {
    if (!analyserRef.current || recordingState === "stopped") return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    const sum = dataArray.reduce((a, b) => a + b, 0);
    const average = sum / dataArray.length;

    const SILENCE_THRESHOLD = 10;
    const SILENCE_DURATION_MS = 3000; // 3 seconds

    if (average < SILENCE_THRESHOLD) {
      if (silenceStartRef.current === null) {
        silenceStartRef.current = Date.now();
      } else {
        const diff = Date.now() - silenceStartRef.current;
        if (diff > SILENCE_DURATION_MS) {
          console.log("Silence detected. Auto-submitting...");
          isAutoSubmittingRef.current = true;
          stopRecording(); // Stops media recorder -> triggers useEffect -> submits
          return;
        }
      }
    } else {
      silenceStartRef.current = null;
    }

    animationFrameRef.current = requestAnimationFrame(detectSilenceLoop);
  };

  const cleanupAudioAnalysis = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  };

  // Watch for Blob to Trigger Submit
  useEffect(() => {
    if (audioBlob && isAutoSubmittingRef.current && !submitting) {
      submitForAnalysis();
      isAutoSubmittingRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioBlob]);
  // --- SILENCE LOGIC END ---

  async function submitForAnalysis() {
    setSubmitError(null);
    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        showError("Authentication Error", "Please log in.");
        setSubmitting(false);
        return;
      }

      if (!sessionId) {
        showError("Session Error", "Session not initialized.");
        setSubmitting(false);
        return;
      }

      const form = new FormData();
      form.append("sessionId", sessionId);
      form.append("questionId", qId);
      form.append("question", question);
      form.append("mode", mode);

      // --- LOGIC CHANGE START ---
      let finalDuration = elapsedTime;

      if (mode === "type") {
        if (!typedAnswer.trim()) {
          showError("Empty Answer", "Please type your answer.");
          setSubmitting(false);
          return;
        }
        form.append("answerText", typedAnswer);

        // 1. Count Words
        const wordCount = typedAnswer.trim().split(/\s+/).length;

        // 2. Average Speaking Rate = 130 Words Per Minute (WPM)
        // Formula: (Words / 130) * 60 seconds
        const estimatedSeconds = Math.ceil((wordCount / 130) * 60);

        // 3. Use the estimated time instead of the timer
        finalDuration = estimatedSeconds;
      } else {
        // ... (Recording logic remains the same)
        if (recordingState === "recording") {
          // Optional: Stop recording automatically if they forgot
          if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
        }

        if (!audioBlob && !isAutoSubmittingRef.current) {
          showError("No Recording", "Please record your answer.");
          setSubmitting(false);
          return;
        }
        if (audioBlob) {
          form.append("audio", audioBlob, "answer.webm");
        }
      }

      // 4. Append the calculated duration
      form.append("duration", String(finalDuration));
      // --- LOGIC CHANGE END ---

      const res = await fetch("http://localhost:5000/api/feedback/submit", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      const data = await res.json();

      if (!res.ok) {
        showError("Submission Failed", data.error || "Unable to submit.");
        setSubmitting(false);
        return;
      }

      if (data.sessionComplete) {
        router.push(`/session-review/${data.sessionId}`);
      } else {
        router.push(`/feedback/${data.attemptId}`);
      }
    } catch (err: any) {
      console.error("Submission error:", err);
      showError("Connection Error", "Unable to submit.");
    } finally {
      setSubmitting(false);
    }
  }

  async function startRecording() {
    setSubmitError(null);
    if (recordingState === "recording") return;

    if (prefs.countdownSeconds > 0 && countdown === null) {
      setCountdown(prefs.countdownSeconds);
      return;
    }

    await triggerRecording();
  }

  async function triggerRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicPermission("granted");
      streamRef.current = stream;

      // 4. Hook up the detection logic to the stream
      setupSilenceDetection(stream);

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      setAudioBlob(null);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);

      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setRecordingState("stopped");
        clearTimer();
        stopMicStream();
        cleanupAudioAnalysis(); // Clean up on stop
      };
      mediaRecorder.start();
      setRecordingState("recording");
      setElapsedTime(0);
      startTimer();
    } catch (err) {
      setMicPermission("denied");
      setSubmitError("Microphone permission denied.");
      showError("Microphone Access Denied", "Allow mic access in settings.");
      stopMicStream();
    }
  }

  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c! - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCountdown(null);
      triggerRecording();
    }
  }, [countdown]);

  function stopMicStream() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }

  function stopRecording() {
    setSubmitError(null);
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    clearTimer();
    cleanupAudioAnalysis(); // Ensure analysis stops
  }

  function handleRerecord() {
    setSubmitError(null);
    isAutoSubmittingRef.current = false; // Reset auto flag on manual reset
    if (recordingState === "recording") stopRecording();
    clearTimer();
    stopMicStream();
    cleanupAudioAnalysis();
    setElapsedTime(0);
    setRecordingState("idle");
    audioChunksRef.current = [];
    setAudioBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
  }

  function switchMode(nextMode: Mode) {
    if (nextMode === mode) return;
    if (recordingState === "recording") stopRecording();
    if (nextMode === "type") handleRerecord();
    else setTypedAnswer("");
    setMode(nextMode);
    setSubmitError(null);
  }

  useEffect(() => {
    return () => {
      clearTimer();
      stopMicStream();
      cleanupAudioAnalysis();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  return (
    <div className={`min-h-screen ${isDarkMode ? "bg-gray-900" : "bg-white"}`}>
      <Navbar />

      {countdown !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all">
          <div className="text-9xl font-bold text-white animate-pulse">
            {countdown}
          </div>
        </div>
      )}

      <div className="max-w-4xl mt-12 mx-auto px-4 pt-8">
        {/* --- SETTINGS CARD --- */}
        <div
          className={`border rounded-xl shadow-sm p-6 mb-8 transition-all ${
            isDarkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2
                className={`text-base font-semibold ${
                  isDarkMode ? "text-white" : "text-gray-900"
                }`}
              >
                Interview Settings
              </h2>
              <p
                className={`text-sm mt-1 ${
                  isDarkMode ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {isSessionActive
                  ? "Session in progress. Settings are locked."
                  : "Select your role and difficulty to begin."}
              </p>
            </div>

            {isSessionActive && (
              <button
                onClick={handleStartOver}
                className="text-xs flex items-center gap-1 text-red-500 hover:text-red-600 font-medium px-3 py-1.5 border border-red-200 rounded-lg hover:bg-red-50 transition"
              >
                <RotateCcw size={14} />
                Start Over
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Role
              </label>
              {isSessionActive ? (
                <div
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm font-medium ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-gray-300"
                      : "bg-gray-50 border-gray-200 text-gray-600"
                  }`}
                >
                  {interviewType}
                </div>
              ) : (
                <select
                  value={interviewType}
                  onChange={(e) => handleTypeChange(e.target.value)}
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-black"
                  }`}
                >
                  <option value="Software Engineering">
                    Software Engineering
                  </option>
                  <option value="Product Management">Product Management</option>
                  <option value="Data Science">Data Science</option>
                </select>
              )}
            </div>

            <div>
              <label
                className={`block text-sm font-medium mb-2 ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Difficulty
              </label>
              {isSessionActive ? (
                <div
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm font-medium ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-gray-300"
                      : "bg-gray-50 border-gray-200 text-gray-600"
                  }`}
                >
                  {difficulty}
                </div>
              ) : (
                <select
                  value={difficulty}
                  onChange={(e) => handleDifficultyChange(e.target.value)}
                  className={`w-full rounded-lg border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                    isDarkMode
                      ? "bg-gray-700 border-gray-600 text-white"
                      : "bg-white border-gray-300 text-black"
                  }`}
                >
                  <option value="Basic">Basic</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              )}
            </div>

            {!isSessionActive && (
              <div className="md:col-span-2 mt-2">
                <button
                  onClick={startNewSession}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-bold transition shadow-md hover:shadow-lg"
                >
                  <Play size={18} fill="currentColor" />
                  Start Interview Session
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div
          className={`border rounded-xl shadow-sm p-6 ${
            isDarkMode
              ? "bg-gray-800 border-gray-700"
              : "bg-white border-gray-200"
          }`}
        >
          {isSessionActive && (
            <>
              {loadingQuestion ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
                  <p className={isDarkMode ? "text-gray-400" : "text-gray-500"}>
                    Loading your question...
                  </p>
                </div>
              ) : !currentQuestion ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <p className="text-red-500 font-medium text-lg">
                    No questions found
                  </p>
                  <p
                    className={`mt-2 ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    There are no {difficulty} questions for {interviewType} yet.
                  </p>
                </div>
              ) : (
                <>
                  <div
                    className={`mt-4 rounded-lg border p-4 ${
                      isDarkMode ? "border-gray-700" : "border-gray-200"
                    }`}
                  >
                    <div className="flex justify-center gap-2 mb-2">
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded uppercase tracking-wide">
                        {currentQuestion.category}
                      </span>
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded uppercase tracking-wide ${
                          isDarkMode
                            ? "text-gray-400 bg-gray-700"
                            : "text-gray-500 bg-gray-100"
                        }`}
                      >
                        {difficulty}
                      </span>
                    </div>
                    <p
                      className={`mt-2 text-2xl text-center font-medium ${
                        isDarkMode ? "text-white" : "text-gray-900"
                      }`}
                    >
                      {question}
                    </p>
                  </div>

                  <div className="mt-6 flex justify-center">
                    <div
                      className={`grid grid-cols-2 rounded-lg p-1 w-full max-w-2xl ${
                        isDarkMode ? "bg-gray-700" : "bg-gray-100"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => switchMode("record")}
                        className={[
                          "py-2 rounded-md text-sm font-semibold transition",
                          mode === "record"
                            ? "bg-blue-600 text-white shadow"
                            : isDarkMode
                            ? "text-gray-300 hover:bg-gray-600"
                            : "text-gray-700 hover:bg-gray-200",
                        ].join(" ")}
                      >
                        Record Answer
                      </button>

                      <button
                        type="button"
                        onClick={() => switchMode("type")}
                        className={[
                          "py-2 rounded-md text-sm font-semibold transition",
                          mode === "type"
                            ? "bg-blue-600 text-white shadow"
                            : isDarkMode
                            ? "text-gray-300 hover:bg-gray-600"
                            : "text-gray-700 hover:bg-gray-200",
                        ].join(" ")}
                      >
                        Type Answer
                      </button>
                    </div>
                  </div>

                  {mode === "record" ? (
                    <>
                      <div className="mt-6 text-center">
                        {prefs.enableTimer ? (
                          <div
                            className={`text-4xl font-bold ${
                              isDarkMode ? "text-white" : "text-gray-900"
                            }`}
                          >
                            {timeLabel}
                          </div>
                        ) : (
                          <div
                            className={`text-xl font-medium mb-2 ${
                              isDarkMode ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            {recordingState === "recording"
                              ? "Recording in progress..."
                              : "Ready"}
                          </div>
                        )}

                        <div
                          className={`mt-2 text-sm flex items-center justify-center gap-2 ${
                            isDarkMode ? "text-gray-400" : "text-gray-600"
                          }`}
                        >
                          {recordingState === "idle" && "Ready to record"}
                          {recordingState === "recording" && "Recording..."}
                          {recordingState === "stopped" && "Recording saved"}
                          {micPermission === "denied" && (
                            <span className="text-red-600">(Mic blocked)</span>
                          )}
                        </div>
                      </div>

                      <div className="mt-6 flex items-center justify-center gap-3">
                        {recordingState === "idle" && (
                          <button
                            onClick={startRecording}
                            className="px-10 py-2 rounded-lg border border-blue-300 text-blue-700 hover:bg-blue-50 font-medium"
                          >
                            Start Recording
                          </button>
                        )}

                        {recordingState === "recording" && (
                          <button
                            onClick={stopRecording}
                            className="px-10 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium"
                          >
                            Stop Recording
                          </button>
                        )}

                        <button
                          onClick={handleRerecord}
                          className="px-10 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 font-medium"
                        >
                          {recordingState === "stopped" ? "Re-record" : "Reset"}
                        </button>
                      </div>

                      {audioUrl && (
                        <div className="mt-6">
                          <p
                            className={`text-sm mb-2 ${
                              isDarkMode ? "text-gray-400" : "text-gray-500"
                            }`}
                          >
                            Playback:
                          </p>
                          <audio controls src={audioUrl} className="w-full" />
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="mt-6">
                        <textarea
                          value={typedAnswer}
                          onChange={(e) => setTypedAnswer(e.target.value)}
                          placeholder="Type your answer here..."
                          className={`w-full min-h-45 rounded-xl border p-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            isDarkMode
                              ? "bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
                              : "bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
                          }`}
                        />
                        <div
                          className={`mt-2 text-xs flex justify-between ${
                            isDarkMode ? "text-gray-500" : "text-gray-500"
                          }`}
                        >
                          <span>
                            Tip: Try STAR (Situation, Task, Action, Result)
                          </span>
                          <span>
                            {
                              typedAnswer.trim().split(/\s+/).filter(Boolean)
                                .length
                            }{" "}
                            words
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  {submitError && (
                    <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                      {submitError}
                    </div>
                  )}

                  <div className="flex items-center justify-center mt-8">
                    <button
                      onClick={submitForAnalysis}
                      disabled={submitting}
                      className={`bg-blue-500 hover:bg-blue-700 text-white text-2xl font-bold py-2 px-4 rounded ${
                        submitting ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      {submitting ? "Analyzing..." : "Submit for Analysis"}
                    </button>
                  </div>
                </>
              )}
            </>
          )}

          {!isSessionActive && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p
                className={`text-lg font-medium ${
                  isDarkMode ? "text-gray-300" : "text-gray-600"
                }`}
              >
                Choose your settings above and click "Start Interview Session"
                to begin.
              </p>
            </div>
          )}
        </div>
      </div>

      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div
            className={`rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 relative animate-fadeIn ${
              isDarkMode ? "bg-gray-800" : "bg-white"
            }`}
          >
            <button
              onClick={() => setShowErrorModal(false)}
              className={`absolute top-4 right-4 transition-colors ${
                isDarkMode
                  ? "text-gray-500 hover:text-gray-300"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              <X size={20} />
            </button>

            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center border-4 border-red-500">
                  <X className="w-10 h-10 text-red-500" strokeWidth={3} />
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-center text-red-600 mb-3">
              {errorTitle}
            </h2>

            <p
              className={`text-center mb-6 ${
                isDarkMode ? "text-gray-300" : "text-gray-600"
              }`}
            >
              {errorMessage}
            </p>

            <button
              onClick={() => setShowErrorModal(false)}
              className="w-full bg-red-500 text-white py-3 rounded-lg font-semibold hover:bg-red-600 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
