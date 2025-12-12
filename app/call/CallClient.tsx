'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { db } from '../../firebase/firebase'
import { ref, set, onValue, push, onDisconnect, update, get, remove, off, onChildAdded, serverTimestamp } from 'firebase/database'
import UserSearch from '../components/UserSearch'
import AIAssistant from '../components/AIAssistant'
import QRCode from 'react-qr-code'

// --- إعدادات Cloudinary ---
const CLOUD_NAME = "dofsnaled"; 
const UPLOAD_PRESET = "face22"; 

// --- الأيقونات ---
const Icons = {
  MicOn: () => ( <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg> ),
  MicOff: () => ( <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="1" y1="1" x2="23" y2="23"></line><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg> ),
  CamOn: () => ( <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 7l-7 5 7 5V7z"></path><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg> ),
  CamOff: () => ( <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 16v1a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2m5.66 0H14a2 2 0 0 1 2 2v3.34l1 1L23 7v10"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg> ),
  Hangup: () => ( <svg width="32" height="32" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="0" strokeLinecap="round" strokeLinejoin="round"><path d="M10.68 13.31a16 16 0 0 0 3.41 2.6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7 2 2 0 0 1 1.72 2v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.42 19.42 0 0 1-3.33-2.67m-2.67-3.34a19.79 19.79 0 0 1-3.07-8.63A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91" transform="rotate(135 12 12)"/></svg> ),
  Switch: () => ( <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 4h-3.17L15 2H9L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/><path d="M0 0h24v24H0z" fill="none"/></svg> ),
  Heart: () => ( <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg> ),
  Chat: () => ( <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg> ),
  Send: () => ( <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg> ),
  Security: () => ( <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg> ),
  Back: () => ( <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg> ),
  Warning: () => ( <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> ),
  Moon: () => ( <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg> ),
  Sun: () => ( <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg> ),
  Check: () => ( <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> ),
  DoubleCheck: () => ( <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L7 17l-5-5"></path><path d="M22 10l-7.5 7.5L13 16"></path></svg> ),
  Clip: () => ( <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg> ),
  MicRecord: () => ( <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg> ),
  StopRecord: () => ( <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="6" y="6" width="12" height="12"></rect></svg> ),
  SendAudio: () => ( <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg> ),
  Clock: () => ( <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg> ),
  Gamepad: () => ( <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="6" y1="12" x2="10" y2="12"></line><line x1="8" y1="10" x2="8" y2="14"></line><line x1="15" y1="13" x2="15.01" y2="13"></line><line x1="18" y1="11" x2="18.01" y2="11"></line><rect x="2" y="6" width="20" height="12" rx="2"></rect></svg> ),
  MagicWand: () => ( <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><path d="M10 13l-2-2"></path><path d="M8 15l2-2"></path></svg> ),
  Lock: () => ( <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg> ),
  Unlock: () => ( <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 9.9-1"></path></svg> ),
  Tools: () => ( <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg> ),
  Hand: () => ( <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"></path><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"></path><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"></path><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"></path></svg> ),
  Download: () => ( <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> ),
  PiP: () => ( <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="12" rx="2" ry="2"></rect><rect x="12" y="10" width="8" height="6" rx="1"></rect></svg> ),
  Bell: () => ( <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg> ),
  Settings: () => ( <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg> ),
  VideoQuality: () => ( <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h20"></path><path d="M2 5h20"></path><path d="M2 19h20"></path><circle cx="12" cy="12" r="3"></circle></svg> ),
  ScreenShare: () => ( <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg> )
};

const servers = {
  iceServers: [
    { urls: "turn:openrelay.metered.ca:443?transport=tcp", username: "openrelayproject", credential: "openrelayproject" },
    { urls: "turn:openrelay.metered.ca:80", username: "openrelayproject", credential: "openrelayproject" },
    { urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'] }
  ],
  iceCandidatePoolSize: 10,
  iceTransportPolicy: 'all' as RTCIceTransportPolicy,
  bundlePolicy: 'max-bundle' as RTCBundlePolicy,
  rtcpMuxPolicy: 'require' as RTCRtcpMuxPolicy
};

const ROMANTIC_EMOJIS = ['🙈', '🥰', '💍', '🦋', '🧸', '🌹', '😽', '🔥', '🍫', '💌', '💟', '✨', '🍯', '🥺'];

interface CallLog { id: string; name: string; avatar: string; time: string; type: 'incoming' | 'outgoing' | 'missed' | 'rejected' | 'canceled'; duration?: string; }
interface ChatMessage { id: string; senderId: string; text: string; timestamp: number; seen?: boolean; type?: 'text' | 'image' | 'audio'; }
interface PendingMessage { type: 'image' | 'audio'; content: string; }

export default function CallClient() {
  const [myId, setMyId] = useState('');
  const [username, setUsername] = useState('');
  const [myAvatar, setMyAvatar] = useState('👤');
  const [callStatus, setCallStatus] = useState<'IDLE' | 'CALLING' | 'CONNECTED' | 'INCOMING'>('IDLE');
  const [callType, setCallType] = useState<'video' | 'audio'>('video');

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [incomingCallInfo, setIncomingCallInfo] = useState<any>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  
  // ✅ 1. حالة الجودة ومشاركة الشاشة
  const [videoQuality, setVideoQuality] = useState<'low' | 'medium' | 'high'>('low');
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const [isMobile, setIsMobile] = useState(false);
  const [isDoNotDisturb, setIsDoNotDisturb] = useState(false);
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCamOn, setIsCamOn] = useState(true);
  const [isVideoPaused, setIsVideoPaused] = useState(false);
  const [isScreenLocked, setIsScreenLocked] = useState(false);
  
  const [netQuality, setNetQuality] = useState<0|1|2|3|4>(4);
  const [isSwapped, setIsSwapped] = useState(false);

  const [showShareOptions, setShowShareOptions] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [invitedUser, setInvitedUser] = useState<any>(null);
  
  const [customNotify, setCustomNotify] = useState<{ title: string; msg: string; img?: string; type?: 'success' | 'error' | 'info' } | null>(null);
  
  const [callHistory, setCallHistory] = useState<CallLog[]>([]);
  const [hearts, setHearts] = useState<{ id: number, left: number }[]>([]); 
  const [callingTargetId, setCallingTargetId] = useState<string | null>(null);

  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const dialingTimeoutRef = useRef<NodeJS.Timeout | null>(null); 

  const [activeChatTarget, setActiveChatTarget] = useState<any | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [rewardEmoji, setRewardEmoji] = useState<string | null>(null);
  const [isDissolving, setIsDissolving] = useState(false);
  const [showExitWarning, setShowExitWarning] = useState(false);
  const [showLogoutWarning, setShowLogoutWarning] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pendingMsg, setPendingMsg] = useState<PendingMessage | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // --- XO Game States ---
  const [showGameModal, setShowGameModal] = useState(false);
  const [gameBoard, setGameBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [gameWinner, setGameWinner] = useState<string | null>(null);
  const [myGameRole, setMyGameRole] = useState<'X' | 'O' | null>(null);

  // --- Voice Changer & Tools Menu States ---
  const [voiceEffect, setVoiceEffect] = useState<'normal' | 'squeaky' | 'monster'>('normal');
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false); 
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const destinationNodeRef = useRef<MediaStreamAudioDestinationNode | null>(null);

  const [toolsBtnPos, setToolsBtnPos] = useState({ x: 20, y: 120 });
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const remoteAudioRef = useRef<HTMLAudioElement>(null); 
  
  const pipCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const pipVideoRef = useRef<HTMLVideoElement | null>(null);
  const pipAnimationRef = useRef<number | null>(null);

  const [unreadCounts, setUnreadCounts] = useState<{[key: string]: number}>({});
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const activeChatTargetRef = useRef<any>(null);
  const heartComboRef = useRef(0);
  const comboTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const qualityIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousUnreadCountsRef = useRef<{[key: string]: number}>({});
  const serviceWorkerReg = useRef<ServiceWorkerRegistration | null>(null);
  
  // ✅ مرجع لحفظ بيانات "الطرف الآخر" (سواء كنت أنا المتصل أو المستقبل)
  const outgoingCallInfoRef = useRef<{name: string, avatar: string} | null>(null);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const pc = useRef<RTCPeerConnection | null>(null);
  const dataChannel = useRef<RTCDataChannel | null>(null);
  const currentPeerId = useRef<string | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  const activeCallUnsubscribeRef = useRef<(() => void) | null>(null);
  const answerCandidatesUnsubscribeRef = useRef<(() => void) | null>(null);
  const chatUnsubscribeRef = useRef<(() => void) | null>(null);
  
  const callStatusRef = useRef(callStatus);
  const isBusyRef = useRef(isDoNotDisturb);
  const blockedUsersRef = useRef(blockedUsers);

  const router = useRouter();
  const searchParams = useSearchParams();
  const APP_URL = 'https://face2-three.vercel.app';

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').then(reg => {
        serviceWorkerReg.current = reg;
      });
    }

    const checkMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    setIsMobile(checkMobile);
    const savedTheme = localStorage.getItem('face2_theme') as 'dark' | 'light';
    if (savedTheme) setTheme(savedTheme);
    const savedHistory = localStorage.getItem('face2_history');
    if (savedHistory) setCallHistory(JSON.parse(savedHistory));

    if (typeof window !== 'undefined') {
        setToolsBtnPos({ x: window.innerWidth - 70, y: 120 });
    }
  }, []);

  const clearAllNotifications = () => {
    if (serviceWorkerReg.current) {
        serviceWorkerReg.current.getNotifications({ tag: 'face2-notification' }).then(notifications => {
            notifications.forEach(n => n.close());
        });
    }
  };

  useEffect(() => {
      const handleVisibilityChange = () => {
          if (document.visibilityState === 'visible') {
              clearAllNotifications();
              setTimeout(clearAllNotifications, 1000);
          }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);
      clearAllNotifications(); 
      return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // ✅ دالة إرسال الإشعارات المتوافقة مع PWA
  const sendSystemNotification = async (title: string, body: string, icon: string = 'https://face2-three.vercel.app/icon.png') => {
      if (!("Notification" in window)) return;

      if (Notification.permission === "granted") {
          // A. المحاولة عبر Service Worker (الطريقة الأفضل للـ PWA وأندرويد)
          if ('serviceWorker' in navigator) {
              try {
                  const registration = await navigator.serviceWorker.ready;
                  await registration.showNotification(title, {
                      body: body,
                      icon: icon,
                      badge: 'https://face2-three.vercel.app/icon.png',
                      vibrate: [200, 100, 200],
                      tag: 'face2-call', 
                      renotify: true,
                      requireInteraction: true,
                      data: { url: window.location.href }
                  });
                  return; 
              } catch (e) {
                  console.log("Service Worker notification failed, trying fallback...");
              }
          }

          // B. الخطة البديلة
          try {
              new Notification(title, { body: body, icon: icon });
          } catch (e) { console.error("Notification failed completely", e); }
      }
  };

  const requestNotificationPermission = () => {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        showToast("✅ تم تفعيل الإشعارات!", "تنبيه", "success");
        sendSystemNotification("Face2", "تجربة الإشعارات بنجاح!");
      } else {
        showToast("❌ تم رفض الإذن", "تنبيه", "error");
      }
    });
  };

  useEffect(() => {
      const handleVisibilityChange = async () => {
          if (document.visibilityState === 'hidden' && callStatus === 'CONNECTED') {
              if ('mediaSession' in navigator) {
                  navigator.mediaSession.metadata = new MediaMetadata({
                      title: incomingCallInfo?.callerName || "Face2 Call",
                      artist: callType === 'video' ? "Video Call" : "Audio Call",
                      artwork: [{ src: "https://face2-three.vercel.app/icon.png", sizes: "96x96", type: "image/png" }]
                  });
                  navigator.mediaSession.setActionHandler('play', () => {});
                  navigator.mediaSession.setActionHandler('pause', () => {});
              }

              try {
                  if (callType === 'video' && remoteVideoRef.current && !document.pictureInPictureElement) {
                      await remoteVideoRef.current.requestPictureInPicture();
                  } else if (callType === 'audio') {
                      startFakePiPStream();
                  }
              } catch (e) { console.log('Auto PiP blocked by browser'); }
          }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [callStatus, callType, incomingCallInfo]);

  const stopLocalMedia = () => {
    if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
            track.stop();
            track.enabled = false;
        });
        localStreamRef.current = null;
    }
    setLocalStream(null);
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (audioContextRef.current) { audioContextRef.current.close(); audioContextRef.current = null; }
    if (pipAnimationRef.current) cancelAnimationFrame(pipAnimationRef.current);
    
    clearAllNotifications();
  };

  const toggleTheme = () => {
      const newTheme = theme === 'dark' ? 'light' : 'dark';
      setTheme(newTheme);
      localStorage.setItem('face2_theme', newTheme);
  };

  const themeColors = {
      bg: theme === 'dark' ? '#111827' : '#f1f5f9',
      text: theme === 'dark' ? 'white' : '#1e293b',
      cardBg: theme === 'dark' ? '#1e293b' : 'white',
      subText: theme === 'dark' ? '#94a3b8' : '#64748b',
      border: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
  };

  const formatDuration = (ms: number) => {
      const totalSeconds = Math.floor(ms / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const resetControlsVisibility = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => { if (callStatusRef.current === 'CONNECTED') setShowControls(false); }, 4000);
  };

  const showToast = (msg: string, title: string = "تنبيه", type: 'success' | 'error' | 'info' = 'info', img: string = "") => {
    setCustomNotify({ title, msg, img, type });
    if (navigator.vibrate) navigator.vibrate(200);
    setTimeout(() => setCustomNotify(null), 4000);
  };
  
  const getChatId = (uid1: string, uid2: string) => [uid1, uid2].sort().join('_');
  
  const triggerRewardAnimation = (emoji: string) => { 
      setRewardEmoji(emoji); 
      setTimeout(() => setRewardEmoji(null), 4000); 
  };
  
  const triggerHeartAnimation = () => { const id = Date.now() + Math.random(); const left = Math.random() * 90 + 5; setHearts(prev => [...prev, { id, left }]); setTimeout(() => setHearts(prev => prev.filter(h => h.id !== id)), 4000); };
  const toggleBlockUser = (id: string) => { setBlockedUsers(prev => { const newList = prev.includes(id) ? prev.filter(uid => uid !== id) : [...prev, id]; localStorage.setItem('face2_blocked', JSON.stringify(newList)); return newList; }); };

  const addToRecents = (userId: string) => {
    if (!userId) return;
    const stored = localStorage.getItem('face2_recents');
    let recents: string[] = stored ? JSON.parse(stored) : [];
    recents = recents.filter(id => id !== userId);
    recents.unshift(userId);
    if (recents.length > 20) recents = recents.slice(0, 20);
    localStorage.setItem('face2_recents', JSON.stringify(recents));
  };

  const manualPlay = () => { 
      if (remoteVideoRef.current) remoteVideoRef.current.play().catch(()=>{});
      if (remoteAudioRef.current) remoteAudioRef.current.play().catch(()=>{}); 
      setIsVideoPaused(false);
  };

  // --- Voice Changer Logic ---
  const applyVoiceEffect = async (effect: 'normal' | 'squeaky' | 'monster') => {
    if (!localStreamRef.current || !pc.current) return;
    setVoiceEffect(effect);
    setShowVoiceModal(false);
    setShowToolsMenu(false); 
    showToast(`🎤 الصوت: ${effect === 'normal' ? 'عادي' : (effect === 'squeaky' ? 'سنجاب (طفل)' : 'وحش')}`, "تغيير الصوت", "success");

    const sender = pc.current.getSenders().find(s => s.track?.kind === 'audio');
    
    if (effect === 'normal') {
        const originalTrack = localStreamRef.current.getAudioTracks()[0];
        if (sender && originalTrack) sender.replaceTrack(originalTrack);
        return;
    }

    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioContextRef.current = ctx;
    const source = ctx.createMediaStreamSource(localStreamRef.current);
    const destination = ctx.createMediaStreamDestination();
    
    if (effect === 'squeaky') {
        const filter = ctx.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 1000;
        
        const peaking = ctx.createBiquadFilter();
        peaking.type = 'peaking';
        peaking.frequency.value = 2500;
        peaking.gain.value = 15;

        source.connect(filter).connect(peaking).connect(destination);
    } 
    else if (effect === 'monster') {
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 400;
        
        const osc = ctx.createOscillator();
        osc.frequency.value = 30;
        const gainOsc = ctx.createGain();
        gainOsc.gain.value = 0.5;
        osc.connect(gainOsc.gain);
        osc.start();

        source.connect(filter).connect(gainOsc).connect(destination);
    }

    sourceNodeRef.current = source;
    destinationNodeRef.current = destination;

    const processedTrack = destination.stream.getAudioTracks()[0];
    if (sender) {
        sender.replaceTrack(processedTrack);
    }
  };

  const startFakePiPStream = async () => {
      const canvas = pipCanvasRef.current;
      const video = pipVideoRef.current;
      if (!canvas || !video) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      if (pipAnimationRef.current) cancelAnimationFrame(pipAnimationRef.current);

      const draw = () => {
          ctx.fillStyle = '#1f2937'; 
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          ctx.beginPath();
          ctx.arc(canvas.width/2, canvas.height/2, 100, 0, 2 * Math.PI);
          ctx.fillStyle = '#374151';
          ctx.fill();
          
          ctx.font = '80px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = 'white';
          ctx.fillText(incomingCallInfo?.callerAvatar || '👤', canvas.width/2, canvas.height/2);

          const time = new Date().toLocaleTimeString();
          ctx.font = '20px Arial';
          ctx.fillStyle = '#10b981';
          ctx.fillText(time, canvas.width/2, canvas.height - 50);

          pipAnimationRef.current = requestAnimationFrame(draw);
      };
      
      draw();

      const stream = canvas.captureStream(30); 
      if (video.srcObject !== stream) {
          video.srcObject = stream;
          try {
              await video.play();
          } catch(e) {}
      }
  };

  const togglePiP = async () => {
      try {
          if (document.pictureInPictureElement) {
              await document.exitPictureInPicture();
          } else {
              if (callType === 'video' && remoteVideoRef.current && remoteVideoRef.current.readyState !== 0) {
                  await remoteVideoRef.current.requestPictureInPicture();
              } 
              else if (callType === 'audio') {
                  await startFakePiPStream();
                  if (pipVideoRef.current) await pipVideoRef.current.requestPictureInPicture();
              }
          }
      } catch (error) {
          showToast("❌ الميزة غير مدعومة", "خطأ", "error");
      }
      setShowToolsMenu(false);
  };

  // ✅ 2. مشاركة الشاشة (مع إصلاح الأندرويد)
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      stopScreenShare();
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        showToast("⚠️ المتصفح لا يدعم مشاركة الشاشة", "غير مدعوم", "error");
        return;
    }

    try {
      // استخدام إعدادات بسيطة لدعم الأندرويد
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true, 
        audio: false 
      });

      const screenTrack = screenStream.getVideoTracks()[0];

      if (pc.current) {
          const videoSender = pc.current.getSenders().find((sender) => sender.track && sender.track.kind === "video");
          if (videoSender) {
            videoSender.replaceTrack(screenTrack);
          }
      }

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = screenStream;
      }

      screenTrack.onended = () => {
        stopScreenShare();
      };

      setIsScreenSharing(true);
      setShowToolsMenu(false); 

    } catch (error: any) {
      console.error("Screen share error:", error);
      if (error.name === 'NotAllowedError') {
          showToast("❌ تم رفض الإذن من قبلك", "تنبيه", "info");
      } else {
          showToast("❌ تعذر بدء المشاركة (قد لا يدعمها هاتفك)", "خطأ", "error");
      }
    }
  };

  const stopScreenShare = () => {
    if (!localStreamRef.current) return;
    
    const cameraTrack = localStreamRef.current.getVideoTracks()[0];
    
    if (pc.current) {
        const videoSender = pc.current.getSenders().find((sender) => sender.track && sender.track.kind === "video");
        if (videoSender) {
            videoSender.replaceTrack(cameraTrack);
        }
    }

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }

    setIsScreenSharing(false);
  };

  // --- XO Game Logic ---
  const checkWinner = (squares: any[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  };

  const sendNudge = () => {
      if (dataChannel.current?.readyState === 'open') {
          dataChannel.current.send(JSON.stringify({ type: 'GAME_NUDGE' }));
          showToast("🔔 تم إرسال التنبيه!", "لعبة XO", "success");
      }
  };

  const handleGameMove = (index: number) => {
    if (gameBoard[index] || gameWinner) return;
    
    const isFirstMove = gameBoard.every(sq => sq === null);
    if (!isFirstMove) {
        if (myGameRole === 'X' && !isXNext) { showToast("انتظر دورك ✋", "لعبة XO", "error"); return; }
        if (myGameRole === 'O' && isXNext) { showToast("انتظر دورك ✋", "لعبة XO", "error"); return; }
    }

    const newBoard = [...gameBoard];
    const symbol = isFirstMove ? myGameRole : (isXNext ? 'X' : 'O'); 
    newBoard[index] = symbol;
    
    setGameBoard(newBoard);
    
    setIsXNext(symbol === 'X' ? false : true);
    
    const winner = checkWinner(newBoard);
    if (winner) setGameWinner(winner);

    if (dataChannel.current?.readyState === 'open') {
      dataChannel.current.send(JSON.stringify({
        type: 'GAME_MOVE',
        board: newBoard,
        nextTurn: symbol === 'X' ? false : true, 
        winner: winner
      }));
    }
  };

  const resetGame = () => {
    setGameBoard(Array(9).fill(null));
    setGameWinner(null);
    setIsXNext(true);
    if (dataChannel.current?.readyState === 'open') {
      dataChannel.current.send(JSON.stringify({ type: 'GAME_RESET' }));
    }
  };

  const handleDrag = (e: any, setPos: any) => {
      e.preventDefault(); 
      const touch = e.touches[0];
      setPos({ x: touch.clientX - 25, y: touch.clientY - 25 });
  };

  const handleDownloadImage = async (url: string) => {
      try {
          const response = await fetch(url);
          const blob = await response.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = blobUrl;
          link.download = `face2_received_${Date.now()}.jpg`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(blobUrl);
      } catch (error) {
          window.open(url, '_blank');
      }
  };

  const monitorConnection = () => {
    if (!pc.current) return;
    if (qualityIntervalRef.current) clearInterval(qualityIntervalRef.current);
    qualityIntervalRef.current = setInterval(async () => {
        if (!pc.current || pc.current.connectionState !== 'connected') return;
        try {
            const stats = await pc.current.getStats();
            let rtt = 0;
            stats.forEach(report => { if (report.type === 'candidate-pair' && report.state === 'succeeded') { rtt = report.currentRoundTripTime * 1000; } });
            if (rtt === 0) setNetQuality(4); else if (rtt < 200) setNetQuality(4); else if (rtt < 500) setNetQuality(3); else if (rtt < 1000) setNetQuality(2); else { setNetQuality(1); showToast("⚠️ الشبكة ضعيفة", "اتصال", "error"); }
        } catch (e) { console.log("Stats error", e); }
    }, 2000);
  };

  // ✅ 3. وظيفة تغيير الجودة (جديدة ومحسنة)
  const changeVideoQuality = async () => {
      if(!localStreamRef.current) return;
      const nextQuality = videoQuality === 'low' ? 'medium' : videoQuality === 'medium' ? 'high' : 'low';
      setVideoQuality(nextQuality);
      
      const stream = await startWebcam(callType, facingMode, nextQuality);
      if(stream && pc.current) {
          const videoTrack = stream.getVideoTracks()[0];
          const sender = pc.current.getSenders().find(s => s.track?.kind === 'video');
          if(sender && videoTrack) {
              sender.replaceTrack(videoTrack);
          }
      }
      showToast(`تم تغيير الجودة إلى: ${nextQuality === 'low' ? 'منخفضة (توفير)' : nextQuality === 'medium' ? 'متوسطة' : 'عالية (HD)'}`, "الجودة", "success");
      setShowToolsMenu(false); // إغلاق القائمة بعد الاختيار
  };

  // ✅ 4. تحديث startWebcam لدعم الجودة المتغيرة
  const startWebcam = async (type: 'video' | 'audio' = 'video', mode: 'user' | 'environment' = 'user', quality: 'low'|'medium'|'high' = videoQuality) => {
    try {
        stopLocalMedia();
        let width, height, fps;
        
        // إعدادات الدقة لتقليل استهلاك البيانات
        if (quality === 'low') { width = 320; height = 240; fps = 15; }
        else if (quality === 'medium') { width = 640; height = 480; fps = 24; }
        else { width = 1280; height = 720; fps = 30; }

        const videoConstraints = {
            facingMode: mode,
            width: { ideal: width },
            height: { ideal: height }, 
            frameRate: { ideal: fps }
        };

        const constraints: any = { 
            audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }, 
            video: type === 'video' ? videoConstraints : false 
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints); 
        localStreamRef.current = stream; 
        setLocalStream(stream); 
        setIsMicOn(true); 
        setIsCamOn(type === 'video'); 
        return stream;
    } catch (err) { alert("لا يمكن الوصول للكاميرا/الميكروفون."); return null; }
  };

  // ✅ 5. تحديث hangUp لتسجيل جميع الحالات (الرفض، الإلغاء، النجاح)
  const hangUp = async () => {
      const targetId = callingTargetId || currentPeerId.current;
      
      // منطق السجل الشامل
      let durationStr = '';
      let logType: 'outgoing' | 'incoming' | 'rejected' | 'canceled' = 'outgoing';

      // 1. حالة مكالمة ناجحة انتهت
      if (startTime) {
          const durationMs = Date.now() - startTime;
          durationStr = formatDuration(durationMs);
          // إذا كان لدي callingTargetId فأنا المتصل، وإلا فأنا المستقبل
          logType = callingTargetId ? 'outgoing' : 'incoming';
      } else {
          // 2. حالة مكالمة لم تبدأ (رفض أو إلغاء)
          if (callStatusRef.current === 'INCOMING') {
              // أنا المستقبل وقمت بالضغط على زر الرفض الأحمر
              durationStr = 'مكالمة واردة (مرفوضة) 🚫';
              logType = 'rejected';
          } else if (callStatusRef.current === 'CALLING') {
              // أنا المتصل وقمت بالضغط على زر الإلغاء
              durationStr = 'تم الإلغاء 🚫';
              logType = 'canceled';
          }
      }

      // حفظ السجل إذا كانت هناك بيانات
      const infoToLog = outgoingCallInfoRef.current || incomingCallInfo; // نستخدم أي معلومات متاحة
      
      if (infoToLog && infoToLog.name) {
          const log: CallLog = {
              id: Date.now().toString(),
              name: infoToLog.name || (infoToLog.callerName),
              avatar: infoToLog.avatar || (infoToLog.callerAvatar),
              time: new Date().toLocaleTimeString('ar-EG'),
              type: logType,
              duration: durationStr 
          };
          
          setCallHistory(prev => {
               const updated = [log, ...prev];
               localStorage.setItem('face2_history', JSON.stringify(updated));
               return updated;
          });
      }
      
      // تفريغ المراجع
      outgoingCallInfoRef.current = null;

      // 2. تنظيف المؤقتات والاشتراكات
      if (qualityIntervalRef.current) clearInterval(qualityIntervalRef.current);
      if (activeCallUnsubscribeRef.current) { activeCallUnsubscribeRef.current(); activeCallUnsubscribeRef.current = null; }
      if (answerCandidatesUnsubscribeRef.current) { answerCandidatesUnsubscribeRef.current(); answerCandidatesUnsubscribeRef.current = null; }
      if (dialingTimeoutRef.current) clearTimeout(dialingTimeoutRef.current);

      // 3. إيقاف الميديا
      stopLocalMedia();
      setRemoteStream(null); 
      if (remoteVideoRef.current) { remoteVideoRef.current.srcObject = null; remoteVideoRef.current.load(); }
      if (remoteAudioRef.current) { remoteAudioRef.current.srcObject = null; } 

      try { if (dataChannel.current?.readyState === 'open') dataChannel.current.send('BYE'); } catch(e){}
      if (pc.current) { pc.current.close(); pc.current = null; }

      // 4. تحديث الواجهة محلياً
      setCallStatus('IDLE');
      setIncomingCallInfo(null);
      setCallingTargetId(null);
      setStartTime(null);
      currentPeerId.current = null;
      
      // إخفاء النوافذ الأخرى
      setShowGameModal(false);
      setMyGameRole(null);
      setShowVoiceModal(false);
      setShowToolsMenu(false);
      clearAllNotifications(); 
      setIsScreenSharing(false); // ✅ إيقاف حالة المشاركة

      // 5. التعامل مع قاعدة البيانات
      if (targetId) {
            const targetRef = ref(db, `calls/${targetId}`);
            // إذا كنت أنا المستقبل (INCOMING) وضغطت رفض، أرسل rejected_declined
            // إذا كنت أنا المتصل (CALLING) وضغطت إلغاء، أرسل canceled
            if (callStatusRef.current === 'INCOMING') {
                 await update(targetRef, { status: 'rejected_declined' });
            } else {
                 await update(targetRef, { status: 'canceled' }); 
            }
            setTimeout(() => { remove(targetRef); }, 2000); 
      }
      
      if(myId) {
            update(ref(db, `calls/${myId}`), { status: 'ended' });
            setTimeout(() => { remove(ref(db, `calls/${myId}`)); }, 1000);
      }

      setIsVideoPaused(false); 
      setIsMicOn(true); 
      setIsCamOn(true); 
      setShowControls(true); 
      setChatMessages([]); 
      setIsSwapped(false); 
      setIsScreenLocked(false);
  };

  const setupDataChannel = (channel: RTCDataChannel) => { 
      dataChannel.current = channel; 
      channel.onmessage = (event) => { 
          const msg = event.data; 
          try {
            const data = JSON.parse(msg);
            if (data.type === 'GAME_MOVE') {
                setGameBoard(data.board);
                setIsXNext(data.nextTurn);
                if (data.winner) setGameWinner(data.winner);
                setShowGameModal(true);
                if(!showGameModal) showToast("🎮 الطرف الآخر بدأ اللعب!", "XO", "info");
            }
            if (data.type === 'GAME_RESET') {
                setGameBoard(Array(9).fill(null));
                setGameWinner(null);
                setIsXNext(true);
                showToast("🔄 تم إعادة اللعبة!", "XO", "success");
            }
            if (data.type === 'GAME_NUDGE') {
                showToast("🔔 صديقك ينبهك: العب دورك!", "XO", "info");
                sendSystemNotification("🔔 نكزة!", "صديقك ينبهك للعب دورك");
                if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
            }
          } catch (e) {
            if (msg === 'HEART') {
                triggerHeartAnimation();
                sendSystemNotification("❤️ حب!", "صديقك أرسل لك قلباً");
            } 
            else if (msg === 'BYE') hangUp(); 
            else if (msg.startsWith('REWARD:')) { triggerRewardAnimation(msg.substring(7)); } 
          }
      }; 
  };
  
  const createPeerConnection = (stream: MediaStream, isCaller: boolean) => { 
      if (pc.current) pc.current.close(); 
      const connection = new RTCPeerConnection(servers); 
      stream.getTracks().forEach(t => connection.addTrack(t, stream)); 
      
      connection.ontrack = (e) => { 
          if (e.streams && e.streams[0]) { 
              setRemoteStream(e.streams[0]); 
              if (remoteVideoRef.current && remoteVideoRef.current.srcObject !== e.streams[0]) { 
                  remoteVideoRef.current.srcObject = e.streams[0]; 
                  remoteVideoRef.current.play().catch(e => console.log("Force play error:", e)); 
              }
              if (remoteAudioRef.current && remoteAudioRef.current.srcObject !== e.streams[0]) {
                  remoteAudioRef.current.srcObject = e.streams[0];
                  remoteAudioRef.current.play().catch(e => console.log("Audio play error:", e));
                  
                  // ✅ تعيين وقت البدء عند وصول الوسائط (للرد)
                  if (!isCaller && !startTime) {
                      setStartTime(Date.now());
                  }
              }
          } 
      }; 
      
      if (isCaller) { 
          const channel = connection.createDataChannel("chat"); 
          setupDataChannel(channel); 
      } else { 
          connection.ondatachannel = (event) => setupDataChannel(event.channel); 
      } 
      
      connection.oniceconnectionstatechange = () => { 
          if (['failed', 'disconnected', 'closed'].includes(connection.iceConnectionState)) { 
             // مراقبة الاتصال دون قطع فوري
          } 
      }; 
      return connection; 
  };

  const openChat = (targetUser: any) => { setActiveChatTarget(targetUser); setChatMessages([]); setIsDissolving(false); setUnreadCounts(prev => ({ ...prev, [targetUser.id]: 0 })); const chatId = getChatId(myId, targetUser.id); const chatRef = ref(db, `chats/${chatId}`); const unsub = onValue(chatRef, (snapshot) => { const data = snapshot.val(); if (data) { const msgs = Object.keys(data).map(key => ({ id: key, ...data[key] })); setChatMessages(msgs); } else { if (activeChatTargetRef.current && activeChatTargetRef.current.id === targetUser.id) { setIsDissolving(true); setTimeout(() => { setChatMessages([]); setIsDissolving(false); }, 1200); } } }); chatUnsubscribeRef.current = () => off(chatRef); };
  const handleCloseChatRequest = () => { if (chatMessages.length > 0) { setShowExitWarning(true); } else { confirmCloseChat(); } };
  
  const stopMicrophone = () => {
      if (audioStreamRef.current) {
          audioStreamRef.current.getTracks().forEach(track => track.stop());
          audioStreamRef.current = null;
      }
  };

  const confirmCloseChat = () => { 
      setIsUploading(false);
      setPendingMsg(null);
      stopMicrophone();
      setIsRecording(false);
      if (activeChatTarget && myId) { 
          const chatId = getChatId(myId, activeChatTarget.id); 
          remove(ref(db, `chats/${chatId}`)); 
          setActiveChatTarget(null); 
          setChatMessages([]); 
          setIsDissolving(false); 
          setShowExitWarning(false); 
          if (chatUnsubscribeRef.current) chatUnsubscribeRef.current(); 
      } else { 
          setActiveChatTarget(null); 
          setShowExitWarning(false); 
      } 
  };
  
  const sendMessage = async (text: string, type: 'text' | 'image' | 'audio' = 'text') => { if (!activeChatTarget) return; const chatId = getChatId(myId, activeChatTarget.id); await push(ref(db, `chats/${chatId}`), { text, senderId: myId, timestamp: Date.now(), seen: false, type }); setChatInput(''); };

  const uploadToCloudinary = (file: Blob, type: 'image' | 'video' | 'raw' | 'auto'): Promise<string> => {
    return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', UPLOAD_PRESET);
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`);
        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const percent = Math.round((event.loaded / event.total) * 100);
                setUploadProgress(percent);
            }
        };
        xhr.onload = () => {
            if (xhr.status === 200) {
                const data = JSON.parse(xhr.responseText);
                resolve(data.secure_url);
            } else {
                reject('Upload failed');
            }
        };
        xhr.onerror = () => reject('Upload error');
        xhr.send(formData);
    });
  };

  const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
        const img = document.createElement('img');
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            img.src = e.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) return reject();
                const MAX_WIDTH = 800;
                const scaleSize = MAX_WIDTH / img.width;
                canvas.width = MAX_WIDTH;
                canvas.height = img.height * scaleSize;
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                canvas.toBlob((blob) => { if (blob) resolve(blob); else reject(); }, 'image/jpeg', 0.7);
            }
        };
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0] && activeChatTarget) {
          const file = e.target.files[0];
          const tempUrl = URL.createObjectURL(file);
          setPendingMsg({ type: 'image', content: tempUrl });
          setIsUploading(true);
          setUploadProgress(0);
          try {
              const compressedBlob = await compressImage(file);
              const url = await uploadToCloudinary(compressedBlob, 'image');
              await sendMessage(url, 'image');
          } catch (error) { showToast('❌ فشل رفع الصورة', "خطأ", "error"); }
          setPendingMsg(null);
          setIsUploading(false);
      }
  };

  const toggleRecording = async () => {
      if (isRecording) {
          mediaRecorderRef.current?.stop();
          setIsRecording(false);
      } else {
          try {
              const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
              audioStreamRef.current = stream;
              const mediaRecorder = new MediaRecorder(stream);
              mediaRecorderRef.current = mediaRecorder;
              const audioChunks: Blob[] = [];
              mediaRecorder.ondataavailable = (event) => { audioChunks.push(event.data); };
              mediaRecorder.onstop = async () => {
                  stopMicrophone();
                  const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                  const tempUrl = URL.createObjectURL(audioBlob);
                  setPendingMsg({ type: 'audio', content: tempUrl });
                  setIsUploading(true);
                  setUploadProgress(0);
                  try {
                      const url = await uploadToCloudinary(audioBlob, 'video');
                      await sendMessage(url, 'audio');
                  } catch (e) { showToast('❌ فشل إرسال الصوت', "خطأ", "error"); }
                  setPendingMsg(null);
                  setIsUploading(false);
              };
              mediaRecorder.start();
              setIsRecording(true);
          } catch (e) { showToast('❌ لا يمكن الوصول للمايك', "خطأ", "error"); }
      }
  };

  const handleLogoutRequest = () => { setShowLogoutWarning(true); };
  
  const confirmLogout = async () => {
      // 1. إيقاف الكاميرا والمايك
      stopLocalMedia();

      if(myId) { 
          const userRef = ref(db, `users/${myId}`);
          
          try {
              // أ: إلغاء أي عمليات معلقة عند قطع الاتصال (لتجنب الكتابة مرة أخرى)
              await onDisconnect(userRef).cancel();
              
              // ب: حذف الحساب نهائياً من قائمة المتصلين
              await remove(userRef);
          } catch (error) {
              console.error("Error removing user:", error);
          }
      }

      // 2. تنظيف البيانات المحلية
      localStorage.removeItem('face2_userId'); // يفضل حذف الـ ID أيضاً لضمان دخول جديد نظيف
      localStorage.removeItem('face2_username');
      localStorage.removeItem('face2_avatar');
      localStorage.removeItem('face2_history');
      localStorage.removeItem('face2_recents');
      
      // 3. التوجيه لصفحة البداية
      window.location.href = '/setup'; 
  };

  const startCall = async (targetUser: any, type: 'video' | 'audio') => { 
    if (callStatusRef.current !== 'IDLE') return;

    // ✅ حفظ بيانات الشخص الذي نتصل به
    outgoingCallInfoRef.current = { name: targetUser.username, avatar: targetUser.avatar };

    setCallingTargetId(targetUser.id); 
    setCallType(type); 
    setMyGameRole('X');

    const currentName = localStorage.getItem('face2_username') || username; 
    const currentAvatar = localStorage.getItem('face2_avatar') || myAvatar; 
    
    await remove(ref(db, `calls/${targetUser.id}`)); 
    await new Promise(resolve => setTimeout(resolve, 500)); 
    
    const callRequestRef = ref(db, `calls/${targetUser.id}`);

    // ✅ الحذف التلقائي إذا انقطع النت
    onDisconnect(callRequestRef).remove();

    await set(callRequestRef, { 
        status: 'dialing', 
        callerId: myId, 
        callerName: currentName, 
        callerAvatar: currentAvatar, 
        callType: type,
        timestamp: serverTimestamp() // ✅ توقيت السيرفر
    });
    
    if (dialingTimeoutRef.current) clearTimeout(dialingTimeoutRef.current); 
    dialingTimeoutRef.current = setTimeout(() => { 
        if (callStatusRef.current === 'CALLING' || callStatusRef.current === 'IDLE') { 
            hangUp(); 
            showToast("⏳ لم يتم الرد، حاول لاحقاً.", "تنبيه", "info"); 
        } 
    }, 40000); 
    
    const callRef = ref(db, `calls/${targetUser.id}`); 
    const unsubscribe = onValue(callRef, async (snap) => { 
        const data = snap.val(); 
        if (!data) { if (callingTargetId) hangUp(); return; } 
    
        if (data.status === 'rejected_blocked') { showToast('⛔ عذراً، لا يمكنك الاتصال بهذا المستخدم (تم الحظر)', "تنبيه", "error"); hangUp(); return; }
        if (['rejected_busy'].includes(data.status)) { showToast(data.status === 'rejected_busy' ? '⚠️ مشغول' : '', "تنبيه", "info"); hangUp(); return; } 
    
        if (data.status === 'ringing' && callStatusRef.current === 'IDLE') { 
            setCallStatus('CALLING'); 
            setCallingTargetId(null); 
            currentPeerId.current = targetUser.id; 
            setIncomingCallInfo({ callerName: targetUser.username, callerAvatar: targetUser.avatar }); 
            
            // ❌ تم حذف إشعار "اتصال وارد" هنا لإصلاح المشكلة ❌

            const stream = await startWebcam(type); 
            if (!stream) { hangUp(); return; } 
            
            const connection = createPeerConnection(stream, true); 
            pc.current = connection; 
            (pc.current as any).candidateQueue = []; 
            
            connection.onicecandidate = (e) => { if (e.candidate) push(ref(db, `calls/${targetUser.id}/offerCandidates`), e.candidate.toJSON()); }; 
            
            const answerCandidatesRef = ref(db, `calls/${targetUser.id}/answerCandidates`); 
            onChildAdded(answerCandidatesRef, (snapshot) => { 
                const candidate = snapshot.val(); 
                if (candidate && pc.current) { 
                    if (pc.current.remoteDescription && pc.current.remoteDescription.type) { 
                        pc.current.addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.error("Error adding candidate", e)); 
                    } else if ((pc.current as any).candidateQueue) { 
                        (pc.current as any).candidateQueue.push(candidate); 
                    } 
                } 
            }); 
            answerCandidatesUnsubscribeRef.current = () => off(answerCandidatesRef); 
            
            const offer = await connection.createOffer(); 
            await connection.setLocalDescription(offer); 
            await update(ref(db, `calls/${targetUser.id}`), { offer: { sdp: offer.sdp, type: offer.type }, status: 'offering' }); 
        } 
    
        if (data.answer && pc.current) { 
            if (pc.current.signalingState === "stable") return;

            if (pc.current.signalingState === "have-local-offer") { 
                try { 
                    await pc.current.setRemoteDescription(new RTCSessionDescription(data.answer)); 
                    setCallStatus('CONNECTED'); 
                    // ✅ بدء حساب الوقت للمتصل
                    setStartTime(Date.now());
                    
                    addToRecents(targetUser.id);
                    monitorConnection(); 
                    if (dialingTimeoutRef.current) clearTimeout(dialingTimeoutRef.current); 
                    if (pc.current && (pc.current as any).candidateQueue) { 
                        const queue = (pc.current as any).candidateQueue; 
                        if (queue.length > 0) { 
                            queue.forEach((c: any) => pc.current?.addIceCandidate(new RTCIceCandidate(c)).catch(e => console.log(e))); 
                            (pc.current as any).candidateQueue = []; 
                        } 
                    } 
                } catch (err) { console.error("Error setting remote description", err); } 
            } 
        } 
    }); 
    activeCallUnsubscribeRef.current = () => off(callRef); 
  };

  const answerCall = async () => { 
    const typeToStart = incomingCallInfo?.callType || 'video'; setCallType(typeToStart); const stream = await startWebcam(typeToStart); if (!stream) return; setCallStatus('CONNECTED'); 
    addToRecents(incomingCallInfo.callerId || currentPeerId.current || '');
    setMyGameRole('O');
    clearAllNotifications();

    monitorConnection(); const connection = createPeerConnection(stream, false); pc.current = connection; (pc.current as any).candidateQueue = []; connection.onicecandidate = (e) => { if (e.candidate) push(ref(db, `calls/${myId}/answerCandidates`), e.candidate.toJSON()); }; const data = (await get(ref(db, `calls/${myId}`))).val(); if (!data) return hangUp(); const offerCandidatesRef = ref(db, `calls/${myId}/offerCandidates`); onChildAdded(offerCandidatesRef, (s) => { const candidate = s.val(); if (candidate && pc.current) { if(pc.current.remoteDescription && pc.current.remoteDescription.type) { pc.current.addIceCandidate(new RTCIceCandidate(candidate)).catch(()=>{}); } else if ((pc.current as any).candidateQueue) { (pc.current as any).candidateQueue.push(candidate); } } }); await connection.setRemoteDescription(new RTCSessionDescription(data.offer)); if (pc.current && (pc.current as any).candidateQueue) { const queue = (pc.current as any).candidateQueue; if (queue.length > 0) { queue.forEach((c:any) => connection.addIceCandidate(new RTCIceCandidate(c)).catch(e => console.log(e))); } } const answer = await connection.createAnswer(); await connection.setLocalDescription(answer); await update(ref(db, `calls/${myId}`), { answer: { sdp: answer.sdp, type: answer.type } }); 
  };

  const sendHeart = () => { resetControlsVisibility(); triggerHeartAnimation(); if (dataChannel.current?.readyState === 'open') { dataChannel.current.send('HEART'); } heartComboRef.current += 1; if (heartComboRef.current === 30) { const randomEmoji = ROMANTIC_EMOJIS[Math.floor(Math.random() * ROMANTIC_EMOJIS.length)]; triggerRewardAnimation(randomEmoji); if (dataChannel.current?.readyState === 'open') { dataChannel.current.send(`REWARD:${randomEmoji}`); } heartComboRef.current = 0; } if (comboTimeoutRef.current) clearTimeout(comboTimeoutRef.current); comboTimeoutRef.current = setTimeout(() => { heartComboRef.current = 0; }, 1000); };
  const toggleMic = () => { resetControlsVisibility(); if (localStreamRef.current) { const audioTrack = localStreamRef.current.getAudioTracks()[0]; if(audioTrack) { audioTrack.enabled = !audioTrack.enabled; setIsMicOn(audioTrack.enabled); } } };
  const toggleCam = () => { resetControlsVisibility(); if (localStreamRef.current) { const videoTrack = localStreamRef.current.getVideoTracks()[0]; if(videoTrack) { videoTrack.enabled = !videoTrack.enabled; setIsCamOn(videoTrack.enabled); } } };
  const switchCamera = async () => { resetControlsVisibility(); if (!localStreamRef.current) return; const newMode = facingMode === 'user' ? 'environment' : 'user'; try { localStreamRef.current.getVideoTracks()[0].stop(); const newStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { exact: newMode } }, audio: true }); const track = newStream.getVideoTracks()[0]; if(pc.current) { const sender = pc.current.getSenders().find(s => s.track?.kind === 'video'); if(sender) sender.replaceTrack(track); } setFacingMode(newMode); localStreamRef.current = newStream; setLocalStream(newStream); } catch { startWebcam(); } };
  const toggleDoNotDisturb = () => { setIsDoNotDisturb(!isDoNotDisturb); update(ref(db, `users/${myId}`), { isBusy: !isDoNotDisturb }); };
  const copyLink = () => { navigator.clipboard.writeText(`${APP_URL}/?target=${myId}`); showToast("✅ تم النسخ", "مشاركة", "success"); setShowShareOptions(false); };
  const clearHistory = () => { setCallHistory([]); localStorage.removeItem('face2_history'); };
  const handleAcceptInvite = () => { if (invitedUser) { startCall(invitedUser, 'video'); setInvitedUser(null); router.replace('/call'); } };

  // --- useEffects ---
  useEffect(() => { const storedId = localStorage.getItem('face2_userId'); const storedName = localStorage.getItem('face2_username'); const storedAvatar = localStorage.getItem('face2_avatar'); if (!storedId || !storedName) { router.push('/setup'); return; } setMyId(storedId); setUsername(storedName); if (storedAvatar) setMyAvatar(storedAvatar); const connectedRef = ref(db, '.info/connected'); const userStatusRef = ref(db, `users/${storedId}`); const unsubscribe = onValue(connectedRef, (snap) => { if (snap.val() === true) { update(userStatusRef, { online: true, isBusy: false, username: storedName, avatar: storedAvatar || '👤', lastSeen: Date.now() }); onDisconnect(userStatusRef).update({ online: false, lastSeen: serverTimestamp() }); } }); remove(ref(db, `calls/${storedId}`)); 
    return () => { 
        unsubscribe(); 
        update(userStatusRef, { online: false }); 
        stopLocalMedia();
    }; 
  }, []);
  useEffect(() => { callStatusRef.current = callStatus; }, [callStatus]);
  useEffect(() => { isBusyRef.current = isDoNotDisturb; }, [isDoNotDisturb]);
  useEffect(() => { blockedUsersRef.current = blockedUsers; }, [blockedUsers]);
  useEffect(() => { activeChatTargetRef.current = activeChatTarget; }, [activeChatTarget]);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMessages, activeChatTarget]);
  
  useEffect(() => { 
      if (!myId) return; 
      const chatsRef = ref(db, 'chats'); 
      const unsubscribe = onValue(chatsRef, async (snapshot) => { 
          const data = snapshot.val(); 
          const newCounts: {[key: string]: number} = {}; 
          if (data) { 
              for (const chatId of Object.keys(data)) {
                  if (chatId.includes(myId)) { 
                      let otherUserId = chatId.startsWith(myId + '_') ? chatId.substring(myId.length + 1) : chatId.substring(0, chatId.length - (myId.length + 1)); 
                      if (!otherUserId) continue; 
                      
                      const messagesObj = data[chatId]; 
                      if (messagesObj) { 
                          const messagesList = Object.values(messagesObj) as any[]; 
                          if (messagesList.length > 0) { 
                              const lastMsg = messagesList[messagesList.length - 1]; 
                              if (String(lastMsg.senderId) !== String(myId)) { 
                                  if (activeChatTargetRef.current?.id !== otherUserId) { 
                                      newCounts[otherUserId] = 1;
                                      
                                      if (!previousUnreadCountsRef.current[otherUserId]) {
                                          try {
                                              const userSnap = await get(ref(db, `users/${otherUserId}`));
                                              const userName = userSnap.val()?.username || "شخص ما";
                                              showToast(`📩 رسالة جديدة من ${userName}`, "رسائل", "info");
                                              sendSystemNotification("📩 رسالة جديدة", `من: ${userName}`, userSnap.val()?.avatar);
                                          } catch (e) {
                                              showToast(`📩 رسالة جديدة`, "رسائل", "info");
                                          }
                                      }
                                  } 
                              } 
                          } 
                      } 
                  }
              }
          } 
          setUnreadCounts(newCounts);
          previousUnreadCountsRef.current = newCounts; 
      }); 
      return () => unsubscribe(); 
  }, [myId]);

  // ✅ الـ useEffect الرئيسي لاستقبال الحالات (معدل)
  useEffect(() => { 
      if (!myId) return; 
      const callRef = ref(db, `calls/${myId}`); 
      const unsubscribe = onValue(callRef, (snapshot) => { 
          const data = snapshot.val(); 
          
          if (!data) { 
              if (callStatusRef.current === 'INCOMING' || callStatusRef.current === 'CALLING' || callStatusRef.current === 'CONNECTED') {
                  hangUp(); 
              }
              return; 
          } 
          
          // ✅ 1. حالة الرفض الصريح (Rejected)
          if (data.status === 'rejected_declined') {
              if (callStatusRef.current === 'CALLING') {
                  showToast("قام الطرف الآخر برفض المكالمة 📵", "تم الرفض", "error", data.callerAvatar);
                  const log: CallLog = {
                      id: Date.now().toString(),
                      name: data.callerName || 'مستخدم',
                      avatar: data.callerAvatar || '👤',
                      time: new Date().toLocaleTimeString('ar-EG'),
                      type: 'rejected',
                      duration: 'تم الرفض ⛔'
                  };
                  setCallHistory(prev => {
                       const updated = [log, ...prev];
                       localStorage.setItem('face2_history', JSON.stringify(updated));
                       return updated;
                  });
              }
              hangUp();
              return;
          }

          // ✅ 2. حالة الإلغاء (Canceled)
          if (data.status === 'canceled') {
              if (callStatusRef.current === 'INCOMING') {
                  showToast("تراجع المتصل عن المكالمة قبل الرد.", "مكالمة فائتة 📵", "error", data.callerAvatar);
              }
              hangUp();
              return;
          }

          if (data.status === 'ended') {
              hangUp();
              return;
          }

          if (data.status === 'dialing') { 
              // ✅ التحقق من صلاحية المكالمة (Anti-Ghost Check)
              const callTime = data.timestamp || Date.now();
              const timeDiff = Date.now() - callTime;
              if (timeDiff > 60000) { // دقيقة واحدة
                  remove(ref(db, `calls/${myId}`));
                  return;
              }

              if (blockedUsersRef.current.includes(data.callerId)) { update(callRef, { status: 'rejected_blocked' }); return; } 
              if (isBusyRef.current || (callStatusRef.current !== 'IDLE' && callStatusRef.current !== 'INCOMING')) { 
                  showToast(`حاول ${data.callerName} الاتصال بك وأنت مشغول.`, "مكالمة فائتة", "info", data.callerAvatar); 
                  
                  const missedLog: CallLog = { id: Date.now().toString(), name: data.callerName, avatar: data.callerAvatar || '👤', time: new Date().toLocaleTimeString('ar-EG'), type: 'missed' }; 
                  setCallHistory(prev => { const updated = [missedLog, ...prev]; localStorage.setItem('face2_history', JSON.stringify(updated)); return updated; }); 
                  
                  update(callRef, { status: 'rejected_busy' }); 
                  return; 
              } 
              update(callRef, { status: 'ringing' }); 
              
              // ✅ حفظ بيانات المتصل
              outgoingCallInfoRef.current = { name: data.callerName, avatar: data.callerAvatar };

              showToast(`يتصل بك الآن...`, `📞 ${data.callerName}`, "info", data.callerAvatar);
              sendSystemNotification("📞 اتصال وارد", `يتصل بك ${data.callerName}...`, data.callerAvatar);
              return; 
          } 
          
          if (data.offer && data.status === 'offering') { 
              if (callStatusRef.current === 'IDLE') {
                  setIncomingCallInfo(data); 
                  currentPeerId.current = data.callerId; 
                  setCallStatus('INCOMING'); 
              }
          } 
      }); 
      return () => unsubscribe(); 
  }, [myId]);

  useEffect(() => { 
      const videoEl = remoteVideoRef.current; 
      if (videoEl && remoteStream) { 
          if (videoEl.srcObject !== remoteStream) { 
              videoEl.srcObject = remoteStream; 
              videoEl.load(); 
              videoEl.play().catch(error => { console.warn("Autoplay prevented:", error); setIsVideoPaused(true); }); 
          } 
          
          const handlePlay = () => setIsVideoPaused(false); 
          const handleWaiting = () => setIsVideoPaused(true); 
          const handlePause = () => setIsVideoPaused(true); 
          const handleLeavePiP = () => {
              setIsVideoPaused(false);
              setTimeout(() => {
                  if(remoteVideoRef.current) remoteVideoRef.current.play();
              }, 100);
          };

          videoEl.addEventListener('playing', handlePlay); 
          videoEl.addEventListener('waiting', handleWaiting); 
          videoEl.addEventListener('pause', handlePause); 
          videoEl.addEventListener('leavepictureinpicture', handleLeavePiP);

          setStartTime(Date.now()); 
          resetControlsVisibility(); 
          
          return () => { 
              videoEl.removeEventListener('playing', handlePlay); 
              videoEl.removeEventListener('waiting', handleWaiting); 
              videoEl.removeEventListener('pause', handlePause); 
              videoEl.removeEventListener('leavepictureinpicture', handleLeavePiP);
          }; 
      } else { 
          if (videoEl) videoEl.srcObject = null; 
          setIsVideoPaused(true); 
      } 
  }, [remoteStream]);

  useEffect(() => { if (localVideoRef.current && localStream) { localVideoRef.current.srcObject = localStream; localVideoRef.current.muted = true; localVideoRef.current.play().catch(e => console.warn("Local play error", e)); } }, [localStream, isCamOn, showControls]);
  useEffect(() => { if (activeChatTarget && chatMessages.length > 0) { const chatId = getChatId(myId, activeChatTarget.id); chatMessages.forEach(msg => { if (msg.senderId !== myId && !msg.seen) { update(ref(db, `chats/${chatId}/${msg.id}`), { seen: true }); } }); } }, [chatMessages, activeChatTarget]);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: themeColors.bg, color: themeColors.text, transition: 'all 0.3s ease' }}>
      
      {customNotify && (
            <div className="custom-notification-glass" style={{
                borderRight: `5px solid ${customNotify.type === 'error' ? '#ef4444' : customNotify.type === 'success' ? '#10b981' : '#3b82f6'}`
            }}>
                <div className="notify-content">
                    {customNotify.img ? (
                        <div className="notify-avatar">
                            {customNotify.img.length > 5 ? <img src={customNotify.img} alt="" /> : customNotify.img}
                        </div>
                    ) : (
                        <div className="notify-icon" style={{
                            background: customNotify.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : customNotify.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                            color: customNotify.type === 'error' ? '#ef4444' : customNotify.type === 'success' ? '#10b981' : '#3b82f6'
                        }}>
                            {customNotify.type === 'error' ? '📵' : customNotify.type === 'success' ? '✅' : '🔔'}
                        </div>
                    )}
                    <div className="notify-text">
                        <h4 style={{
                            color: customNotify.type === 'error' ? '#fca5a5' : customNotify.type === 'success' ? '#86efac' : 'white'
                        }}>{customNotify.title}</h4>
                        <p>{customNotify.msg}</p>
                    </div>
                </div>
                <div className="notify-progress" style={{
                    background: customNotify.type === 'error' ? '#ef4444' : customNotify.type === 'success' ? '#10b981' : '#3b82f6'
                }}></div>
            </div>
      )}

      <div className="video-fullscreen" style={{ visibility: (callStatus === 'CONNECTED' || callStatus === 'CALLING') ? 'visible' : 'hidden', opacity: (callStatus === 'CONNECTED' || callStatus === 'CALLING') ? 1 : 0 }} onClick={resetControlsVisibility}>
            <div className={`network-indicator quality-${netQuality}`} style={{opacity: callStatus === 'CONNECTED' ? 1 : 0}}><div className="signal-bar"></div> <div className="signal-bar"></div> <div className="signal-bar"></div> <div className="signal-bar"></div></div>
            
            <canvas ref={pipCanvasRef} width={500} height={500} style={{display: 'none'}} />
            <video ref={pipVideoRef} autoPlay muted style={{display: 'none'}} />

            {callStatus === 'CONNECTED' && (
                <div 
                    onTouchMove={(e) => handleDrag(e, setToolsBtnPos)}
                    style={{
                        position: 'fixed',
                        top: toolsBtnPos.y, 
                        left: toolsBtnPos.x,
                        zIndex: 1000,
                        display: 'flex', 
                        flexDirection: 'column', 
                        alignItems: 'center',
                    }}
                >
                    <button 
                        onClick={(e) => { e.stopPropagation(); setShowToolsMenu(!showToolsMenu); setShowVoiceModal(false); }}
                        style={{
                            width: '55px', height: '55px', 
                            borderRadius: '50%', 
                            background: showToolsMenu ? '#ef4444' : 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
                            border: '2px solid rgba(255,255,255,0.2)',
                            color: 'white',
                            boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
                            cursor: 'move',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.2s',
                            zIndex: 2, 
                        }}
                    >
                        {showToolsMenu ? <span style={{fontSize:20}}>✖</span> : <Icons.Tools />}
                    </button>

                    {showToolsMenu && (
                        <div style={{
                            position: 'absolute',
                            right: '65px',
                            top: 0,
                            display: 'flex', 
                            flexDirection: 'column',
                            gap: 12, 
                            animation: 'fadeIn 0.2s',
                            zIndex: 1,
                            background: 'rgba(31, 41, 55, 0.95)',
                            padding: '15px',
                            borderRadius: '20px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            minWidth: '180px'
                        }}>
                            {/* زر الألعاب */}
                            <button 
                                onClick={(e) => { e.stopPropagation(); setShowGameModal(true); setShowToolsMenu(false); }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    background: 'transparent', border: 'none', color: 'white', cursor: 'pointer',
                                    width: '100%', textAlign: 'right', padding: '5px'
                                }}
                            >
                                <div style={{width: 35, height: 35, borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Icons.Gamepad /></div>
                                <span style={{fontSize: '14px', fontWeight: 'bold'}}>ألعاب (XO)</span>
                            </button>

                            {/* زر مشاركة الشاشة */}
                            {callType === 'video' && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); toggleScreenShare(); }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                        background: 'transparent', border: 'none', color: 'white', cursor: 'pointer',
                                        width: '100%', textAlign: 'right', padding: '5px'
                                    }}
                                >
                                    <div style={{width: 35, height: 35, borderRadius: '50%', background: isScreenSharing ? '#ef4444' : '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                        <Icons.ScreenShare />
                                    </div>
                                    <span style={{fontSize: '14px', fontWeight: 'bold'}}>{isScreenSharing ? 'إيقاف المشاركة' : 'مشاركة الشاشة'}</span>
                                </button>
                            )}

                            {/* زر تغيير الصوت */}
                            <button 
                                onClick={(e) => { e.stopPropagation(); setShowVoiceModal(!showVoiceModal); }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    background: 'transparent', border: 'none', color: 'white', cursor: 'pointer',
                                    width: '100%', textAlign: 'right', padding: '5px', position: 'relative'
                                }}
                            >
                                <div style={{width: 35, height: 35, borderRadius: '50%', background: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                    <Icons.MagicWand />
                                    {voiceEffect !== 'normal' && <div style={{position:'absolute', top:0, right:0, width:10, height:10, background:'#10b981', borderRadius:'50%'}}></div>}
                                </div>
                                <span style={{fontSize: '14px', fontWeight: 'bold'}}>تغيير الصوت</span>
                            </button>

                            {/* زر الجودة */}
                            {callType === 'video' && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); changeVideoQuality(); }}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '10px',
                                        background: 'transparent', border: 'none', color: 'white', cursor: 'pointer',
                                        width: '100%', textAlign: 'right', padding: '5px'
                                    }}
                                >
                                    <div style={{width: 35, height: 35, borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold'}}>
                                        {videoQuality === 'low' ? 'SD' : videoQuality === 'medium' ? 'MD' : 'HD'}
                                    </div>
                                    <div style={{display:'flex', flexDirection:'column'}}>
                                        <span style={{fontSize: '14px', fontWeight: 'bold'}}>جودة الفيديو</span>
                                        <span style={{fontSize: '10px', color: '#9ca3af'}}>
                                            {videoQuality === 'low' ? 'منخفضة (توفير)' : videoQuality === 'medium' ? 'متوسطة' : 'عالية (HD)'}
                                        </span>
                                    </div>
                                </button>
                            )}

                            {/* زر قفل الشاشة */}
                            <button 
                                onClick={(e) => { e.stopPropagation(); setIsScreenLocked(true); setShowToolsMenu(false); }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    background: 'transparent', border: 'none', color: 'white', cursor: 'pointer',
                                    width: '100%', textAlign: 'right', padding: '5px'
                                }}
                            >
                                <div style={{width: 35, height: 35, borderRadius: '50%', background: '#374151', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Icons.Lock /></div>
                                <span style={{fontSize: '14px', fontWeight: 'bold'}}>قفل الشاشة</span>
                            </button>

                            {/* زر PiP */}
                            <button 
                                onClick={(e) => { e.stopPropagation(); togglePiP(); }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    background: 'transparent', border: 'none', color: 'white', cursor: 'pointer',
                                    width: '100%', textAlign: 'right', padding: '5px'
                                }}
                            >
                                <div style={{width: 35, height: 35, borderRadius: '50%', background: '#eab308', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Icons.PiP /></div>
                                <span style={{fontSize: '14px', fontWeight: 'bold'}}>صورة داخل صورة</span>
                            </button>
                        </div>
                    )}

                    {showVoiceModal && (
                        <div style={{
                            position: 'absolute', right: 260, top: 0,
                            background: '#1f2937', border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '12px', padding: '5px',
                            display: 'flex', flexDirection: 'column', gap: '5px',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.5)', width: '100px',
                            zIndex: 2000
                        }}>
                            <button onClick={(e) => { e.stopPropagation(); applyVoiceEffect('normal'); }} style={{background: voiceEffect === 'normal' ? '#4b5563' : 'transparent', border:'none', color:'white', padding:'8px', borderRadius:'8px', fontSize:'12px'}}>عادي</button>
                            <button onClick={(e) => { e.stopPropagation(); applyVoiceEffect('squeaky'); }} style={{background: voiceEffect === 'squeaky' ? '#8b5cf6' : 'transparent', border:'none', color:'white', padding:'8px', borderRadius:'8px', fontSize:'12px'}}>سنجاب</button>
                            <button onClick={(e) => { e.stopPropagation(); applyVoiceEffect('monster'); }} style={{background: voiceEffect === 'monster' ? '#ef4444' : 'transparent', border:'none', color:'white', padding:'8px', borderRadius:'8px', fontSize:'12px'}}>وحش</button>
                        </div>
                    )}
                </div>
            )}

            <div className={`stream-container ${isSwapped ? 'mini' : 'full'}`} onClick={(e) => { if(isSwapped) { e.stopPropagation(); setIsSwapped(false); } }}>
                <video ref={remoteVideoRef} autoPlay playsInline onClick={() => { /* No action */ }} style={{ width:'100%', height:'100%', objectFit: isSwapped ? 'cover' : 'contain', opacity: (callType === 'video' && !isVideoPaused) ? 1 : 0 }} />
                
                <audio ref={remoteAudioRef} autoPlay playsInline style={{opacity: 0, position: 'absolute', pointerEvents: 'none'}} />

                {(callType === 'audio' || isVideoPaused) && ( 
                    <div style={{position: 'absolute', top:0, left:0, width:'100%', height:'100%', background:'#1f2937', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', zIndex: 10}}> 
                        <div style={{
                            width: '150px', height: '150px', borderRadius: '50%', background: '#374151', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '80px', 
                            boxShadow: '0 0 0 0 rgba(74, 222, 128, 0.7)', 
                            animation: 'pulse-green 1.5s infinite', 
                            transition: 'all 0.2s ease'
                        }}>
                            {incomingCallInfo?.callerAvatar || '👤'}
                        </div> 
                        <h2 style={{marginTop: '20px', fontSize: '24px', fontWeight: 'bold'}}>{incomingCallInfo?.callerName || 'صديق'}</h2> 
                        <p style={{color: '#9ca3af', marginTop: '5px'}}>{callType === 'audio' ? 'مكالمة صوتية 📞' : 'جاري الاتصال بالفيديو... 🔄'}</p> 
                        <button onClick={manualPlay} style={{marginTop: '30px', background: 'rgba(255,255,255,0.1)', color: 'white', padding: '10px 20px', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '20px', cursor: 'pointer', fontSize: '14px'}}>🔊 اضغط هنا إذا لم تسمع الصوت</button> 
                    </div> 
                )}
            </div>

            {callType === 'video' && ( 
                <div className={`stream-container ${isSwapped ? 'full' : 'mini'}`} onClick={(e) => { e.stopPropagation(); setIsSwapped(!isSwapped); }}>
                    {isCamOn ? ( 
                        <video ref={localVideoRef} autoPlay muted playsInline style={{ width:'100%', height:'100%', objectFit:'cover', transform: facingMode==='user' && !isScreenSharing ?'scaleX(-1)':'none' }} /> 
                    ) : ( 
                        <div style={{width:'100%', height:'100%', background:'#374151', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:16}}><Icons.CamOff /></div> 
                    )} 
                </div> 
            )}

            <div className={`call-controls-bar ${showControls ? '' : 'controls-hidden'}`} onClick={(e) => e.stopPropagation()}>
                {callType === 'video' && ( <button onClick={toggleCam} className="control-btn" style={{backgroundColor: isCamOn ? '#374151' : '#ef4444'}}><span className="icon">{isCamOn ? <Icons.CamOn /> : <Icons.CamOff />}</span></button> )}
                
                <button onClick={() => hangUp()} className="control-btn btn-hangup-red"><span className="icon"><Icons.Hangup /></span></button>
                <button onClick={toggleMic} className="control-btn" style={{backgroundColor: isMicOn ? '#374151' : '#ef4444'}}><span className="icon">{isMicOn ? <Icons.MicOn /> : <Icons.MicOff />}</span></button>
                {isMobile && callType === 'video' && !isScreenSharing && ( <button onClick={switchCamera} className="control-btn"><span className="icon"><Icons.Switch /></span></button> )}
                <button onClick={sendHeart} className="control-btn" style={{color:'#ef4444'}}><span className="icon"><Icons.Heart /></span></button>
            </div>
            
            {callStatus === 'CALLING' && ( <div className="calling-overlay-glass"> <div className="glass-card"> <div className="pulse-avatar-glow">👤</div> <h2 style={{fontSize: 24, marginBottom: 10}}>جاري الاتصال...</h2> <p style={{color:'#9ca3af', marginBottom: 20}}>{callType === 'audio' ? 'مكالمة صوتية 📞' : 'مكالمة فيديو 📹'}</p> <div className="typing-indicator"><span></span><span></span><span></span></div> <button onClick={() => hangUp()} className="btn-cancel-glass">إلغاء ❌</button> </div> </div> )}
            <div style={{position:'absolute', top:0, left:0, width:'100%', height:'100%', pointerEvents:'none', zIndex: 50, overflow:'hidden'}}>
                 {hearts.map(h => ( <div key={h.id} className="heart-anim" style={{ left: `${h.left}%` }}>❤️</div> ))}
                 {rewardEmoji && <div className="monkey-anim">{rewardEmoji}</div>}
            </div>

            {isScreenLocked && (
                <div 
                    onDoubleClick={() => setIsScreenLocked(false)}
                    style={{
                        position: 'fixed', inset: 0, 
                        background: 'black', 
                        zIndex: 99999, 
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        color: 'white',
                        touchAction: 'none'
                    }}
                >
                    <div style={{opacity: 0.5, display:'flex', flexDirection:'column', alignItems:'center', gap: 20}}>
                        <Icons.Unlock />
                        <p style={{fontSize: 14}}>اضغط مرتين لفتح القفل</p>
                    </div>
                </div>
            )}

            {showGameModal && (
                <div className="modal-overlay" onClick={() => setShowGameModal(false)}>
                    <div className="modern-modal" onClick={e => e.stopPropagation()} style={{background: 'rgba(31, 41, 55, 0.95)', border: '1px solid rgba(255,255,255,0.1)'}}>
                        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20}}>
                            <h3 style={{margin:0, color:'#f3f4f6'}}>XO سوداني 🇸🇩</h3>
                            <button onClick={() => setShowGameModal(false)} style={{background:'none', border:'none', color:'white', fontSize:20, cursor:'pointer'}}>✖</button>
                        </div>

                        {(gameWinner || !gameBoard.includes(null)) ? (
                            <div style={{textAlign:'center', marginBottom:20, animation:'pulse-green 1s infinite'}}>
                                <h2 style={{color: gameWinner ? '#10b981' : '#fbbf24', fontSize:30}}>
                                    {gameWinner ? `🎉 الفائز: ${gameWinner}` : '🤝 تعادل!'}
                                </h2>
                                <button onClick={resetGame} className="gradient-btn" style={{marginTop:10}}>لعبة جديدة 🔄</button>
                            </div>
                        ) : (
                            <div style={{textAlign:'center', color:'#9ca3af', marginBottom:10}}>
                                الدور على: <span style={{color:'white', fontWeight:'bold', fontSize:18}}>{isXNext ? 'X' : 'O'}</span>
                                <div style={{fontSize: 12, marginTop: 5}}>أنت تلعب بـ: <span style={{color: '#3b82f6', fontWeight: 'bold'}}>{myGameRole}</span></div>
                            </div>
                        )}

                        <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', maxWidth: '300px', margin: '0 auto'}}>
                            {gameBoard.map((square, i) => (
                                <button 
                                    key={i} 
                                    onClick={() => handleGameMove(i)}
                                    disabled={!!square || !!gameWinner}
                                    style={{
                                        height: '80px', 
                                        background: square ? (square === 'X' ? '#4f46e5' : '#ef4444') : 'rgba(255,255,255,0.05)',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '15px',
                                        fontSize: '40px',
                                        fontWeight: 'bold',
                                        color: 'white',
                                        cursor: (!!square || !!gameWinner || ((myGameRole === 'X' && !isXNext && !gameBoard.every(sq => sq === null)) || (myGameRole === 'O' && isXNext && !gameBoard.every(sq => sq === null)))) ? 'not-allowed' : 'pointer',
                                        transition: 'all 0.2s',
                                        opacity: (!!square || !!gameWinner) ? 1 : 0.8
                                    }}
                                >
                                    {square}
                                </button>
                            ))}
                        </div>
                        
                        {!gameWinner && (
                            <button 
                                onClick={sendNudge}
                                style={{
                                    marginTop: 20, 
                                    background: 'transparent', border: '1px solid #fbbf24', 
                                    color: '#fbbf24', padding: '8px 15px', borderRadius: '20px',
                                    fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px',
                                    margin: '20px auto 0 auto'
                                }}
                            >
                                <Icons.Hand /> نكز صديقك
                            </button>
                        )}
                    </div>
                </div>
            )}
      </div>

      {activeChatTarget && (
          <div className={`chat-container ${isDissolving ? 'dissolve-dust' : ''}`}>
              <div className="chat-header">
                  <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
                      <button onClick={handleCloseChatRequest} style={{background: 'none', border: 'none', color: 'white', cursor: 'pointer'}}><Icons.Back /></button>
                      <div style={{width: '35px', height: '35px', background: '#374151', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>{activeChatTarget.avatar || '👤'}</div>
                      <span style={{fontSize:'14px'}}>{activeChatTarget.username}</span>
                  </div>
              </div>
              <div style={{padding: '8px', background: 'rgba(16, 185, 129, 0.1)', color: '#34d399', fontSize: '10px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px'}}><Icons.Security />رسائلك مشفرة وتحذف فوراً.</div>
              
              <div className="chat-messages-area">
                  {chatMessages.length === 0 && ( <div style={{textAlign: 'center', color: '#6b7280', marginTop: '50px'}}><div style={{fontSize: '30px', marginBottom: '10px'}}>👋</div><p style={{fontSize:'12px'}}>ابدأ المحادثة الآن</p></div> )}
                  {chatMessages.map(msg => ( 
                      <div key={msg.id} className={`chat-message ${msg.senderId === myId ? 'me' : 'other'}`}>
                          {msg.type === 'image' ? (
                              <div style={{position:'relative'}}>
                                  <img 
                                    src={msg.text} 
                                    alt="Sent" 
                                    className="chat-image-bubble" 
                                    style={{opacity: msg.seen === undefined ? 0.7 : 1}}
                                    onClick={()=>setSelectedImage(msg.text)} 
                                  />
                                  {msg.seen === undefined && (
                                      <>
                                        <div className="upload-progress-container">
                                            <div className="upload-progress-bar" style={{width: `${uploadProgress}%`}}></div>
                                        </div>
                                        <div style={{position:'absolute', bottom:5, right:5, fontSize:'10px', background:'rgba(0,0,0,0.5)', padding:'2px 5px', borderRadius:'5px'}}>
                                            {Math.round(uploadProgress)}%
                                        </div>
                                      </>
                                  )}
                              </div>
                          ) : msg.type === 'audio' ? (
                              <div style={{display:'flex', alignItems:'center', gap:'5px'}}>
                                  <audio controls src={msg.text} style={{maxWidth:'200px', height:'30px'}} />
                                  {msg.seen === undefined && <div style={{fontSize:'10px'}}>{Math.round(uploadProgress)}%</div>}
                              </div>
                          ) : ( msg.text )}
                          
                          {msg.senderId === myId && msg.seen !== undefined && (
                              <span style={{fontSize: '10px', marginRight: '5px', display:'inline-block', float:'left', marginTop:'5px', color: msg.seen ? '#60a5fa' : '#9ca3af'}}>
                                  {msg.seen ? <Icons.DoubleCheck /> : <Icons.Check />}
                              </span>
                          )}
                      </div> 
                  ))}
                  {pendingMsg && (
                      <div className="chat-message me" style={{opacity: 0.7, display:'flex', alignItems:'center', gap:'10px'}}>
                          {pendingMsg.type === 'image' ? (
                               <div style={{position:'relative'}}>
                                   <img src={pendingMsg.content} style={{width:100, height:'auto', borderRadius:5}} />
                                   <div className="upload-progress-container">
                                       <div className="upload-progress-bar" style={{width: `${uploadProgress}%`}}></div>
                                   </div>
                               </div>
                          ) : <Icons.MicRecord />}
                          <span style={{fontSize:'12px'}}> <Icons.Clock /> جاري الإرسال... {Math.round(uploadProgress)}%</span>
                      </div>
                  )}
                  <div ref={chatEndRef} />
              </div>

              <div className="chat-input-area">
                  <input type="file" ref={fileInputRef} style={{display:'none'}} accept="image/*" onChange={handleImageUpload} />
                  {!isRecording && (
                    <>
                        <button onClick={() => fileInputRef.current?.click()} style={{background:'transparent', color:'#9ca3af'}} disabled={isUploading}><Icons.Clip /></button>
                        <input type="text" value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && sendMessage(chatInput)} placeholder="اكتب رسالة..." />
                    </>
                  )}
                  {isRecording && ( <div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center', color:'#ef4444', fontWeight:'bold', animation:'pulse 1s infinite'}}><span style={{marginRight:10}}>🔴</span> جاري التسجيل...</div> )}
                  {chatInput.trim() ? ( <button onClick={() => sendMessage(chatInput)}><Icons.Send /></button> ) : ( <button onClick={toggleRecording} style={{background: isRecording ? '#ef4444' : '#4f46e5', transition:'all 0.2s', width: isRecording ? '50px' : '35px', borderRadius: isRecording ? '20px' : '50%'}}>{isRecording ? <Icons.StopRecord /> : <Icons.MicRecord />}</button> )}
              </div>
          </div>
      )}

      {selectedImage && ( <div className="lightbox-overlay" onClick={() => setSelectedImage(null)}> <img src={selectedImage} className="lightbox-img" onClick={(e) => e.stopPropagation()} /> <div className="lightbox-actions" onClick={(e) => e.stopPropagation()}> <button onClick={() => handleDownloadImage(selectedImage)} className="btn-download"> <Icons.Download /> تنزيل </button> <button onClick={() => setSelectedImage(null)} className="btn-close-lightbox">إغلاق</button> </div> </div> )}

      {showExitWarning && ( <div className="modal-overlay" onClick={() => setShowExitWarning(false)}> <div className="modern-modal" onClick={e => e.stopPropagation()} style={{textAlign: 'center', border: '1px solid #ef4444'}}> <div style={{display:'flex', justifyContent:'center', marginBottom: '15px'}}><Icons.Warning /></div> <h3 style={{color: '#ef4444', marginBottom: '10px'}}>تنبيه هام!</h3> <p style={{color: '#d1d5db', fontSize: '14px', lineHeight: '1.6', marginBottom: '20px'}}>تنبيه: سيتم حذف جميع الرسائل فور مغادرة هذه النافذة لضمان حماية بياناتك، حتى لو لم يقرأها الطرف الآخر.</p> <div style={{display: 'flex', gap: '10px'}}> <button onClick={confirmCloseChat} className="btn-pill-red" style={{flex: 1, justifyContent: 'center', padding: '12px', fontSize: '14px'}}>نعم، خروج وحذف</button> <button onClick={() => setShowExitWarning(false)} className="gradient-btn" style={{flex: 1, background: '#374151', marginTop: 0}}>إلغاء</button> </div> </div> </div> )}
      
      {showLogoutWarning && ( <div className="modal-overlay" onClick={() => setShowLogoutWarning(false)}> <div className="modern-modal" onClick={e => e.stopPropagation()} style={{textAlign: 'center', border: '1px solid #ef4444'}}> <div style={{display:'flex', justifyContent:'center', marginBottom: '15px'}}><Icons.Warning /></div> <h3 style={{color: '#ef4444', marginBottom: '10px'}}>تسجيل الخروج؟</h3> <p style={{color: '#d1d5db', fontSize: '14px', lineHeight: '1.6', marginBottom: '20px'}}>سيتم حذف اسمك وسجل المكالمات والصورة الحالية من هذا الجهاز، ولكن <b>ستحتفظ بنفس الهوية (ID)</b> عند الدخول مرة أخرى.</p> <div style={{display: 'flex', gap: '10px'}}> <button onClick={confirmLogout} className="btn-pill-red" style={{flex: 1, justifyContent: 'center', padding: '12px', fontSize: '14px'}}>نعم، خروج</button> <button onClick={() => setShowLogoutWarning(false)} className="gradient-btn" style={{flex: 1, background: '#374151', marginTop: 0}}>إلغاء</button> </div> </div> </div> )}

      {showAboutModal && ( <div className="modal-overlay" onClick={() => setShowAboutModal(false)}> <div className="modern-modal" onClick={e => e.stopPropagation()} style={{background: themeColors.cardBg, border: `1px solid ${themeColors.border}`, padding: '30px', width: '350px', color: themeColors.text}}> <div className="sudan-flag-css" style={{margin:'0 auto 20px auto'}} onClick={() => setShowAboutModal(true)}></div> <h2 style={{margin: '10px 0'}}>Face2</h2> <p style={{color: '#10b981', fontWeight: 'bold', fontSize: '14px', marginBottom: '20px'}}>🔒 أول تطبيق اتصال سوداني آمن</p> <div style={{background: theme === 'dark' ? '#1f2937' : '#e5e7eb', padding: '15px', borderRadius: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', border: `1px solid ${themeColors.border}`, cursor: 'pointer'}} onClick={toggleTheme}> <span style={{color: themeColors.subText}}>المظهر:</span> <div style={{display:'flex', alignItems:'center', gap:'5px', fontWeight:'bold', color: theme === 'dark' ? '#fbbf24' : '#1e293b'}}> {theme === 'dark' ? <><Icons.Moon /> ليلي</> : <><Icons.Sun /> نهاري</>} </div> </div> <div style={{background: theme === 'dark' ? '#1f2937' : '#e5e7eb', padding: '20px', borderRadius: '15px', border: `1px solid ${themeColors.border}`, marginBottom: '20px'}}> <p style={{color: themeColors.subText, fontSize: '12px', marginBottom: '10px'}}>تم تطوير هذا التطبيق بكل ❤️ بواسطة:</p> <a href="https://www.facebook.com/share/1KjS11eHuP/" target="_blank" rel="noopener noreferrer" style={{color: '#6366f1', fontWeight: 'bold', fontSize: '16px', textDecoration: 'none', display: 'block', marginBottom: '15px'}}>↗ Mustafa Omar Ahmed</a> <p style={{color: themeColors.subText, fontSize: '11px', lineHeight: '1.6', marginBottom: '10px'}}>"يمكن لأي شخص إنشاء تطبيق بالذكاء الاصطناعي.. كل ما يهم هو فكرة الشخص وإصراره على بناء شيء جميل" ✨</p> <p style={{color: themeColors.subText, fontSize: '10px'}}>🤖 Powered by Gemini AI</p> </div> <button onClick={() => setShowAboutModal(false)} className="gradient-btn" style={{background: '#4f46e5'}}>إغلاق ✖️</button> </div> </div> )}
      {showShareOptions && ( <div className="modal-overlay" onClick={() => setShowShareOptions(false)}> <div className="modern-modal" onClick={e => e.stopPropagation()}> <h3>دعوة صديق 🤝</h3> <button onClick={copyLink} className="gradient-btn">🔗 نسخ الرابط</button> <button onClick={() => {setShowShareOptions(false); setShowQRModal(true)}} className="gradient-btn">📱 عرض كود QR</button> </div> </div> )}
      {showQRModal && ( <div className="modal-overlay" onClick={() => setShowQRModal(false)}> <div className="modern-modal" onClick={e=>e.stopPropagation()} style={{background:'white'}}> <QRCode value={`${APP_URL}/?target=${myId}`} /> <button onClick={() => setShowQRModal(false)} className="gradient-btn" style={{marginTop:20}}>إغلاق</button> </div> </div> )}
      {showHistoryModal && ( <div className="modal-overlay" onClick={() => setShowHistoryModal(false)}> <div className="history-modal-card" onClick={e=>e.stopPropagation()} style={{background: themeColors.cardBg, color: themeColors.text}}> <h3 className="history-title">سجل المكالمات 📞</h3> <div className="history-list-container"> {callHistory.length === 0 ? <p style={{color:'#9ca3af', marginTop:30}}>لا توجد مكالمات حديثة</p> : callHistory.map((log, i) => ( <div key={i} className="history-item" style={{background: theme === 'dark' ? '#111827' : '#f9fafb', border: `1px solid ${themeColors.border}`}}> <div className="history-info-right"> <span className="h-name" style={{color: themeColors.text}}>{log.name}</span> <div className="h-status-row"> {log.type === 'missed' && <span style={{color:'#ef4444'}}>❌ فائتة</span>} {log.type === 'incoming' && <span style={{color:'#10b981'}}>✅ واردة</span>} {log.type === 'outgoing' && <span style={{color:'#3b82f6'}}>↗️ صادرة</span>} {log.type === 'rejected' && <span style={{color:'#f59e0b'}}>⛔ مرفوضة</span>} {log.type === 'canceled' && <span style={{color:'#9ca3af'}}>🚫 ملغاة</span>} {log.duration && <span style={{marginRight:10, color: (log.duration.includes('🚫') || log.duration.includes('⛔')) ? '#ef4444' : '#9ca3af', fontSize:11}}>⏱️ {log.duration}</span>} </div> </div> <div style={{display:'flex', flexDirection:'column', alignItems:'flex-end'}}> <span style={{fontSize:24}}>{log.avatar || '👤'}</span> <span className="h-time">{log.time}</span> </div> </div> ))} </div> <div className="history-actions-row"> <button onClick={() => setShowHistoryModal(false)} className="btn-modal-close">إغلاق ✖️</button> <button onClick={clearHistory} className="btn-modal-clear">حذف الكل 🗑️</button> </div> </div> </div> )}
      
      {/* 1. الشاشة الرئيسية */}
      {callStatus === 'IDLE' && !activeChatTarget && ( <div className="app-layout" style={{background: themeColors.bg}}> <div className="header-container"> <div className="header-right-col"> <div className="profile-box">{myAvatar}</div> <div className="header-buttons-row"> <button onClick={handleLogoutRequest} className="btn-pill-red">خروج 🚪</button> <button onClick={() => setShowShareOptions(true)} className="btn-circle-blue">🔗</button> </div> </div> <div className="header-left-col"> <div className="sudan-flag-css" onClick={() => setShowAboutModal(true)}></div> <div className="status-container"> <span className="status-label">حالة الاستقبال:</span> <div className={`status-badge ${isDoNotDisturb ? 'busy' : ''}`} onClick={toggleDoNotDisturb}> {isDoNotDisturb ? '⛔ مشغول' : '✅ متاح'} </div> </div> </div> </div> <div className="greeting-area"> <h1 className="greeting-title" style={{color: themeColors.text}}>مرحباً، <span className="text-gradient-name">{username}</span> 👋</h1> <p className="greeting-sub">اختر صديقاً وابدأ المحادثة فوراً 👇</p> </div> <div style={{flex: 1, paddingBottom: '100px'}}> <UserSearch onCall={startCall} onChat={openChat} inCall={!!callingTargetId} blockedUsers={blockedUsers} toggleBlock={toggleBlockUser} loadingTargetId={callingTargetId} unreadCounts={unreadCounts} /> </div> <button onClick={() => setShowHistoryModal(true)} style={{position:'fixed', bottom:20, left:20, background:'#374151', color:'white', padding:'10px 20px', borderRadius:30, border:'none', cursor:'pointer', boxShadow:'0 4px 10px rgba(0,0,0,0.3)', zIndex:90}}>🕒 السجل</button> <AIAssistant /> </div> )}
    
      {/* 2. شاشة الاستقبال */}
      {callStatus === 'INCOMING' && incomingCallInfo && (
        <div className="calling-overlay-glass" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
           <div className="glass-card" style={{animation: 'slideUp 0.3s ease-out'}}>
               <div className="pulse-avatar-glow" style={{fontSize: '50px'}}>
                  {incomingCallInfo.callerAvatar || '👤'}
               </div>
               <h2 style={{fontSize: '24px', fontWeight: 'bold', marginBottom: '10px'}}>
                  {incomingCallInfo.callerName || 'متصل مجهول'}
               </h2>
               <p style={{color: '#9ca3af', marginBottom: '30px', fontSize: '16px'}}>
                  {incomingCallInfo.callType === 'audio' ? '📞 مكالمة صوتية واردة...' : '📹 مكالمة فيديو واردة...'}
               </p>
               <div className="incoming-actions" style={{display: 'flex', gap: '30px', alignItems: 'center'}}>
                   <button onClick={() => hangUp()} className="btn-reject-pulse" title="رفض">
                      <Icons.Hangup />
                   </button>
                   <button onClick={() => answerCall()} className="btn-accept-pulse" title="رد" style={{width: '80px', height: '80px', borderRadius: '50%', border: 'none', background: '#10b981', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 0 rgba(16, 185, 129, 0.7)', animation: 'pulse-green 1.5s infinite'}}>
                      {incomingCallInfo.callType === 'audio' ? <Icons.MicOn /> : <Icons.CamOn />}
                   </button>
               </div>
           </div>
        </div>
      )}
      
    </div>
  );
}