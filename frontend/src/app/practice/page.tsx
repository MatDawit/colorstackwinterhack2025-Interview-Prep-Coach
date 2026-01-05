"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

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
  const existingSessionId = searchParams.get("sessionId");
  const isMounted = useRef(true);

  // --- 1. STATE MUST BE AT THE TOP ---
  const [interviewType, setInterviewType] = useState("General");
  const [difficulty, setDifficulty] = useState("Basic");
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [qId, setQId] = useState("");
  const [question, setQuestion] = useState("");
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [loadingQuestion, setLoadingQuestion] = useState(true);

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

  const isCreatingSession = useRef(false);

  const timeLabel = useMemo(() => formatTime(elapsedTime), [elapsedTime]);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // --- 2. HELPER FUNCTIONS ---

  const fetchSessionDetails = async (id: string) => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/practice/session/${id}`
      );
      if (res.ok) {
        const sessionData = await res.json();

        // Sync Dropdowns to match the DB Session
        if (sessionData.interviewType)
          setInterviewType(sessionData.interviewType);
        if (sessionData.difficulty) setDifficulty(sessionData.difficulty);

        if (sessionData.currentQuestion) {
          setCurrentQuestion(sessionData.currentQuestion);
          setQId(sessionData.currentQuestion.id);
          setQuestion(sessionData.currentQuestion.question);
        } else {
          // Handle empty DB case safely
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

  const startNewSession = async (type: string, diff: string) => {
    if (isCreatingSession.current) return;
    isCreatingSession.current = true;

    // Reset UI immediately to avoid "stale" data
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
        body: JSON.stringify({ interviewType: type, difficulty: diff }),
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
    } finally {
      isCreatingSession.current = false;
      setLoadingQuestion(false);
    }
  };

  // --- 3. HANDLERS ---

  const handleTypeChange = (newType: string) => {
    setInterviewType(newType);
    startNewSession(newType, difficulty);
  };

  const handleDifficultyChange = (newDiff: string) => {
    setDifficulty(newDiff);
    startNewSession(interviewType, newDiff);
  };

  // --- 4. INITIAL EFFECT ---
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    if (existingSessionId) {
      setSessionId(existingSessionId);
      setLoadingQuestion(true);
      fetchSessionDetails(existingSessionId);
    } else {
      startNewSession(interviewType, difficulty);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingSessionId]);

  // --- AUDIO & TIMER HELPERS ---
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

  async function submitForAnalysis() {
    setSubmitError(null);
    setSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Please log in to submit.");
      if (!sessionId)
        throw new Error("Session not initialized. Please refresh.");

      const form = new FormData();
      form.append("sessionId", sessionId);
      form.append("questionId", qId);
      form.append("question", question);
      form.append("mode", mode);
      form.append("duration", String(elapsedTime));

      if (mode === "type") {
        if (!typedAnswer.trim()) throw new Error("Answer cannot be empty.");
        form.append("answerText", typedAnswer);
      } else {
        if (recordingState === "recording")
          throw new Error("Stop the recording before submitting.");
        if (!audioBlob) throw new Error("No audio recorded.");
        form.append("audio", audioBlob, "answer.webm");
      }

      const res = await fetch("http://localhost:5000/api/feedback/submit", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed.");

      router.push(`/feedback/${data.attemptId}`);
    } catch (err: any) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function startRecording() {
    setSubmitError(null);
    if (recordingState === "recording") return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicPermission("granted");
      streamRef.current = stream;
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
      };
      mediaRecorder.start();
      setRecordingState("recording");
      setElapsedTime(0);
      startTimer();
    } catch (err) {
      setMicPermission("denied");
      setSubmitError("Microphone permission denied.");
      stopMicStream();
    }
  }

  function stopMicStream() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }
  function stopRecording() {
    setSubmitError(null);
    if (recordingState !== "recording") return;
    const recorder = mediaRecorderRef.current;
    if (recorder) recorder.stop();
    mediaRecorderRef.current = null;
    clearTimer();
  }
  function handleRerecord() {
    setSubmitError(null);
    if (recordingState === "recording") stopRecording();
    clearTimer();
    stopMicStream();
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
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-4xl mt-12 mx-auto px-4 pt-8">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <h2 className="text-base font-semibold text-gray-900">
            Interview Settings
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Select your role and preferences.
          </p>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <select
                value={interviewType}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="w-full text-black rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="General">General</option>
                <option value="Software Engineering">
                  Software Engineering
                </option>
                <option value="Product Management">Product Management</option>
                <option value="Data Science">Data Science</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => handleDifficultyChange(e.target.value)}
                className="w-full text-black rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Basic">Basic</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          {loadingQuestion ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
              <p className="text-gray-500">Loading your question...</p>
            </div>
          ) : !currentQuestion ? (
            // FIX: This prevents the infinite loading spinner
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-red-500 font-medium text-lg">
                No questions found
              </p>
              <p className="text-gray-500 mt-2">
                There are no {difficulty} questions for {interviewType} yet.
              </p>
            </div>
          ) : (
            <>
              {/* Question display */}
              <div className="mt-4 rounded-lg border border-gray-200 p-4">
                <div className="flex justify-center gap-2 mb-2">
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded uppercase tracking-wide">
                    {currentQuestion.category}
                  </span>
                  <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded uppercase tracking-wide">
                    {difficulty}
                  </span>
                </div>
                <p className="mt-2 text-2xl text-center font-medium text-gray-900">
                  {question}
                </p>
              </div>

              {/* Toggle */}
              <div className="mt-6 flex justify-center">
                <div className="grid grid-cols-2 bg-gray-100 rounded-lg p-1 w-full max-w-2xl">
                  <button
                    type="button"
                    onClick={() => switchMode("record")}
                    className={[
                      "py-2 rounded-md text-sm font-semibold transition",
                      mode === "record"
                        ? "bg-blue-600 text-white shadow"
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
                    <div className="text-4xl font-bold text-gray-900">
                      {timeLabel}
                    </div>
                    <div className="mt-2 text-sm text-gray-600 flex items-center justify-center gap-2">
                      {recordingState === "idle" && "Ready to record"}
                      {recordingState === "recording" && "Recording..."}
                      {recordingState === "stopped" && "Recording saved"}
                      {micPermission === "denied" && (
                        <span className="text-red-600">(Mic blocked)</span>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-center gap-3">
                    {recordingState !== "recording" ? (
                      <button
                        onClick={startRecording}
                        className="px-10 py-2 rounded-lg border border-blue-300 text-blue-700 hover:bg-blue-50 font-medium"
                      >
                        Start Recording
                      </button>
                    ) : (
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
                      Re-record
                    </button>
                  </div>

                  {audioUrl && (
                    <div className="mt-6">
                      <p className="text-sm text-gray-500 mb-2">Playback:</p>
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
                      className="w-full min-h-45 rounded-xl border border-gray-300 p-4 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="mt-2 text-xs text-gray-500 flex justify-between">
                      <span>
                        Tip: Try STAR (Situation, Task, Action, Result)
                      </span>
                      <span>
                        {typedAnswer.trim().split(/\s+/).filter(Boolean).length}{" "}
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
        </div>
      </div>
    </div>
  );
}
