"use client";

import React, { useEffect, useRef, useState } from "react";
import Navbar from "../../components/Navbar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Home,
  Settings,
  Keyboard,
  SunMoon,
  User,
  UserCircle2,
  BrainCircuit,
  ChartNoAxesColumn,
  Mail,
  Shield,
  LogOut,
  Link as LinkIcon,
  FileText,
  Upload,
  Trash2,
} from "lucide-react";

type AccountData = {
  email: string;
  providerGoogleConnected: boolean;
  providerGithubConnected: boolean;
  resumeFileName?: string | null;
  resumeUpdatedAt?: string | null;
};

export default function AppearancePage() {
  const router = useRouter();
  const [accountData, setAccountData] = useState<AccountData | null>(null);
  const [loading, setLoading] = useState(true);
  return (
    <div className="flex min-h-screen bg-gray-50">
      <Navbar />
        <main className="flex-1 p-8">
            <h1 className="text-2xl font-semibold mb-6">Appearance Settings</h1>    
            <p>Customize your appearance settings here.</p>
        </main>
    </div>
  );
}