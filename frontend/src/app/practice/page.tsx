//"use client" runs this component in the browser. This is important because it allows the component to use browser-specific APIs and features,
// like recording audio
"use client";
//useState stores values that change over time, useRef saves values between renders, useEffect runs code after rendering, useMemo caches expensive computations
import React, { useEffect, useMemo, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react"; // Added for loading state

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

  const [interviewType, setInterviewType] = useState(
    "Software Engineering Interview"
  );
  const [sessionId, setSessionId] = useState<string | null>(null);

  //Right now, the question ID and question are hardcoded. In the future, we will fetch these from the database
  const [qId, setQId] = useState("");
  const [question, setQuestion] = useState("");

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [loadingQuestion, setLoadingQuestion] = useState(true); // Added loading state

  //sets mode and your answer
  const [mode, setMode] = useState<Mode>("record");
  const [typedAnswer, setTypedAnswer] = useState("");

  //Recording state
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [micPermission, setMicPermission] = useState<MicPermission>("unknown");
  //useRef is used for objects that are not re-rendered when the component updates
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  //audioBlob and audioUrl are used to store the recorded audio
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  //This is for the timer
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  //this is to submit the answer
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  //this is for the timer again
  const timeLabel = useMemo(() => formatTime(elapsedTime), [elapsedTime]);

  const interviewTypeToCategories: Record<string, string[]> = {
    "Software Engineering Interview": [
      "Teamwork",
      "Problem-Solving",
      "Failure",
      "Initiative",
    ],
    "Product Management Interview": [
      "Communication",
      "Leadership",
      "Teamwork",
      "Initiative",
    ],
    "Data Science Interview": [
      "Problem-Solving",
      "Communication",
      "Failure",
      "Teamwork",
    ],
  };

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

  function pickRandomN<T>(arr: T[], n: number) {
    const copy = [...arr];
    // Fisher–Yates shuffle
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy.slice(0, Math.min(n, copy.length));
  }

  function pickRandomOne<T>(arr: T[]) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // Load questions once on mount
  useEffect(() => {
    async function loadQuestions() {
      try {
        const res = await fetch("http://localhost:5000/api/questions");
        const data = await res.json(); // { questions: [...] }
        setQuestions(data.questions ?? []);
      } catch (err) {
        console.error("Failed to load questions:", err);
      }
    }

    loadQuestions();
  }, []);

  // This effect handles Session Syncing.
  // Instead of picking a random question every time, it asks the backend: "What is the active question?"
  useEffect(() => {
    if (questions.length === 0) return;

    const syncSession = async () => {
      setLoadingQuestion(true);
      const token = localStorage.getItem("token");

      try {
        let activeSessionId = existingSessionId;

        // A. If NO Session ID, create one (The backend will pick the question)
        if (!activeSessionId && token) {
          const startRes = await fetch(
            "http://localhost:5000/api/session/start",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ interviewType }),
            }
          );

          if (startRes.ok) {
            const data = await startRes.json();
            activeSessionId = data.sessionId;
            setSessionId(activeSessionId);
            // Update URL silently without reloading
            router.replace(`/practice?sessionId=${activeSessionId}`);
          }
        }

        // B. Fetch the Session Status to get the Bookmarked Question
        //    (This works for New Sessions AND Retries)
        if (activeSessionId) {
          setSessionId(activeSessionId);

          const res = await fetch(
            `http://localhost:5000/api/practice/session/${activeSessionId}`
          );
          if (res.ok) {
            const sessionData = await res.json();

            // The Backend NOW guarantees currentQuestionId is set!
            if (sessionData.currentQuestionId) {
              const savedQ = questions.find(
                (q) => q.id === sessionData.currentQuestionId
              );
              if (savedQ) {
                setCurrentQuestion(savedQ);
                setQId(savedQ.id);
                setQuestion(savedQ.question);
              }
            }
          }
        }
      } catch (err) {
        console.error("Session Sync Error:", err);
      } finally {
        setLoadingQuestion(false);
      }
    };

    syncSession();

    setTypedAnswer("");
    handleRerecord();
    setSubmitError(null);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interviewType, questions, existingSessionId]);

  //This is the function that submits the answer to the backend
  //This is just a test at the moment
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

      if (mode === "type") {
        if (!typedAnswer.trim()) throw new Error("Answer cannot be empty.");
        form.append("answerText", typedAnswer);
      } else {
        if (recordingState === "recording") {
          throw new Error("Stop the recording before submitting.");
        }
        if (!audioBlob) {
          throw new Error("No audio recorded.");
        }
        form.append("audio", audioBlob, "answer.webm");
      }

      const res = await fetch("http://localhost:5000/api/feedback/submit", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
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

  //this is to reset the audio recording

  async function startRecording() {
    setSubmitError(null);

    // Prevent starting a second recorder if one is already running
    if (recordingState === "recording") return;

    try {
      // 1) Ask for mic permission and get a live audio stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicPermission("granted");
      streamRef.current = stream;

      // 2) Create a MediaRecorder using that stream
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      // Clear any old recording data
      audioChunksRef.current = [];
      setAudioBlob(null);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);

      // 3) As the recorder produces data, store it into audioChunksRef
      mediaRecorder.ondataavailable = (event: BlobEvent) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      // 4) When recording stops, turn chunks into a Blob and create a playback URL
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);

        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        setRecordingState("stopped");
        clearTimer();
        stopMicStream();
      };

      // 5) Start recording + start timer + set state
      mediaRecorder.start();
      setRecordingState("recording");
      setElapsedTime(0);
      startTimer();
    } catch (err) {
      // User blocked mic or browser error
      setMicPermission("denied");
      setSubmitError(
        "Microphone permission denied. Please allow mic access in your browser."
      );
      stopMicStream();
    }
  }

  function stopMicStream() {
    // If we have a stream (mic on), stop every track so the mic turns off
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }
  function stopRecording() {
    setSubmitError(null);

    if (recordingState !== "recording") return;

    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    // This triggers `mediaRecorder.onstop` above
    recorder.stop();
    mediaRecorderRef.current = null;

    // Timer will also be cleared in onstop (double-safe)
    clearTimer();
  }

  function handleRerecord() {
    setSubmitError(null);

    // If currently recording, stop it first
    if (recordingState === "recording") {
      stopRecording();
    }

    // Stop mic and timer no matter what (safe cleanup)
    clearTimer();
    stopMicStream();

    // Reset UI state
    setElapsedTime(0);
    setRecordingState("idle");
    audioChunksRef.current = [];

    setAudioBlob(null);
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
  }

  function switchMode(nextMode: Mode) {
    if (nextMode === mode) return;

    // If recording, stop it so mic/timer are not running
    if (recordingState === "recording") stopRecording();

    if (nextMode === "type") {
      // Keep typedAnswer as-is (usually nice), but clear recording artifacts:
      handleRerecord();
    } else {
      // Switching to record: clear typed answer (optional)
      setTypedAnswer("");
    }

    setMode(nextMode);
    setSubmitError(null);
  }

  useEffect(() => {
    return () => {
      clearTimer();
      stopMicStream();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            Select your interview type and preferences.
          </p>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Interview Type
            </label>
            <select
              value={interviewType}
              onChange={(e) => setInterviewType(e.target.value)}
              className="w-full text-black rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="Software Engineering Interview">
                Software Engineering Interview
              </option>
              <option value="Product Management Interview">
                Product Management Interview
              </option>
              <option value="Data Science Interview">
                Data Science Interview
              </option>
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          {loadingQuestion || !currentQuestion ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-2" />
              <p className="text-gray-500">Loading your question...</p>
            </div>
          ) : (
            <>
              {/* Question display */}
              <div className="mt-4 rounded-lg border border-gray-200 p-4">
                <p className="text-sm text-gray-500 text-center">
                  Your Question:
                </p>
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
                  {/* Timer + status */}
                  <div className="mt-6 text-center">
                    <div className="text-4xl font-bold text-gray-900">
                      {timeLabel}
                    </div>
                    <div className="mt-2 text-sm text-gray-600 flex items-center justify-center gap-2">
                      {/* You can swap this with icons later */}
                      {recordingState === "idle" && "Ready to record"}
                      {recordingState === "recording" && "Recording..."}
                      {recordingState === "stopped" && "Recording saved"}
                      {micPermission === "denied" && (
                        <span className="text-red-600">(Mic blocked)</span>
                      )}
                    </div>
                  </div>

                  {/* Record buttons */}
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

                  {/* Playback */}
                  {audioUrl && (
                    <div className="mt-6">
                      <p className="text-sm text-gray-500 mb-2">Playback:</p>
                      <audio controls src={audioUrl} className="w-full" />
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Type answer UI */}
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
            </>
          )}
        </div>

        {/* Only show button if not loading */}
        {!loadingQuestion && (
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
        )}
      </div>
    </div>
  );
}
