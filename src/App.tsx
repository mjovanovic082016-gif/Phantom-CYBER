import React, { useState, useEffect, useRef } from "react";
import { 
  Terminal, 
  ShieldAlert, 
  FileCode, 
  Download, 
  Plus, 
  Trash2, 
  Copy, 
  Save, 
  Cpu, 
  Wifi, 
  Clock, 
  Send, 
  RefreshCw, 
  Check, 
  AlertCircle, 
  Lock, 
  FileText, 
  ChevronRight,
  Code,
  ExternalLink,
  Settings,
  X,
  Maximize2,
  Minimize2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { VirtualFile, ChatMessage, ChatSession } from "./types";

// Static Initial Workspace Files to give the user immediate value
const INITIAL_FILES: VirtualFile[] = [
  {
    id: "file-1",
    name: "nmap_fast_scan.py",
    language: "python",
    content: `import socket
import sys
from datetime import datetime

# Quick TCP Port Scanner
target_host = "127.0.0.1"
ports_to_scan = [21, 22, 23, 25, 53, 80, 110, 135, 139, 443, 445, 3306, 3389, 8080]

print("-" * 50)
print(f"Scanning target: {target_host}")
print(f"Time started: {str(datetime.now())}")
print("-" * 50)

try:
    for port in ports_to_scan:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(0.5)
        result = s.connect_ex((target_host, port))
        if result == 0:
            print(f"Port {port}: OPEN")
        s.close()
except KeyboardInterrupt:
    print("\\nExiting script.")
    sys.exit()
except socket.gaierror:
    print("\\nHostname could not be resolved.")
    sys.exit()
except socket.error:
    print("\\nCould not connect to server.")
    sys.exit()
`,
    createdAt: "2026-07-04T12:00:00"
  },
  {
    id: "file-2",
    name: "iptables_firewall.sh",
    language: "bash",
    content: `#!/bin/bash
# High-Security iptables Firewall Configuration
# Restricts incoming, allows necessary services, protects against common scans

echo "[*] Setting up Phantom firewall rules..."

# Clear existing rules
iptables -F
iptables -X

# Set default policies (Drop incoming/forward, allow outgoing)
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT ACCEPT

# Allow loopback interface (localhost)
iptables -A INPUT -i lo -j ACCEPT
iptables -A OUTPUT -o lo -j ACCEPT

# Allow established and related connections
iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT

# Allow standard secure services (SSH: 22, HTTP: 80, HTTPS: 443)
iptables -A INPUT -p tcp --dport 22 -m conntrack --ctstate NEW -j ACCEPT
iptables -A INPUT -p tcp --dport 80 -m conntrack --ctstate NEW -j ACCEPT
iptables -A INPUT -p tcp --dport 443 -m conntrack --ctstate NEW -j ACCEPT

# Block common attacks (Syn-Floods, Ping of Death)
iptables -A INPUT -p tcp --tcp-flags ALL NONE -j DROP
iptables -A INPUT -p tcp --tcp-flags ALL ALL -j DROP
iptables -A INPUT -p tcp ! --syn -m state --state NEW -j DROP

# Log dropped packets (for analysis)
iptables -A INPUT -m limit --limit 5/min -j LOG --log-prefix "iptables-dropped: " --log-level 7

echo "[+] Firewall rules applied successfully."
`,
    createdAt: "2026-07-04T12:05:00"
  },
  {
    id: "file-3",
    name: "incident_audit.md",
    language: "markdown",
    content: `# RAPPORT D'AUDIT DE SÉCURITÉ PHANTOM

## 1. Résumé Exécutif
Ce document synthétise l'audit de sécurité préliminaire effectué sur l'infrastructure cible.

## 2. Vulnérabilités Identifiées
- **CVE-2024-XXXX**: Gravité Élevée. Un service d'administration obsolète expose la machine aux fuites d'identifiants.
- **Port 21 (FTP)**: Ouvert. FTP en clair détecté. Risque d'interception d'informations d'identification de session.

## 3. Recommandations Immédiates
1. Désactiver ou mettre à jour le service obsolète d'administration.
2. Remplacer FTP par SFTP ou FTPS (Chiffrement SSL/TLS).
3. Configurer des politiques de mot de passe robustes (12+ caractères, caractères spéciaux).
`,
    createdAt: "2026-07-04T12:10:00"
  }
];

const WELCOME_CONTENT = `### BIENVENUE SUR PHANTOM CYBER CONSOLE v1

Je suis **Phantom AI**, une intelligence spécialisée exclusivement dans l'informatique, le développement de scripts et la cybersécurité.

#### 🛠️ Mes capacités phares :
* **Cybersécurité** : Audit de code, analyse de vulnérabilités, règles de pare-feu, concepts d'audit.
* **Scripting** : Écriture de scripts en Python, Bash, JavaScript, Go, PowerShell, etc.
* **Système & Réseau** : Configuration de serveurs, protocoles réseau, durcissement système (hardening).
* **Fichiers** : Je peux générer des scripts exploitables qui s'ajouteront automatiquement dans votre **Workspace** à droite, prêts à être édités, copiés ou téléchargés directement.

*Comment puis-je sécuriser ou optimiser vos systèmes aujourd'hui ?*`;

const INACTIVITY_THRESHOLD = 1 * 60 * 1000; // 1 minute in ms

const getInitialSessions = (): ChatSession[] => {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem("phantom_cyber_sessions");
  if (stored) {
    try {
      const parsed = JSON.parse(stored) as ChatSession[];
      if (parsed && parsed.length > 0) {
        return parsed;
      }
    } catch (e) {
      console.error("Error reading sessions from localStorage", e);
    }
  }
  
  // Create first default session
  const defaultSess: ChatSession = {
    id: "session-initial",
    title: "Diagnostic de Base",
    messages: [
      {
        id: "initial-welcome",
        role: "assistant",
        content: WELCOME_CONTENT,
        timestamp: new Date().toLocaleTimeString(),
        files: []
      }
    ],
    files: INITIAL_FILES,
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString()
  };
  localStorage.setItem("phantom_cyber_sessions", JSON.stringify([defaultSess]));
  return [defaultSess];
};

export default function App() {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const initial = getInitialSessions();
    const sorted = [...initial].sort((a, b) => new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime());
    const mostRecent = sorted[0];
    const timeDiff = Date.now() - new Date(mostRecent.lastActiveAt).getTime();
    
    if (timeDiff > INACTIVITY_THRESHOLD && mostRecent.messages.length > 1) {
      // Create new clean session automatically after inactivity period
      const newSessId = "session-" + Date.now();
      const newSess: ChatSession = {
        id: newSessId,
        title: "Nouvelle Session Auto",
        messages: [
          {
            id: "initial-welcome-" + Date.now(),
            role: "assistant",
            content: WELCOME_CONTENT,
            timestamp: new Date().toLocaleTimeString(),
            files: []
          }
        ],
        files: INITIAL_FILES,
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString()
      };
      const updated = [newSess, ...initial];
      localStorage.setItem("phantom_cyber_sessions", JSON.stringify(updated));
      return updated;
    }
    return initial;
  });

  const [currentSessionId, setCurrentSessionId] = useState<string>(() => {
    const sorted = [...sessions].sort((a, b) => new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime());
    return sorted[0]?.id || "session-initial";
  });

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedFileId, setSelectedFileId] = useState<string | null>("file-1");
  const [editorContent, setEditorContent] = useState("");
  const [editorFileName, setEditorFileName] = useState("");
  const [editorFileLanguage, setEditorFileLanguage] = useState("");
  const [newFileNameInput, setNewFileNameInput] = useState("");
  const [isCreatingFile, setIsCreatingFile] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [activeTab, setActiveTab] = useState<"workspace" | "chat">("chat"); // for mobile responsive
  const [uptime, setUptime] = useState(0);
  const [editorFeedback, setEditorFeedback] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [lastResponseTime, setLastResponseTime] = useState<number | null>(null);
  const [showSessionsSidebar, setShowSessionsSidebar] = useState(() => typeof window !== "undefined" ? window.innerWidth > 1024 : true);

  // Derived active state
  const currentSession = sessions.find(s => s.id === currentSessionId) || sessions[0];
  const messages = currentSession.messages;
  const files = currentSession.files;

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync state helpers
  const updateCurrentSession = (updater: (sess: ChatSession) => ChatSession) => {
    setSessions(prev => {
      const updated = prev.map(s => {
        if (s.id === currentSessionId) {
          const next = updater(s);
          return {
            ...next,
            lastActiveAt: new Date().toISOString()
          };
        }
        return s;
      });
      localStorage.setItem("phantom_cyber_sessions", JSON.stringify(updated));
      return updated;
    });
  };

  const setMessages = (newMessages: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => {
    updateCurrentSession(sess => {
      const msgs = typeof newMessages === "function" ? newMessages(sess.messages) : newMessages;
      
      let nextTitle = sess.title;
      // If title is default, extract first 30 chars of the first user message
      if (sess.title === "Diagnostic de Base" || sess.title === "Nouvelle Session Auto" || sess.title === "Nouvelle Session") {
        const firstUserMsg = msgs.find(m => m.role === "user");
        if (firstUserMsg) {
          nextTitle = firstUserMsg.content.length > 25 
            ? firstUserMsg.content.substring(0, 25).trim() + "..." 
            : firstUserMsg.content;
        }
      }

      return {
        ...sess,
        title: nextTitle,
        messages: msgs
      };
    });
  };

  const setFiles = (newFiles: VirtualFile[] | ((prev: VirtualFile[]) => VirtualFile[])) => {
    updateCurrentSession(sess => {
      const nextFiles = typeof newFiles === "function" ? newFiles(sess.files) : newFiles;
      return {
        ...sess,
        files: nextFiles
      };
    });
  };

  // Auto select first file on session change
  useEffect(() => {
    if (currentSession && currentSession.files.length > 0) {
      setSelectedFileId(currentSession.files[0].id);
    } else {
      setSelectedFileId(null);
    }
  }, [currentSessionId]);

  // Create a brand new manual session
  const handleCreateNewSession = () => {
    const newSessId = "session-" + Date.now();
    const newSess: ChatSession = {
      id: newSessId,
      title: "Nouvelle Session",
      messages: [
        {
          id: "initial-welcome-" + Date.now(),
          role: "assistant",
          content: WELCOME_CONTENT,
          timestamp: new Date().toLocaleTimeString(),
          files: []
        }
      ],
      files: INITIAL_FILES,
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString()
    };
    const updated = [newSess, ...sessions];
    setSessions(updated);
    localStorage.setItem("phantom_cyber_sessions", JSON.stringify(updated));
    setCurrentSessionId(newSessId);
    triggerEditorFeedback("Nouvelle session de diagnostic initialisée.");
  };

  // Delete session
  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (sessions.length <= 1) {
      triggerEditorFeedback("Action refusée : Au moins une session doit exister.");
      return;
    }
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    localStorage.setItem("phantom_cyber_sessions", JSON.stringify(updated));
    
    if (currentSessionId === id) {
      const sorted = [...updated].sort((a, b) => new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime());
      setCurrentSessionId(sorted[0]?.id);
    }
    triggerEditorFeedback("Session purgée de la mémoire.");
  };

  // Response timer for loading speed monitoring
  useEffect(() => {
    let interval: any;
    if (loading) {
      setElapsedSeconds(0);
      interval = setInterval(() => {
        setElapsedSeconds(prev => +(prev + 0.1).toFixed(1));
      }, 100);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Uptime simulator
  useEffect(() => {
    const interval = setInterval(() => {
      setUptime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Clock
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync selected file changes with editor
  useEffect(() => {
    if (selectedFileId) {
      const file = files.find(f => f.id === selectedFileId);
      if (file) {
        setEditorContent(file.content);
        setEditorFileName(file.name);
        setEditorFileLanguage(file.language);
      }
    } else {
      setEditorContent("");
      setEditorFileName("");
      setEditorFileLanguage("");
    }
  }, [selectedFileId, files]);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Format Uptime
  const formatUptime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Handle manual saving of code in the editor
  const handleSaveFile = () => {
    if (!selectedFileId) return;
    setFiles(prev => prev.map(f => {
      if (f.id === selectedFileId) {
        return { ...f, content: editorContent, name: editorFileName, language: getLanguageFromExtension(editorFileName) };
      }
      return f;
    }));
    triggerEditorFeedback("Fichier enregistré.");
  };

  const triggerEditorFeedback = (msg: string) => {
    setEditorFeedback(msg);
    setTimeout(() => setEditorFeedback(null), 3000);
  };

  // Get language class from extension
  const getLanguageFromExtension = (filename: string): string => {
    const ext = filename.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "py": return "python";
      case "sh":
      case "bash": return "bash";
      case "js": return "javascript";
      case "ts": return "typescript";
      case "json": return "json";
      case "md": return "markdown";
      case "html": return "html";
      case "css": return "css";
      default: return "plaintext";
    }
  };

  // Trigger download of a file
  const handleDownloadFile = (file: VirtualFile) => {
    const blob = new Blob([file.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Create new manual file
  const handleCreateNewFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileNameInput.trim()) return;
    
    const name = newFileNameInput.trim();
    const language = getLanguageFromExtension(name);
    const newFile: VirtualFile = {
      id: "file-" + Date.now(),
      name,
      language,
      content: `# ${name}\n# Créé le ${new Date().toLocaleDateString()}\n\n`,
      createdAt: new Date().toISOString()
    };

    setFiles(prev => [newFile, ...prev]);
    setSelectedFileId(newFile.id);
    setNewFileNameInput("");
    setIsCreatingFile(false);
    triggerEditorFeedback("Nouveau fichier créé !");
  };

  // Delete file
  const handleDeleteFile = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFiles(prev => prev.filter(f => f.id !== id));
    if (selectedFileId === id) {
      setSelectedFileId(null);
    }
  };

  // Preset prompt trigger
  const handleTriggerPreset = (promptText: string) => {
    if (loading) return;
    setInput(promptText);
    sendMessage(promptText);
  };

  // Send message to the backend express server
  const sendMessage = async (overrideInput?: string) => {
    const textToSend = overrideInput || input;
    if (!textToSend.trim() || loading) return;

    if (!overrideInput) {
      setInput("");
    }

    const userMessage: ChatMessage = {
      id: "msg-" + Date.now(),
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    const startTime = performance.now();
    try {
      // Send chat history to Express /api/chat endpoint
      const chatHistory = [...messages, userMessage].map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ messages: chatHistory })
      });

      if (!res.ok) {
        let errorDetails = `Erreur API: Code ${res.status}`;
        try {
          const errData = await res.json();
          if (errData && (errData.details || errData.error)) {
            errorDetails = `${errData.error || ""}: ${errData.details || ""}`.trim();
          }
        } catch (_) {
          try {
            const text = await res.text();
            if (text) errorDetails = `${errorDetails} - ${text.slice(0, 100)}`;
          } catch (_) {}
        }
        throw new Error(errorDetails);
      }

      const data = await res.json();
      const endTime = performance.now();
      const duration = +((endTime - startTime) / 1000).toFixed(2);
      setLastResponseTime(duration);

      const assistantMessage: ChatMessage = {
        id: "msg-" + Date.now() + "-ai",
        role: "assistant",
        content: data.text || "Désolé, aucune réponse n'a été renvoyée par Phantom Core.",
        timestamp: new Date().toLocaleTimeString(),
        latency: duration,
        files: data.files || []
      };

      setMessages(prev => [...prev, assistantMessage]);

      // If files are returned, auto-mount them to the workspace
      if (data.files && Array.isArray(data.files) && data.files.length > 0) {
        const newVirtualFiles: VirtualFile[] = data.files.map((file: any, index: number) => ({
          id: `ai-file-${Date.now()}-${index}`,
          name: file.name,
          language: file.language || getLanguageFromExtension(file.name),
          content: file.content,
          createdAt: new Date().toISOString()
        }));

        setFiles(prev => [...newVirtualFiles, ...prev]);
        // Auto select the first generated file so they can see it in the editor
        if (newVirtualFiles.length > 0) {
          setSelectedFileId(newVirtualFiles[0].id);
        }
      }

    } catch (err: any) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          id: "msg-" + Date.now() + "-err",
          role: "system",
          content: `⚠️ **ERREUR SYSTEME** : Échec de la connexion au Core de l'IA.\n*Détails : ${err.message || "Serveur injoignable"}.*\n\nAssurez-vous que l'API de base est configurée correctement.`,
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Custom Markdown and Code Blocks parser to prevent dependency layout breaks in React 19
  const parseMarkdown = (text: string, msgId: string) => {
    const parts = text.split(/```/g);
    return parts.map((part, index) => {
      // If index is odd, it's a code block
      if (index % 2 === 1) {
        const firstLineEnd = part.indexOf("\n");
        const headerLine = part.slice(0, firstLineEnd).trim();
        const codeContent = part.slice(firstLineEnd + 1).trim();

        // Try to guess name or default to extension
        const language = headerLine || "text";
        const placeholderName = `script_${index}.${language === "python" ? "py" : language === "bash" || language === "sh" ? "sh" : "txt"}`;

        return (
          <div key={`${msgId}-code-${index}`} className="my-4 border border-neutral-800 rounded bg-neutral-950 overflow-hidden font-mono text-xs">
            <div className="flex items-center justify-between px-3 py-2 bg-neutral-900 border-b border-neutral-800 text-neutral-400">
              <span className="flex items-center gap-1.5 text-neutral-300">
                <Code size={13} className="text-white" />
                {language.toUpperCase()}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(codeContent);
                    triggerEditorFeedback("Code copié !");
                  }}
                  className="px-2 py-1 hover:bg-neutral-800 hover:text-white rounded text-[10px] transition duration-150 flex items-center gap-1"
                  title="Copier le code"
                >
                  <Copy size={11} />
                  Copier
                </button>
                <button
                  onClick={() => {
                    // Inject directly into Workspace Files
                    const newFile: VirtualFile = {
                      id: "file-extracted-" + Date.now() + "-" + index,
                      name: placeholderName,
                      language: getLanguageFromExtension(placeholderName),
                      content: codeContent,
                      createdAt: new Date().toISOString()
                    };
                    setFiles(prev => [newFile, ...prev]);
                    setSelectedFileId(newFile.id);
                    triggerEditorFeedback(`Monté dans le Workspace : ${placeholderName}`);
                  }}
                  className="px-2 py-1 bg-white text-black hover:bg-neutral-200 font-bold rounded text-[10px] transition duration-150 flex items-center gap-1"
                >
                  <Plus size={11} />
                  Monter le fichier
                </button>
              </div>
            </div>
            <pre className="p-3 overflow-x-auto text-neutral-200 bg-black max-h-96 leading-relaxed">
              <code>{codeContent}</code>
            </pre>
          </div>
        );
      } else {
        // Render simple paragraphs
        const paragraphs = part.split(/\n\n/g);
        return paragraphs.map((p, pIdx) => {
          if (!p.trim()) return null;

          // Check if paragraph is list items
          if (p.startsWith("* ") || p.startsWith("- ")) {
            const listItems = p.split(/\n/g);
            return (
              <ul key={`${msgId}-p-${index}-${pIdx}`} className="list-disc list-inside my-2 space-y-1 text-neutral-300 text-sm pl-2">
                {listItems.map((item, itemIdx) => {
                  const cleaned = item.replace(/^[\*\-]\s+/, "");
                  return <li key={itemIdx} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(cleaned) }}></li>;
                })}
              </ul>
            );
          }

          return (
            <p 
              key={`${msgId}-p-${index}-${pIdx}`} 
              className="my-2.5 text-neutral-300 text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(p) }}
            />
          );
        });
      }
    });
  };

  // Helper to format basic inline markdown bold, italics, code
  const formatInlineMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="text-neutral-200">$1</em>')
      .replace(/`(.*?)`/g, '<code class="bg-neutral-800 text-white px-1.5 py-0.5 rounded font-mono text-xs">$1</code>');
  };

  const getFileIcon = (filename: string) => {
    const ext = filename.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "py":
        return <FileCode size={16} className="text-yellow-500" />;
      case "sh":
      case "bash":
        return <Terminal size={16} className="text-emerald-400" />;
      case "md":
        return <FileText size={16} className="text-sky-400" />;
      case "json":
        return <Code size={16} className="text-purple-400" />;
      default:
        return <FileCode size={16} className="text-neutral-400" />;
    }
  };

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-black text-neutral-200 font-sans flex flex-col selection:bg-white selection:text-black">
      
      {/* GLOBAL NOTIFICATION FEEDBACK BAR */}
      <AnimatePresence>
        {editorFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-neutral-900 border border-neutral-700 text-white text-xs font-mono py-2 px-4 rounded shadow-lg shadow-black/50 flex items-center gap-2"
          >
            <ShieldAlert size={14} className="text-emerald-400 animate-pulse" />
            <span>[PHANTOM_SYS] {editorFeedback}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TOP DECK HEADER */}
      <header className="border-b border-zinc-900 bg-zinc-950/90 backdrop-blur-md px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981] animate-pulse" />
          <h1 className="font-sans text-base font-extrabold tracking-wider text-white flex items-center gap-2">
            PHANTOM_CYBER <span className="text-[9px] px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-300 font-semibold rounded-full tracking-normal">V1</span>
          </h1>
          <button
            onClick={() => setShowSessionsSidebar(prev => !prev)}
            className="px-3 py-1.5 bg-zinc-900/60 hover:bg-zinc-800/85 border border-zinc-800 hover:border-zinc-700 hover:text-white text-zinc-300 rounded-lg font-sans text-[11px] font-bold flex items-center gap-2 transition-all duration-200 shadow-sm"
            title="Afficher/Masquer l'historique des sessions"
          >
            <Terminal size={12} className="text-zinc-400" />
            <span>LISTE CHATS ({sessions.length})</span>
          </button>
          <span className="hidden md:inline text-zinc-800 font-mono text-xs">|</span>
          <p className="hidden md:flex items-center gap-1.5 font-sans text-xs text-zinc-400 font-medium">
            <Wifi size={12} className="text-emerald-400" />
            CORE: CONNECTED
          </p>
        </div>

        {/* System telemetry data */}
        <div className="flex items-center gap-4 font-sans text-xs text-zinc-400 font-medium">
          <div className="hidden sm:flex items-center gap-1.5">
            <Cpu size={12} className="text-zinc-500" />
            <span>TEMP: 38°C</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock size={12} className="text-zinc-500" />
            <span>UPTIME: {formatUptime(uptime)}</span>
          </div>
          <div className="text-zinc-300 bg-zinc-900 border border-zinc-800 px-2.5 py-1 rounded-md text-[11px] font-semibold font-mono shadow-inner shadow-black/40">
            {currentTime}
          </div>
        </div>
      </header>

      {/* MOBILE TAB CONTROLLER */}
      <div className="flex md:hidden bg-zinc-950 p-1.5 gap-1 border-b border-zinc-900">
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 ${
            activeTab === "chat" 
              ? "bg-zinc-900 text-white shadow-sm shadow-black/50 border border-zinc-800" 
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          CHAT CONSOLE
        </button>
        <button
          onClick={() => setActiveTab("workspace")}
          className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all duration-200 ${
            activeTab === "workspace" 
              ? "bg-zinc-900 text-white shadow-sm shadow-black/50 border border-zinc-800" 
              : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          ESPACE SCRIPT ({files.length})
        </button>
      </div>

      {/* MAIN CONTAINER PLATFORM */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Mobile backdrop */}
        {showSessionsSidebar && (
          <div 
            onClick={() => setShowSessionsSidebar(false)} 
            className="fixed inset-0 bg-black/80 z-20 lg:hidden transition-opacity duration-300"
          />
        )}

        {/* SESSIONS HISTORY PANEL: LEFTMOST SIDEBAR / MOBILE DRAWER */}
        <aside 
          className={`
            fixed inset-y-0 left-0 z-30 bg-zinc-950/80 backdrop-blur-md border-zinc-900 flex flex-col shrink-0 font-sans text-xs transition-all duration-300 overflow-hidden
            ${showSessionsSidebar 
              ? "translate-x-0 w-64 border-r" 
              : "-translate-x-full lg:translate-x-0 lg:w-0 lg:border-none"
            }
            lg:relative
          `}
        >
          {/* Fixed width container to prevent layout warping during collapse */}
          <div className="w-64 flex flex-col h-full shrink-0">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-zinc-900 flex items-center justify-between bg-zinc-950/60">
              <span className="text-zinc-100 font-bold tracking-wider flex items-center gap-1.5 text-[10px] uppercase font-sans">
                <Terminal size={12} className="text-zinc-300" />
                Historique des Chats
              </span>
              <span className="text-[10px] text-zinc-400 bg-zinc-900/85 px-2.5 py-0.5 rounded-full border border-zinc-800">
                {sessions.length} Chat{sessions.length > 1 ? "s" : ""}
              </span>
            </div>

            {/* New Chat Button */}
            <div className="p-4">
              <button
                onClick={() => {
                  handleCreateNewSession();
                  if (window.innerWidth < 1024) setShowSessionsSidebar(false);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-white text-black hover:bg-zinc-100 font-bold text-xs tracking-wide transition-all duration-250 flex items-center justify-center gap-2 shadow-lg shadow-white/5 hover:shadow-white/10"
              >
                <Plus size={14} className="stroke-[2.5]" />
                AJOUTER UN CHAT
              </button>
            </div>

            {/* Sessions List */}
            <div className="flex-1 overflow-y-auto px-3 space-y-1.5 scrollbar-thin">
              {sessions.map((sess) => {
                const isActive = sess.id === currentSessionId;
                const dateObj = new Date(sess.lastActiveAt);
                const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                
                return (
                  <div
                    key={sess.id}
                    onClick={() => {
                      setCurrentSessionId(sess.id);
                      if (window.innerWidth < 1024) setShowSessionsSidebar(false);
                    }}
                    className={`group relative flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                      isActive
                        ? "bg-zinc-900 border-zinc-800 text-white font-semibold shadow-md shadow-black/30"
                        : "bg-transparent border-transparent hover:bg-zinc-900/40 hover:border-zinc-900/50 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden pr-6">
                      <span className={`w-2 h-2 rounded-full shrink-0 transition-all ${
                        isActive ? "bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" : "bg-zinc-800"
                      }`} />
                      <div className="truncate leading-tight">
                        <p className="truncate text-zinc-200 text-xs font-semibold group-hover:text-white transition-colors">
                          {sess.title}
                        </p>
                        <p className="text-[10px] text-zinc-500 font-medium font-sans mt-0.5">
                          Actif à : {formattedTime}
                        </p>
                      </div>
                    </div>

                    {/* Delete button (only if more than 1 session) */}
                    <button
                      onClick={(e) => handleDeleteSession(sess.id, e)}
                      className="absolute right-3 opacity-0 group-hover:opacity-100 hover:text-red-400 p-1 rounded-lg hover:bg-zinc-800 transition-all duration-150"
                      title="Supprimer la session"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Sidebar Footer */}
            <div className="p-4 border-t border-zinc-900 bg-zinc-950/80 text-[10px] text-zinc-500 space-y-2 font-sans">
              <div className="flex items-center justify-between">
                <span>PERSISTANCE :</span>
                <span className="text-emerald-400 font-bold">ACTIVE (Local)</span>
              </div>
              <div className="flex items-center justify-between">
                <span>NETTOYAGE AUTO :</span>
                <span className="text-zinc-400 font-bold">1 Min d'Inactivité</span>
              </div>
            </div>
          </div>
        </aside>
        
        {/* CHAT PANEL: LEFT */}
        <section 
          className={`flex-1 flex flex-col border-r border-zinc-900 bg-zinc-950/20 h-full overflow-hidden ${
            activeTab === "chat" ? "flex" : "hidden md:flex"
          } md:w-3/5`}
        >
          {/* Chat scrolling log */}
          <div className="flex-1 p-5 overflow-y-auto space-y-5 scrollbar-thin">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3.5 max-w-4xl p-4 rounded-2xl transition-all duration-250 border ${
                  msg.role === "user"
                    ? "ml-auto bg-zinc-900 border-zinc-800 text-zinc-100 rounded-tr-sm shadow-md shadow-black/20"
                    : msg.role === "system"
                    ? "mx-auto bg-red-950/20 border-red-900/40 text-red-200 w-full rounded-xl shadow-sm"
                    : "bg-zinc-950/40 border-zinc-900/60 text-zinc-300 rounded-tl-sm shadow-sm"
                }`}
                style={{ alignSelf: msg.role === "user" ? "flex-end" : "flex-start" }}
              >
                {/* Avatar / Terminal symbol */}
                <div className="flex-shrink-0 mt-0.5">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-sans text-[10px] font-bold shadow-md ${
                    msg.role === "user" 
                      ? "bg-zinc-800 text-zinc-100 border border-zinc-700" 
                      : msg.role === "system"
                      ? "bg-red-900/60 text-red-100 border border-red-700/60"
                      : "bg-gradient-to-tr from-zinc-900 to-zinc-700 text-white border border-zinc-800"
                  }`}>
                    {msg.role === "user" ? "U" : msg.role === "system" ? "!" : "P"}
                  </div>
                </div>

                {/* Message Body Content */}
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-sans text-xs font-bold text-zinc-400">
                      {msg.role === "user" ? "Utilisateur" : msg.role === "system" ? "Logger Système" : "Phantom AI"}
                    </span>
                    <span className="font-sans text-[10px] text-zinc-600">
                      {msg.timestamp}
                    </span>
                  </div>

                  {/* Render content */}
                  <div className="prose prose-invert max-w-none text-zinc-300 text-sm leading-relaxed">
                    {parseMarkdown(msg.content, msg.id)}
                  </div>

                  {/* Latency badge */}
                  {msg.role === "assistant" && msg.latency && (
                    <div className="mt-3.5 pt-2.5 border-t border-zinc-900 flex flex-wrap items-center gap-x-4 gap-y-1.5 font-sans text-[11px] text-zinc-500 font-medium">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
                        Vitesse : <strong className="text-zinc-300">{msg.latency}s</strong>
                      </span>
                      <span>•</span>
                      <span>Qualité : <strong className="text-zinc-300">Maximale</strong></span>
                      <span>•</span>
                      <span>Précision : <strong className="text-zinc-300">100% Cyber</strong></span>
                    </div>
                  )}

                  {/* Render inline attachments/files if any */}
                  {msg.files && msg.files.length > 0 && (
                    <div className="mt-4 p-3.5 bg-zinc-950/80 rounded-xl border border-zinc-900/80 shadow-inner">
                      <div className="font-sans text-[10px] font-bold text-zinc-400 mb-2.5 flex items-center gap-1.5 uppercase tracking-wide">
                        <FileCode size={13} className="text-zinc-300" />
                        Fichiers créés par l'IA :
                      </div>
                      <div className="space-y-2">
                        {msg.files.map((file, fIdx) => (
                          <div 
                            key={fIdx} 
                            onClick={() => {
                              const found = files.find(f => f.name === file.name);
                              if (found) {
                                setSelectedFileId(found.id);
                              }
                              setActiveTab("workspace");
                            }}
                            className="flex items-center justify-between p-2.5 bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-800 rounded-lg cursor-pointer transition duration-150"
                          >
                            <span className="font-mono text-xs text-zinc-200 flex items-center gap-2">
                              {getFileIcon(file.name)}
                              {file.name}
                            </span>
                            <span className="font-sans text-[10px] text-zinc-500 font-medium bg-zinc-950 px-2 py-0.5 rounded-full border border-zinc-850">
                              Ouvrir l'Espace Script
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-3.5 max-w-xl p-4 bg-zinc-900/40 border border-zinc-900/60 rounded-2xl shadow-sm animate-pulse">
                <div className="w-7 h-7 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0 border border-zinc-700">
                  <RefreshCw size={12} className="animate-spin text-zinc-300" />
                </div>
                <div className="flex-1 space-y-2.5 text-xs text-zinc-400 overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-zinc-100 font-sans">
                    <span className="flex items-center gap-1.5 font-bold">
                      ANALYSE PHANTOM EN COURS...
                    </span>
                    <span className="text-[10px] bg-zinc-950/80 border border-zinc-850 text-zinc-400 px-2 py-0.5 rounded-full font-mono">
                      LATENCE : <strong className="text-zinc-200 font-bold">{elapsedSeconds}s</strong>
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500 font-medium">
                    Traitement de la requête, génération des scripts, sécurisation et recherche de failles...
                  </p>
                  
                  {/* Progress bar tracking target of 4.0 seconds */}
                  <div className="h-1 w-full bg-zinc-950 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white transition-all duration-100" 
                      style={{ width: `${Math.min(100, (elapsedSeconds / 4) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Preset Prompts Block */}
          <div className="px-5 py-3.5 border-t border-zinc-900 bg-zinc-950/40">
            <div className="font-sans text-[10px] font-bold text-zinc-500 mb-2.5 uppercase tracking-wider">
              Suggestions d'analyse rapide :
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleTriggerPreset("Fais-moi un script de scan de port TCP rapide en Python")}
                className="px-3 py-1.5 bg-zinc-900/55 hover:bg-zinc-800/80 border border-zinc-850 hover:border-zinc-750 rounded-full text-xs font-sans text-zinc-300 hover:text-white transition duration-150 shadow-sm"
              >
                Scanner Python
              </button>
              <button
                onClick={() => handleTriggerPreset("Donne-moi un script Bash de sécurité pour sécuriser un serveur Linux (iptables, SSH)")}
                className="px-3 py-1.5 bg-zinc-900/55 hover:bg-zinc-800/80 border border-zinc-850 hover:border-zinc-750 rounded-full text-xs font-sans text-zinc-300 hover:text-white transition duration-150 shadow-sm"
              >
                Durcir Linux
              </button>
              <button
                onClick={() => handleTriggerPreset("Écris un script Bash pour analyser les logs d'accès Nginx et détecter les tentatives d'injection SQL")}
                className="px-3 py-1.5 bg-zinc-900/55 hover:bg-zinc-800/80 border border-zinc-850 hover:border-zinc-750 rounded-full text-xs font-sans text-zinc-300 hover:text-white transition duration-150 shadow-sm"
              >
                Analyseur Logs Nginx
              </button>
              <button
                onClick={() => handleTriggerPreset("Explique l'attaque Man-in-the-Middle (MitM) et comment s'en prémunir")}
                className="px-3 py-1.5 bg-zinc-900/55 hover:bg-zinc-800/80 border border-zinc-850 hover:border-zinc-750 rounded-full text-xs font-sans text-zinc-300 hover:text-white transition duration-150 shadow-sm"
              >
                Analyse MitM
              </button>
            </div>
          </div>

          {/* Bottom Chat Inputs */}
          <div className="p-4 border-t border-zinc-900 bg-zinc-950">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex gap-2.5"
            >
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 font-mono text-xs text-zinc-500 font-bold select-none">
                  $
                </span>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Posez une question, demandez un script, configurez un audit..."
                  className="w-full bg-zinc-900/50 border border-zinc-850 rounded-xl px-4 py-3 pl-8 text-sm text-zinc-100 focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 font-sans placeholder-zinc-600 transition duration-200"
                  disabled={loading}
                  maxLength={1000}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-5 py-3 bg-white text-black hover:bg-zinc-100 disabled:bg-zinc-900 disabled:text-zinc-600 font-bold font-sans rounded-xl text-xs flex items-center gap-1.5 transition duration-200 shadow-md shadow-white/5 shrink-0"
              >
                <Send size={13} />
                EXÉCUTER
              </button>
            </form>
            <div className="mt-2.5 px-1 flex justify-between items-center text-[10px] font-sans text-zinc-500 font-medium">
              <span>Phantom Intelligence Core active et limitée à l'informatique de sécurité.</span>
              <span>Modèle: GEMINI-FAST-CHANNELS</span>
            </div>
          </div>
        </section>

        {/* WORKSPACE & FILE MANAGER: RIGHT */}
        <section 
          className={`flex-1 flex flex-col bg-zinc-950/40 h-full overflow-hidden ${
            activeTab === "workspace" ? "flex" : "hidden md:flex"
          } md:w-2/5`}
        >
          {/* Workspace title & Header */}
          <div className="border-b border-zinc-900 p-4 flex items-center justify-between bg-zinc-950/80">
            <div className="flex items-center gap-2">
              <FileCode size={16} className="text-zinc-300" />
              <h2 className="font-sans text-xs font-bold tracking-widest text-zinc-200 uppercase">
                ESPACE DE SCRIPT
              </h2>
            </div>
            
            {/* Quick manual file creation trigger */}
            <button
              onClick={() => setIsCreatingFile(!isCreatingFile)}
              className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-100 rounded-lg text-xs font-sans font-bold flex items-center gap-1.5 transition"
            >
              <Plus size={13} className="stroke-[2.5]" />
              Nouveau Fichier
            </button>
          </div>

          {/* New manual file inline builder form */}
          {isCreatingFile && (
            <motion.form 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleCreateNewFile}
              className="p-3 bg-zinc-950 border-b border-zinc-900 flex items-center gap-2"
            >
              <div className="flex-1">
                <input
                  type="text"
                  value={newFileNameInput}
                  onChange={(e) => setNewFileNameInput(e.target.value)}
                  placeholder="nom_du_script.py, config.sh, ..."
                  className="w-full bg-zinc-900/60 border border-zinc-850 text-xs text-zinc-200 font-sans rounded-lg p-2.5 focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-white text-black hover:bg-zinc-100 font-bold font-sans rounded-lg text-xs"
              >
                Créer
              </button>
              <button
                type="button"
                onClick={() => setIsCreatingFile(false)}
                className="p-2.5 bg-zinc-900 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-200 transition"
              >
                <X size={13} />
              </button>
            </motion.form>
          )}

          {/* Sidebar Split Screen: Files list & Editor view */}
          <div className="flex-1 flex flex-col md:grid md:grid-rows-2 h-full overflow-hidden">
            
            {/* Files collection list panel */}
            <div className="border-b border-zinc-900 p-4 overflow-y-auto max-h-60 md:max-h-none scrollbar-thin">
              <div className="font-sans text-[10px] font-bold text-zinc-500 mb-2.5 uppercase tracking-wider">
                Index des scripts disponibles ({files.length}) :
              </div>
              
              {files.length === 0 ? (
                <div className="text-center p-8 border border-dashed border-zinc-900 rounded-xl">
                  <AlertCircle size={22} className="mx-auto text-zinc-700 mb-2.5" />
                  <p className="font-sans text-xs text-zinc-500 font-semibold">Aucun fichier dans le Workspace.</p>
                  <p className="font-sans text-[10px] text-zinc-600 mt-1 max-w-xs mx-auto">L'IA en créera automatiquement ou utilisez "Nouveau Fichier".</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-2">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      onClick={() => setSelectedFileId(file.id)}
                      className={`group flex items-center justify-between p-3 rounded-xl cursor-pointer border transition-all duration-200 ${
                        selectedFileId === file.id
                          ? "bg-zinc-900 text-white border-zinc-700 shadow-md shadow-black/40"
                          : "bg-zinc-900/30 hover:bg-zinc-900/70 border-zinc-900/80 hover:border-zinc-800 text-zinc-400 hover:text-zinc-200"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <span className="flex-shrink-0">
                          {getFileIcon(file.name)}
                        </span>
                        <span className="font-sans text-xs truncate font-semibold">
                          {file.name}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadFile(file);
                          }}
                          className={`p-1.5 rounded-lg transition ${
                            selectedFileId === file.id 
                              ? "hover:bg-zinc-800 text-zinc-300 hover:text-white" 
                              : "hover:bg-zinc-800 text-zinc-500 hover:text-zinc-200"
                          }`}
                          title="Télécharger le fichier"
                        >
                          <Download size={13} />
                        </button>
                        <button
                          onClick={(e) => handleDeleteFile(file.id, e)}
                          className={`p-1.5 rounded-lg transition ${
                            selectedFileId === file.id 
                              ? "hover:bg-zinc-800 text-zinc-300 hover:text-red-400" 
                              : "hover:bg-zinc-800 text-zinc-500 hover:text-red-400"
                          }`}
                          title="Supprimer le fichier"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Live Monospace Code Editor Panel */}
            <div className="flex-1 flex flex-col bg-black overflow-hidden border-t border-zinc-900">
              {selectedFileId ? (
                <div className="flex-1 flex flex-col h-full overflow-hidden">
                  
                  {/* Editor Info Panel */}
                  <div className="flex items-center justify-between px-4 py-3 bg-zinc-950 border-b border-zinc-900">
                    <div className="flex items-center gap-2 font-mono text-xs text-zinc-300">
                      <Terminal size={12} className="text-zinc-500 animate-pulse" />
                      <input
                        type="text"
                        value={editorFileName}
                        onChange={(e) => {
                          setEditorFileName(e.target.value);
                          // Rename in main files array synchronously
                          setFiles(prev => prev.map(f => {
                            if (f.id === selectedFileId) {
                              return { ...f, name: e.target.value };
                            }
                            return f;
                          }));
                        }}
                        className="bg-transparent border-b border-transparent hover:border-zinc-800 focus:border-zinc-600 focus:outline-none text-white font-bold w-48 truncate transition duration-150"
                        title="Renommer le fichier"
                      />
                      <span className="text-[10px] text-zinc-400 px-2 py-0.5 bg-zinc-900 border border-zinc-800 rounded-md">
                        {editorFileLanguage}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 font-sans">
                      <button
                        onClick={handleSaveFile}
                        className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-lg text-xs font-bold text-zinc-200 flex items-center gap-1.5 transition"
                        title="Enregistrer les modifications"
                      >
                        <Save size={12} />
                        Enregistrer
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(editorContent);
                          triggerEditorFeedback("Code copié dans le presse-papiers !");
                        }}
                        className="p-2 hover:bg-zinc-900 rounded-lg text-zinc-400 hover:text-white transition"
                        title="Copier le code"
                      >
                        <Copy size={13} />
                      </button>
                      <button
                        onClick={() => {
                          const file = files.find(f => f.id === selectedFileId);
                          if (file) handleDownloadFile(file);
                        }}
                        className="p-2 hover:bg-zinc-900 rounded-lg text-zinc-400 hover:text-white transition"
                        title="Télécharger"
                      >
                        <Download size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Main editable textarea area */}
                  <div className="flex-1 flex overflow-hidden relative">
                    {/* Simulated gutter line numbers */}
                    <div className="w-10 bg-zinc-950 py-3 text-right pr-2.5 text-zinc-700 font-mono text-xs select-none border-r border-zinc-900/80 leading-relaxed">
                      {Array.from({ length: Math.max(1, editorContent.split("\n").length) }).map((_, i) => (
                        <div key={i}>{i + 1}</div>
                      ))}
                    </div>

                    {/* Actual editor textarea */}
                    <textarea
                      value={editorContent}
                      onChange={(e) => {
                        setEditorContent(e.target.value);
                        // Save to live memory state on keypress
                        setFiles(prev => prev.map(f => {
                          if (f.id === selectedFileId) {
                            return { ...f, content: e.target.value };
                          }
                          return f;
                        }));
                      }}
                      className="flex-1 bg-zinc-950/25 text-zinc-100 p-3 font-mono text-xs focus:outline-none resize-none overflow-y-auto leading-relaxed"
                      placeholder="# Remplissez ou écrivez votre code de cybersécurité ici..."
                      spellCheck={false}
                    />
                  </div>

                  {/* Editor status footer */}
                  <div className="bg-zinc-950 px-4 py-2 border-t border-zinc-900 text-[10px] font-sans font-medium text-zinc-500 flex justify-between items-center select-none">
                    <span>Modifiable en temps réel • {editorContent.length} caractères</span>
                    <span>Phantom Security Workspace</span>
                  </div>

                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-zinc-500 font-sans">
                  <Terminal size={26} className="text-zinc-800 mb-3 animate-pulse" />
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">ÉDITEUR PHANTOM INACTIF</p>
                  <p className="text-[11px] text-zinc-600 mt-1.5 max-w-xs leading-relaxed">
                    Sélectionnez un fichier ci-dessus ou demandez à Phantom AI d'écrire un script pour commencer.
                  </p>
                </div>
              )}
            </div>

          </div>

        </section>

      </div>
    </div>
  );
}
