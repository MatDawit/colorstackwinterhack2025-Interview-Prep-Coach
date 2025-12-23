//"use client" runs this component in the browser. This is important because it allows the component to use browser-specific APIs and features,
// like recording audio
"use client";
//useState stores values that change over time, useRef saves values between renders, useEffect runs code after rendering, useMemo caches expensive computations
import React, { useEffect, useMemo, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import { useRouter } from "next/navigation";
type Mode = "record" | "type";
type RecordingState = "idle" | "recording" | "stopped";
type MicPermission = "granted" | "denied" | "unknown";

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes < 10 ? "0" : ""}${minutes}:${
    remainingSeconds < 10 ? "0" : ""
  }${remainingSeconds}`;
}

export default function Practice() {
  const router = useRouter();
  const [interviewType, setInterviewType] = useState("interview");
  //Right now, the question ID and question are hardcoded. In the future, we will fetch these from the database
  const [qId, setQId] = useState("q1_failed_01");
  const [question, setQuestion] = useState("Tell me about a time when you had failed.");

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
            <h2 className="text-base font-semibold text-gray-900">Interview Settings</h2>
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
                <option value="Software Engineering Interview">Software Engineering Interview</option>
                <option value="Product Management Interview">Product Management Interview</option>
                <option value="Data Science Interview">Data Science Interview</option>
            </select>
            </div>
        </div>
        </div>


        <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">

            {/* Question display */}
            <div className="mt-4 rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-500 text-center">Your Question:</p>
            <p className="mt-2 text-2xl text-center font-medium text-gray-900">{question}</p>
            </div>

            {/* Timer + Status */}
            <div className="mt-6 text-center">
            <div className="text-4xl font-bold text-gray-900">{timeLabel}</div>
            <div className="mt-2 text-sm text-gray-600">
                Status: <span className="font-semibold">{recordingState}</span>
                {micPermission === "denied" && (
                <span className="ml-2 text-red-600">(Mic blocked)</span>
                )}
            </div>
            </div>

            {/* Buttons */}
            <div className="mt-6 flex items-center justify-center gap-3">
            {recordingState !== "recording" ? (
                <button
                onClick={startRecording}
                className="px-5 py-2 rounded-lg border border-blue-300 text-blue-700 hover:bg-blue-50 font-medium"
                >
                Start Recording
                </button>
            ) : (
                <button
                onClick={stopRecording}
                className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium"
                >
                Stop Recording
                </button>
            )}

            <button
                onClick={handleRerecord}
                className="px-5 py-2 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 font-medium"
            >
                Re-record
            </button>
            </div>

            {/* Error */}
            {submitError && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {submitError}
            </div>
            )}

            {/* Playback */}
            {audioUrl && (
            <div className="mt-6">
                <p className="text-sm text-gray-500 mb-2">Playback:</p>
                <audio controls src={audioUrl} className="w-full" />
            </div>
            )}
        </div>
        </div>
    </div>
  );
}
