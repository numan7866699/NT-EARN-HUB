import React, { useState, useEffect, useRef } from 'react';
import { 
  Tv, 
  Play, 
  ListCheck, 
  Wallet, 
  Users, 
  Clock, 
  User, 
  LogOut, 
  ArrowLeft, 
  DollarSign, 
  TrendingUp, 
  ShieldCheck, 
  Copy, 
  Send, 
  Image, 
  Camera, 
  Key, 
  Headphones, 
  Trash2, 
  Info, 
  X,
  ExternalLink,
  ChevronRight,
  Database,
  Sparkles,
  AlertTriangle,
  RotateCw,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { dbService, getSavedMode } from './dbService';
import { UserProfile, Task, Transaction, ReferralRecord, MonetizationSettings } from './types';

export default function App() {
  // Global Mode selection: Sandbox Mode vs. Live Firebase
  const [isSandbox, setIsSandbox] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);

  // Authorized Admin Accounts who can access Earning/Monetization control panel page
  const ADMIN_EMAILS = [
    'onlineexpert912@gmail.com',
    'admin@app.com',
    'admin@gmail.com'
  ];
  const isAdmin = currentUser && (
    ADMIN_EMAILS.includes((currentUser.email || '').toLowerCase()) ||
    (currentUser.username || '').toLowerCase() === 'admin'
  );
  
  // Navigation: 'dashboard' | 'tasks' | 'wallet' | 'referrals' | 'history' | 'profile' | 'support'
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [taskCategoryName, setTaskCategoryName] = useState<string>('');
  
  // Auth Form parameters
  const [isSignup, setIsSignup] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullname, setFullname] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [country, setCountry] = useState<string>('');
  const [referralCodeInput, setReferralCodeInput] = useState<string>('');

  // Feed Lists
  const [referralList, setReferralList] = useState<ReferralRecord[]>([]);
  const [transactionList, setTransactionList] = useState<Transaction[]>([]);
  const [tasksList, setTasksList] = useState<Task[]>([]);

  // Active Task Processing States
  const [activeRunningTask, setActiveRunningTask] = useState<Task | null>(null);
  const [taskTimeRemaining, setTaskTimeRemaining] = useState<number>(0);
  const [taskIntervalId, setTaskIntervalId] = useState<any>(null);
  
  // Wallet Withdrawal State
  const [withdrawNetwork, setWithdrawNetwork] = useState<string>('');
  const [withdrawAddress, setWithdrawAddress] = useState<string>('');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');

  // Support State
  const [supportSubject, setSupportSubject] = useState<string>('');
  const [supportDescription, setSupportDescription] = useState<string>('');
  const [supportFile, setSupportFile] = useState<string>('');

  // Custom Dialog States
  const [modalActive, setModalActive] = useState<boolean>(false);
  const [modalTitle, setModalTitle] = useState<string>('');
  const [modalMessage, setModalMessage] = useState<string>('');
  const [modalStatusType, setModalStatusType] = useState<'success' | 'info' | 'warning' | 'error'>('info');

  // Monetization Settings State
  const [monetizationSettings, setMonetizationSettings] = useState<MonetizationSettings | null>(null);
  const [monetizationLoading, setMonetizationLoading] = useState<boolean>(false);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);

  // Form states for Admin settings
  const [adminAdsterraLink, setAdminAdsterraLink] = useState<string>('');
  const [adminMonetagLink, setAdminMonetagLink] = useState<string>('');
  const [adminCpaLeadLink, setAdminCpaLeadLink] = useState<string>('');
  const [adminShortVidLink, setAdminShortVidLink] = useState<string>('');
  const [adminMicroTasksLink, setAdminMicroTasksLink] = useState<string>('');

  // Profile update form states
  const [newPasswordUpdate, setNewPasswordUpdate] = useState<string>('');
  const [confirmPasswordUpdate, setConfirmPasswordUpdate] = useState<string>('');
  const [customPicUrl, setCustomPicUrl] = useState<string>('');
  const [updatingPass, setUpdatingPass] = useState<boolean>(false);

  // Trigger read of referral code from URL query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      setReferralCodeInput(ref);
      setIsSignup(true); // open signup flow automatically if referred
    }
  }, []);

  // Monitor database connection state or authorization
  useEffect(() => {
    setIsLoadingAuth(true);
    dbService.setMode(isSandbox);

    if (isSandbox) {
      // In sandbox, we check local storage
      const fetchLocalUser = () => {
        const stored = localStorage.getItem('nt_sandbox_user_profile');
        if (stored) {
          const prof = JSON.parse(stored) as UserProfile;
          setCurrentUser(prof);
          loadSandboxFeeds(prof.uid);
        } else {
          setCurrentUser(null);
        }
        setIsLoadingAuth(false);
      };
      fetchLocalUser();
    } else {
      // Live Firebase mode auth state listener
      let unsubProfile: (() => void) | null = null;
      const unsubAuth = dbService.onAuthStateChanged((user) => {
        if (unsubProfile) {
          unsubProfile();
          unsubProfile = null;
        }

        if (user) {
          // Setup listener for their user document
          unsubProfile = dbService.subscribeToProfile(user.uid, (profile) => {
            setCurrentUser(profile);
            if (profile) {
              // Setup referrals & transactions listeners
              setupLiveFeeds(profile.uid);
            }
          });
          setIsLoadingAuth(false);
        } else {
          setCurrentUser(null);
          setIsLoadingAuth(false);
        }
      });
      return () => {
        unsubAuth();
        if (unsubProfile) {
          unsubProfile();
        }
      };
    }
  }, [isSandbox]);

  // Load monetization settings from database
  useEffect(() => {
    const fetchMonetization = async () => {
      try {
        setMonetizationLoading(true);
        const settings = await dbService.getMonetizationSettings();
        setMonetizationSettings(settings);
        if (settings) {
          setAdminAdsterraLink(settings.adsterraDirectLink || '');
          setAdminMonetagLink(settings.monetagSmartlink || '');
          setAdminCpaLeadLink(settings.cpaLeadOfferwall || '');
          setAdminShortVidLink(settings.shortVideoFeed || '');
          setAdminMicroTasksLink(settings.microTasksOfferwall || '');
        }
      } catch (err) {
        console.error("Error fetching monetization settings:", err);
      } finally {
        setMonetizationLoading(false);
      }
    };
    fetchMonetization();
  }, [isSandbox]);

  const loadSandboxFeeds = (uid: string) => {
    dbService.subscribeToReferrals(uid, (refs) => setReferralList(refs));
    dbService.subscribeToTransactions(uid, (txs) => setTransactionList(txs));
  };

  const setupLiveFeeds = (uid: string) => {
    dbService.subscribeToReferrals(uid, (refs) => setReferralList(refs));
    dbService.subscribeToTransactions(uid, (txs) => setTransactionList(txs));
  };

  // Switch sandbox Mode directly in-app
  const handleToggleSandboxMode = (value: boolean) => {
    setIsSandbox(value);
    dbService.setMode(value);
    triggerModal(
      'info', 
      value ? 'Sandbox Mode Engaged' : 'Live Firebase Connected', 
      value 
        ? 'Offline simulator acts as local sandbox for immediate testing without rules or verification blocks.' 
        : 'Connecting directly to registered production Cloud Realtime Database and secure core.'
    );
  };

  // Show standard custom modal
  const triggerModal = (type: 'success' | 'info' | 'warning' | 'error', title: string, msg: string) => {
    setModalStatusType(type);
    setModalTitle(title);
    setModalMessage(msg);
    setModalActive(true);
  };

  // Auth processing actions
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      triggerModal('warning', 'Empty Fields', 'Please specify both authorization credentials.');
      return;
    }

    try {
      if (isSignup) {
        if (!fullname || !username || !country) {
          triggerModal('warning', 'Missing Registration Profile', 'Please complete all profile parameter nodes.');
          return;
        }
        await dbService.signUp(email, password, fullname, username, country, referralCodeInput);
        if (isSandbox) {
          triggerModal('success', 'Profile Created', 'Test Sandbox Profile generated successfully! No verification is required.');
          setIsSignup(false);
        } else {
          triggerModal('info', 'Verification Outbound', 'A secure link has been sent to your email. Confirm verification prior to logging in.');
          setIsSignup(false);
        }
      } else {
        const profile = await dbService.signIn(email, password);
        if (isSandbox) {
          setCurrentUser(profile);
          loadSandboxFeeds(profile.uid);
          triggerModal('success', 'Workspace Activated', `Welcome back, test worker ${profile.fullname}!`);
        } else {
          // Live handles it via Auth State Changed callback
        }
      }
    } catch (err: any) {
      if (err.message === 'EMAIL_UNVERIFIED') {
        triggerModal('warning', 'Email Unverified', 'Verify your email prior to dashboard access. Check spam folders.');
      } else {
        triggerModal('error', 'Authentication Denied', err.message || 'System was unable to authorize credentials.');
      }
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      triggerModal('warning', 'Field Required', 'Enter your registered email address in the credential field first.');
      return;
    }
    try {
      await dbService.resetPassword(email);
      triggerModal('success', 'Transfer Complete', 'Password secure validator has been dispatched to your email.');
    } catch (err: any) {
      triggerModal('error', 'Reset Failed', err.message);
    }
  };

  const handleLogOut = async () => {
    try {
      await dbService.signOut();
      setCurrentUser(null);
      setActiveView('dashboard');
      triggerModal('info', 'Session Deactivated', 'Secure workspace session closed. Core logged out safely.');
    } catch (err: any) {
      triggerModal('error', 'Fail', err.message);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirm("CRITICAL CRASH DANGER: Delete account permanently reset and destroy all balance entries with local ledger nodes. Proceed?")) {
      try {
        if (currentUser) {
          await dbService.deleteUserData(currentUser.uid);
          setCurrentUser(null);
          triggerModal('info', 'Secure Terminal Cleared', 'All persistent profile tags dismantled perfectly.');
        }
      } catch (err: any) {
        triggerModal('error', 'Security Block', 'Requires login refresh. Please log out and back in, then re-request deletion.');
      }
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    try {
      setUpdatingPass(true);
      await dbService.resetPassword(currentUser.email);
      triggerModal('success', 'Security Upgraded', `A secure password reset link has been dispatched to ${currentUser.email}. Please check your inbox and spam folder.`);
    } catch (err: any) {
      console.error(err);
      triggerModal('error', 'Operation Restricted', err.message || 'Could not dispatch secure password reset email. Please try again.');
    } finally {
      setUpdatingPass(false);
    }
  };

  const handleSaveMonetizationSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaveLoading(true);
      const updated: MonetizationSettings = {
        adsterraDirectLink: adminAdsterraLink.trim(),
        monetagSmartlink: adminMonetagLink.trim(),
        cpaLeadOfferwall: adminCpaLeadLink.trim(),
        shortVideoFeed: adminShortVidLink.trim(),
        microTasksOfferwall: adminMicroTasksLink.trim()
      };
      await dbService.saveMonetizationSettings(updated);
      setMonetizationSettings(updated);
      triggerModal('success', 'Earning Config Saved', 'Real monetization links are now active and custom-routed across user tasks!');
    } catch (err: any) {
      console.error(err);
      triggerModal('error', 'Sync Failed', err.message || 'Could not write monetization configurations.');
    } finally {
      setSaveLoading(false);
    }
  };

  const handleUpdateProfilePic = async (url: string) => {
    if (!currentUser) return;
    if (!url) {
      triggerModal('error', 'Empty Feed', 'Please select a valid image feed or input custom URL.');
      return;
    }
    try {
      await dbService.updatePicUrl(currentUser.uid, url);
      setCustomPicUrl('');
      triggerModal('success', 'Asset Synced', 'Your node avatar image and profile assets have been synchronized.');
    } catch (err: any) {
      console.error(err);
      triggerModal('error', 'Synchronization Failed', err.message || 'Could not write image path to security reference.');
    }
  };

  // Earning categories selection
  const handleOpenCategory = (cat: string) => {
    setTaskCategoryName(cat);
    setActiveView('tasks');
    
    // Resolve dynamic monetization URLs configured by app owner
    const adsterra = monetizationSettings?.adsterraDirectLink || '';
    const monetag = monetizationSettings?.monetagSmartlink || '';
    const cpaLead = monetizationSettings?.cpaLeadOfferwall || '';
    const shortVid = monetizationSettings?.shortVideoFeed || '';
    const microTasks = monetizationSettings?.microTasksOfferwall || '';

    // Standard high-converting ad and tracking fallbacks
    const defaultAd = adsterra || monetag || 'https://www.google.com/search?q=earn+money+online+testing';
    const defaultVid = shortVid || 'https://www.youtube.com/shorts/3pxjN3_qBv4';
    const defaultTask = cpaLead || microTasks || 'https://www.google.com/search?q=microtasks+earn+money+at+home';

    let list: Task[] = [];
    if (cat === 'Watch Ads') {
      list = [
        { 
          id: 'tk_ad_1', 
          title: adsterra ? 'Adsterra Smart CPM Redirect' : 'Premium Traffic Verification Link', 
          reward: 0.15, 
          destination: adsterra || 'https://www.adsterra.com', 
          category: 'Watch Ads' 
        },
        { 
          id: 'tk_ad_2', 
          title: monetag ? 'Monetag Live Monetized Ad' : 'Network Scalp Node Loop', 
          reward: 0.10, 
          destination: monetag || 'https://www.monetag.com', 
          category: 'Watch Ads' 
        },
        { 
          id: 'tk_ad_3', 
          title: 'Premium High-Yield Global Ad', 
          reward: 0.22, 
          destination: defaultAd, 
          category: 'Watch Ads' 
        }
      ];
    } else if (cat === 'Short Videos') {
      list = [
        { 
          id: 'tk_vid_1', 
          title: shortVid ? 'Monetized Video Portal V1' : 'Short Curated Media Node V1', 
          reward: 0.18, 
          destination: shortVid || 'https://www.youtube.com/shorts/3pxjN3_qBv4', 
          category: 'Short Videos' 
        },
        { 
          id: 'tk_vid_2', 
          title: 'Global Stream Validation Feed', 
          reward: 0.12, 
          destination: defaultVid, 
          category: 'Short Videos' 
        },
        { 
          id: 'tk_vid_3', 
          title: 'DeFi Wallet Verification Log', 
          reward: 0.25, 
          destination: defaultVid, 
          category: 'Short Videos' 
        }
      ];
    } else {
      list = [
        { 
          id: 'tk_mt_1', 
          title: cpaLead ? 'CPALead Live Offerwall tasks' : 'Submit Telegram Node Engagement', 
          reward: 0.35, 
          destination: cpaLead || 'https://www.cpalead.com', 
          category: 'Micro Tasks' 
        },
        { 
          id: 'tk_mt_2', 
          title: microTasks ? 'CPA Content Locker Rewards' : 'Global Identity App Validation Beta', 
          reward: 0.50, 
          destination: microTasks || 'https://www.cpalead.com', 
          category: 'Micro Tasks' 
        },
        { 
          id: 'tk_mt_3', 
          title: 'USDT Smart Contract Auditing Alpha', 
          reward: 0.80, 
          destination: defaultTask, 
          category: 'Micro Tasks' 
        }
      ];
    }
    setTasksList(list);
  };

  // Launch and track active Task simulation safely 
  const handleLaunchTask = (task: Task) => {
    // Determine countdown length: 30 seconds for live production and sandbox
    const length = 30;
    
    setActiveRunningTask(task);
    setTaskTimeRemaining(length);
    
    // Open partner page, with fallback safety in case window.open is blocked by iframe browser policy
    const win = window.open(task.destination, '_blank');
    if (!win) {
      console.warn("Popup blocked. Continuing task inside responsive embedded virtual tracker frame.");
    }

    if (taskIntervalId) clearInterval(taskIntervalId);

    const interval = setInterval(() => {
      setTaskTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleCompleteActiveTask(task);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    setTaskIntervalId(interval);
  };

  const handleCompleteActiveTask = async (task: Task) => {
    if (!currentUser) return;
    
    try {
      // Execute database update or sandbox local storage writing 
      await dbService.completeTask(currentUser.uid, task.id, task.title, task.reward);
      
      triggerModal(
        'success', 
        'Reward Credited!', 
        `Verification protocols cleared. $${task.reward.toFixed(2)} added instantly to your wallet.`
      );
    } catch (err: any) {
      triggerModal('error', 'Earning Sync Failed', err.message || 'Database write rules restricted transaction.');
    } finally {
      setActiveRunningTask(null);
    }
  };

  const handleCancelActiveTask = () => {
    if (taskIntervalId) clearInterval(taskIntervalId);
    setActiveRunningTask(null);
    triggerModal('info', 'Task Suspended', 'The current ad tracking or feed stream verification has been terminated.');
  };

  // Withdrawal logic
  const handleInitiateWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const amt = parseFloat(withdrawAmount);
    if (!withdrawNetwork || !withdrawAddress || !withdrawAmount) {
      triggerModal('warning', 'Missing Details', 'Provide USDT Network Protocol (TRC-20/BEP-20), destination wallet address, and USD amount.');
      return;
    }

    if (isNaN(amt) || amt < 30) {
      triggerModal('error', 'Limit Underflow', 'Network protocols reject payout allocation transfers under $30.00.');
      return;
    }

    if (amt > 500) {
      triggerModal('error', 'Limit Overflow', 'The system sets a maximum secure threshold limit of $500.00 per 24-hour cycle.');
      return;
    }

    if (amt > currentUser.balance) {
      triggerModal('error', 'Insufficient Liquidity', 'Your active balance falls below the requested payout allocation.');
      return;
    }

    try {
      await dbService.withdrawFunds(currentUser.uid, amt, withdrawNetwork, withdrawAddress);
      triggerModal(
        'success', 
        'Transfer Allocation Placed', 
        `Requested payout of $${amt.toFixed(2)} USDT routed to secure blockchain queue. Processing takes 2-5 business days.`
      );
      setWithdrawAmount('');
      setWithdrawAddress('');
      setWithdrawNetwork('');
    } catch (err: any) {
      triggerModal('error', 'Declined', err.message || 'Withdrawal route restricted by ledger safeguards.');
    }
  };

  // Submit support ticket
  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!supportSubject || !supportDescription) {
      triggerModal('warning', 'Required Streams', 'Please define ticket subject and complete descriptions.');
      return;
    }

    try {
      await dbService.fileTicket(
        currentUser.uid,
        currentUser.username,
        currentUser.fullname,
        currentUser.email,
        supportSubject,
        supportDescription,
        supportFile
      );
      triggerModal('success', 'Ticket Dispatched', 'Support desk has logged your issue parameters. Ref Ticket ID issued.');
      setSupportSubject('');
      setSupportDescription('');
      setSupportFile('');
      setActiveView('profile');
    } catch (err: any) {
      triggerModal('error', 'Failure', err.message);
    }
  };

  // Clipboard copy referral link
  const handleCopyReferralLink = () => {
    if (!currentUser) return;
    const link = `https://${window.location.host}/?ref=${currentUser.username}`;
    navigator.clipboard.writeText(link);
    triggerModal('success', 'Link Copied', 'Your secure affiliate referral invitation is locked into target clipboard!');
  };

  return (
    <div className="bg-[#0A0A0A] text-[#F5F5F5] font-sans min-h-screen flex flex-col justify-between selection:bg-accent selection:text-black">
      
      {/* Dynamic Upper Header Concept / Testing Phase Mode Selector */}
      <div className="hidden bg-[#111111] border-b border-white/10 px-4 py-2.5 flex items-center justify-between z-[60] text-xs font-medium">
        <div className="flex items-center space-x-2 text-gray-300">
          <Database className="w-4 h-4 text-accent" />
          <span className="font-sans text-[10px] uppercase tracking-[0.25em] text-[#F5F5F5]/60">Testing Environment</span>
          <span className="bg-accent/10 text-accent px-2.5 py-0.5 rounded-sm text-[9px] font-mono tracking-wider uppercase font-bold border border-accent/20">
            v1.2.4-Beta
          </span>
        </div>
        
        {/* Toggle between Sandbox / Live database modes instantly */}
        <div className="flex items-center space-x-2">
          <span className={`text-[9px] uppercase tracking-[0.2em] font-bold ${isSandbox ? 'text-accent' : 'text-emerald-400'}`}>
            {isSandbox ? 'Sandbox Mode' : 'Firebase Live'}
          </span>
          <button 
            onClick={() => handleToggleSandboxMode(!isSandbox)}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isSandbox ? 'bg-accent/85' : 'bg-white/10'}`}
          >
            <span
              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                isSandbox ? 'translate-x-0' : 'translate-x-4'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Global Interactive Modal Overlay */}
      <AnimatePresence>
        {modalActive && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111111] w-full max-w-sm rounded-sm border border-white/10 p-6 shadow-2xl shadow-black text-center"
            >
              <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4 border 
                ${modalStatusType === 'success' ? 'bg-accent/15 border-accent/30 text-accent' : ''}
                ${modalStatusType === 'info' ? 'bg-white/5 border-white/10 text-[#F5F5F5]/80' : ''}
                ${modalStatusType === 'warning' ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' : ''}
                ${modalStatusType === 'error' ? 'bg-red-500/15 border-red-500/30 text-red-500' : ''}
              `}>
                {modalStatusType === 'success' && <CheckCircle2 className="w-6 h-6" />}
                {modalStatusType === 'info' && <Info className="w-6 h-6" />}
                {modalStatusType === 'warning' && <AlertTriangle className="w-6 h-6" />}
                {modalStatusType === 'error' && <X className="w-6 h-6" />}
              </div>
              <h3 className="text-base font-bold text-white tracking-tight">{modalTitle}</h3>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">{modalMessage}</p>
              
              <button 
                onClick={() => setModalActive(false)}
                className="mt-6 w-full bg-white text-black font-bold py-3.5 px-4 rounded-sm text-xs font-sans tracking-widest uppercase hover:bg-accent transition duration-150"
              >
                Acknowledge
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Embedded Action Task Countdown Progress HUD */}
      <AnimatePresence>
        {activeRunningTask && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="bg-[#111111] border border-accent/30 rounded-sm max-w-sm w-full p-6 text-center space-y-4 shadow-xl shadow-black"
            >
              <div className="flex justify-between items-center pb-2 border-b border-white/10">
                <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-accent">Verify Earning Process</span>
                <button onClick={handleCancelActiveTask} className="text-gray-400 hover:text-white transition">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 py-4">
                <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="48" cy="48" r="40" stroke="rgba(255,255,255,0.05)" strokeWidth="6" fill="transparent" />
                    <circle cx="48" cy="48" r="40" stroke="#C1FF72" strokeWidth="6" fill="transparent"
                      strokeDasharray="251.2"
                      strokeDashoffset={(251.2 * (1 - taskTimeRemaining / 30)).toString()}
                      className="transition-all duration-1000 ease-linear"
                    />
                  </svg>
                  <span className="absolute text-2xl font-serif italic text-accent font-black tracking-tighter">{taskTimeRemaining}s</span>
                </div>

                <div className="pt-2">
                  <span className="text-[9px] uppercase tracking-widest text-[#F5F5F5]/40">Active Task ID: {activeRunningTask.id}</span>
                  <h4 className="text-lg font-serif italic text-white tracking-tight mt-1">{activeRunningTask.title}</h4>
                  <p className="text-xs text-gray-400 mt-1">Reward pool: <span className="text-accent font-bold">${activeRunningTask.reward.toFixed(2)}</span></p>
                </div>
              </div>

              <div className="space-y-2 pb-2">
                <p className="text-[11px] text-[#F5F5F5]/50 leading-relaxed">
                  Earn-alignment protocols request user focus. Keep ads active until the countdown validates session mapping.
                </p>
                
                <a 
                  href={activeRunningTask.destination} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="inline-flex items-center space-x-1.5 text-xs text-accent underline font-semibold hover:text-accent/80 pt-1"
                >
                  <span>Verify Ad Core Web Service</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="flex space-x-2.5 pt-2">
                <button 
                  onClick={handleCancelActiveTask} 
                  className="flex-1 bg-white/5 border border-white/10 text-gray-300 py-3.5 px-4 rounded-sm text-[10px] font-bold uppercase tracking-wider hover:bg-white/10 transition"
                >
                  Terminate
                </button>
                <button 
                  onClick={() => handleCompleteActiveTask(activeRunningTask)}
                  disabled={taskTimeRemaining > 0}
                  className="flex-1 bg-accent text-black disabled:bg-white/10 disabled:text-white/40 py-3.5 px-4 rounded-sm text-[10px] font-bold uppercase tracking-wider transition"
                >
                  {taskTimeRemaining > 0 ? "Analyzing..." : "Claim Reward"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* AUTH UI SCREEN (Sparsely decorated and visually modern) */}
      {!currentUser && !isLoadingAuth && (
        <div className="flex-1 flex flex-col justify-center p-6 max-w-md mx-auto w-full">
          <div className="text-center mb-8">
            <span className="font-sans text-[10px] uppercase tracking-[0.3em] opacity-50 mb-2 block">
              Global Security Workspace
            </span>
            <h1 className="text-4xl font-sans font-bold tracking-tighter text-white uppercase">
              SYNC.EARN <span className="text-accent font-normal italic font-serif lowercase">v1.2.4</span>
            </h1>
            <p className="text-xs text-gray-500 mt-2 font-medium">Verified microtask settlement node feed</p>
            
            {isSandbox && (
              <div className="mt-4 inline-flex items-center space-x-2 bg-accent/5 border border-accent/20 rounded-sm px-3.5 py-2.5 text-[11px] text-accent max-w-xs text-left">
                <Sparkles className="w-4 h-4 shrink-0 text-accent" />
                <span className="leading-snug"><strong>Sandbox mode enabled.</strong> Test credentials bypass firewalls. Start earning instantaneously.</span>
              </div>
            )}
          </div>

          <motion.div 
            layout
            className="bg-[#111111] p-6 rounded-sm border border-white/10 shadow-xl"
          >
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {isSignup && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="text-[9px] font-bold tracking-widest text-[#F5F5F5]/50 uppercase block mb-1">Full Name (As per ID)</label>
                    <input 
                      type="text" 
                      placeholder="e.g., JANE DOE" 
                      value={fullname}
                      onChange={(e) => setFullname(e.target.value)}
                      className="w-full bg-[#0A0A0A] p-4 rounded-sm border border-white/10 focus:border-accent outline-none text-xs text-white transition"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold tracking-widest text-[#F5F5F5]/50 uppercase block mb-1">Unique Username</label>
                    <input 
                      type="text" 
                      placeholder="e.g., janedoe" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-[#0A0A0A] p-4 rounded-sm border border-white/10 focus:border-accent outline-none text-xs text-white transition"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold tracking-widest text-[#F5F5F5]/50 uppercase block mb-1">Select Country</label>
                    <select 
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full bg-[#0A0A0A] p-4 rounded-sm border border-white/10 focus:border-accent outline-none text-xs text-white transition appearance-none"
                    >
                      <option value="" disabled>Choose Your Country</option>
                      <option value="Pakistan">Pakistan</option>
                      <option value="India">India</option>
                      <option value="Bangladesh">Bangladesh</option>
                      <option value="UAE">United Arab Emirates</option>
                      <option value="Saudi Arabia">Saudi Arabia</option>
                      <option value="USA">United States</option>
                      <option value="UK">United Kingdom</option>
                      <option value="Global">Other / International</option>
                    </select>
                  </div>
                </motion.div>
              )}

              <div>
                <label className="text-[9px] font-bold tracking-widest text-[#F5F5F5]/50 uppercase block mb-1">Email Address</label>
                <input 
                  type="email" 
                  placeholder="e.g., user@syncearn.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0A0A0A] p-4 rounded-sm border border-white/10 focus:border-accent outline-none text-xs text-white transition"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold tracking-widest text-[#F5F5F5]/50 uppercase block mb-1">Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0A0A0A] p-4 rounded-sm border border-white/10 focus:border-accent outline-none text-xs text-white transition"
                />
              </div>

              {isSignup && (
                <div>
                  <label className="text-[9px] font-bold tracking-widest text-[#F5F5F5]/50 uppercase block mb-1">Referral Code (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="Ref handler" 
                    value={referralCodeInput}
                    onChange={(e) => setReferralCodeInput(e.target.value)}
                    className="w-full bg-[#0A0A0A] p-4 rounded-sm border border-white/10 focus:border-accent outline-none text-xs text-accent tracking-wide font-mono transition"
                  />
                </div>
              )}

              <div className="pt-4 flex flex-col space-y-3">
                <button 
                  type="submit" 
                  className="w-full bg-white text-black py-4 rounded-sm font-bold text-xs uppercase tracking-[0.25em] hover:bg-accent hover:text-black transition duration-150 shadow-md"
                >
                  {isSignup ? 'CREATE SECURE ACCOUNT' : 'SIGN IN WORKSPACE'}
                </button>
                
                <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-widest px-1">
                  <button 
                    type="button" 
                    onClick={() => setIsSignup(!isSignup)} 
                    className="hover:text-accent underline transition"
                  >
                    {isSignup ? "Sign In" : "Register"}
                  </button>
                  {!isSignup && (
                    <button 
                      type="button" 
                      onClick={handlePasswordReset} 
                      className="hover:text-accent underline transition"
                    >
                      Reset Password
                    </button>
                  )}
                </div>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* LOADING WAITING SCREEN */}
      {isLoadingAuth && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <RotateCw className="w-8 h-8 text-accent animate-spin" />
          <p className="text-[10px] text-gray-400 font-medium font-mono mt-4 uppercase tracking-[0.25em]">
            Syncing secure ledger nodes...
          </p>
        </div>
      )}

      {/* LOGGED IN CORE PLATFORM UI */}
      {currentUser && !isLoadingAuth && (
        <div className="flex-1 flex flex-col h-full max-w-md mx-auto w-full overflow-hidden">
          
          <header className="bg-[#111111] border-b border-white/10 p-4 sticky top-0 z-[50] backdrop-blur-md shrink-0 flex justify-between items-center">
            <div className="flex items-center space-x-3 text-left">
              <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-sm font-serif italic text-accent font-bold bg-[#1a1a1a] shadow-lg overflow-hidden shrink-0">
                {currentUser.profilePicUrl ? (
                  <img src={currentUser.profilePicUrl} className="w-full h-full object-cover" alt="User avatar" />
                ) : (
                  currentUser.fullname.charAt(0)
                )}
              </div>
              <div>
                <h1 className="text-xs font-black text-white tracking-tight uppercase">
                  {currentUser.fullname}
                </h1>
                <p className="text-[10px] text-[#F5F5F5]/40 font-mono">
                  @{currentUser.username}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button 
                onClick={handleLogOut}
                className="text-xs border border-white/10 bg-white/5 text-gray-300 p-2.5 rounded-sm hover:bg-white/15 transition-all"
                title="Log Out Session"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-28 relative">
            
            {/* VIEW: DASHBOARD */}
            {activeView === 'dashboard' && (
              <div className="space-y-6">
                
                {/* Banner Welcome Info */}
                <div className="bg-gradient-to-br from-[#111] via-gray-950 to-[#0A0A0A] p-6 rounded-sm border border-white/10 shadow-xl relative overflow-hidden group text-left">
                  <div className="absolute -right-6 -bottom-6 text-accent/5 text-7xl font-serif font-black pointer-events-none select-none italic">
                    NT
                  </div>
                  <span className="font-sans text-[10px] uppercase tracking-[0.25em] text-accent mb-2 block">Active Ledger Node</span>
                  <h2 className="text-lg font-serif italic text-white tracking-tight">Welcome to <span className="text-accent font-sans font-bold tracking-tight uppercase not-italic">NT EARN HUB</span> <span className="text-accent">🚀</span></h2>
                  <p className="text-xs text-gray-400 mt-2 leading-relaxed font-sans">
                    The ultimate microtask settlement network. Turn your daily digital interactions into safe, instant payouts by validating high-yield cloud ad nodes, promotional video streams, and decentralized job validations.
                  </p>
                </div>

                {/* Editorial Capital Board layout */}
                <div className="bg-[#111111] border border-white/10 p-6 rounded-sm text-left relative overflow-hidden">
                  <span className="font-sans text-[10px] uppercase opacity-40 tracking-[0.3em] block mb-4">Accumulated Capital</span>
                  <div className="flex justify-between items-end">
                    <div className="relative">
                      <span className="text-6xl font-serif italic text-accent leading-none">
                        ${Math.floor(currentUser.balance)}
                      </span>
                      <span className="text-2xl font-sans font-light opacity-60">
                        .{(currentUser.balance % 1).toFixed(2).substring(2)}
                      </span>
                    </div>
                    
                    <div className="text-right">
                      <span className="text-[10px] uppercase opacity-40 tracking-widest block font-bold mb-1">Pending Funds</span>
                      <span className="text-lg font-sans font-medium text-amber-500 font-mono">
                        ${currentUser.pending.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Live Database status feedback banner to assist the developer */}
                {!isSandbox && (
                  <div className="bg-emerald-950/10 border border-emerald-500/20 p-4 rounded-sm text-left flex items-start space-x-3">
                    <CheckCircle2 className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[11px] text-accent font-bold uppercase tracking-[0.1em]">Cloud RTDB Synchronized</p>
                      <p className="text-[10px] text-gray-400 leading-normal">System verification, active stream nodes, and referrals are piped cleanly over real-time database secure paths.</p>
                    </div>
                  </div>
                )}

                {/* Earning Zone category nodes list */}
                <div className="text-left">
                  <div className="flex justify-between items-baseline mb-4">
                    <h3 className="text-[11px] uppercase opacity-50 tracking-[0.3em] font-sans">Earning Channels</h3>
                    <span className="text-[10px] tracking-widest opacity-40 font-mono">Select Feed</span>
                  </div>
                  
                  <div className="flex flex-col bg-[#111111] border border-white/10 divider divide-white/10 rounded-sm">
                    
                    <button 
                      onClick={() => handleOpenCategory('Watch Ads')}
                      className="p-6 hover:bg-[#1a1a1a] transition-all flex items-center justify-between group text-left"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="bg-accent/10 border border-accent/20 w-12 h-12 rounded-sm flex items-center justify-center text-accent group-hover:scale-105 transition-all">
                          <Tv className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-sm font-bold text-white block">Promotional Video Ads</span>
                          <span className="text-[10px] text-gray-400 tracking-tight">Ad server verified validation nodes</span>
                        </div>
                      </div>
                      <ChevronRight className="text-gray-500 w-4 h-4" />
                    </button>

                    <button 
                      onClick={() => handleOpenCategory('Short Videos')}
                      className="p-6 hover:bg-[#1a1a1a] transition-all border-t border-white/10 flex items-center justify-between group text-left"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="bg-accent/10 border border-accent/20 w-12 h-12 rounded-sm flex items-center justify-center text-accent group-hover:scale-105 transition-all">
                          <Play className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-sm font-bold text-white block">Short Video Streams</span>
                          <span className="text-[10px] text-gray-400 tracking-tight">Active media clustering validated feeds</span>
                        </div>
                      </div>
                      <ChevronRight className="text-gray-500 w-4 h-4" />
                    </button>

                    <button 
                      onClick={() => handleOpenCategory('Micro Tasks')}
                      className="p-6 hover:bg-[#1a1a1a] transition-all border-t border-white/10 flex items-center justify-between group text-left"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="bg-accent/10 border border-accent/20 w-12 h-12 rounded-sm flex items-center justify-center text-accent group-hover:scale-105 transition-all">
                          <ListCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="text-sm font-bold text-white block">Micro Job Settlements</span>
                          <span className="text-[10px] text-gray-400 tracking-tight">Verification social settlement validations</span>
                        </div>
                      </div>
                      <ChevronRight className="text-gray-500 w-4 h-4" />
                    </button>

                  </div>
                </div>

              </div>
            )}

            {/* VIEW: CATEGORY TASKS */}
            {activeView === 'tasks' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center space-x-3 text-left">
                    <button 
                      onClick={() => setActiveView('dashboard')} 
                      className="text-gray-400 hover:text-white transition-colors p-1"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                      <span className="text-[10px] uppercase tracking-[0.25em] opacity-40 block">Available Feed</span>
                      <h3 className="text-xl font-serif italic text-white tracking-tight">{taskCategoryName}</h3>
                    </div>
                  </div>
                  <span className="text-[10px] opacity-40 uppercase tracking-[0.15em]">{tasksList.length} Options Available</span>
                </div>

                <div className="flex flex-col bg-[#111] border border-white/10 rounded-sm">
                  {tasksList.length === 0 ? (
                    <div className="text-center p-8 text-xs text-gray-500">No active settlement sessions currently loaded.</div>
                  ) : (
                    tasksList.map((t, idx) => (
                      <div 
                        key={t.id} 
                        className={`p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center text-left ${idx > 0 ? 'border-t border-white/10' : ''}`}
                      >
                        <div className="space-y-1 pr-4 mb-3 sm:mb-0">
                          <span className="text-[9px] text-accent uppercase tracking-widest block font-bold">TASK INTEGRATION</span>
                          <h4 className="text-base text-[#F5F5F5] font-sans leading-snug">{t.title}</h4>
                          <span className="text-[10px] text-[#F5F5F5]/40 block font-mono">Process reward: <span className="text-accent font-bold">${t.reward.toFixed(2)}</span></span>
                        </div>
                        <button 
                          onClick={() => handleLaunchTask(t)}
                          className="bg-white text-black hover:bg-accent font-sans text-[10px] uppercase font-bold tracking-widest px-6 py-3 rounded-sm transition-all shadow-sm self-stretch sm:self-auto text-center"
                        >
                          Execute Task
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* VIEW: WALLET */}
            {activeView === 'wallet' && (
              <div className="space-y-6 text-left">
                <div className="p-6 bg-[#111111] border border-white/10 rounded-sm">
                  <div className="flex items-center space-x-2 text-accent mb-3">
                    <ShieldCheck className="w-5 h-5 font-bold" />
                    <span className="font-sans text-[10px] uppercase tracking-[0.25em] font-bold">Crypto Clearance Gateway</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Processing node handles settlements dynamically. Ensure exact USDT deposit network parameters are specified to block transit network losses.
                  </p>
                </div>

                <div className="bg-[#111111] p-6 rounded-sm border border-white/10 space-y-4">
                  <h3 className="text-sm font-sans font-bold uppercase tracking-[0.2em] pb-3 border-b border-white/10 text-white">Withdraw Capital</h3>
                  
                  <form onSubmit={handleInitiateWithdrawal} className="space-y-4">
                    <div className="space-[#111] space-y-2">
                      <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block">USDT Asset Network Protocol</label>
                      <select 
                        value={withdrawNetwork}
                        onChange={(e) => setWithdrawNetwork(e.target.value)}
                        className="w-full bg-[#0A0A0A] p-4 rounded-sm border border-white/10 focus:border-accent outline-none text-xs text-white transition appearance-none"
                      >
                        <option value="" disabled>Select Network Protocol</option>
                        <option value="TRC-20">USDT (TRC-20) - Tron Core System</option>
                        <option value="BEP-20">USDT (BEP-20) - Binance Smart Chain (BSC)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block">Target Core Wallet Address</label>
                      <input 
                        type="text" 
                        placeholder="Paste TRC20/BEP20 Address" 
                        value={withdrawAddress}
                        onChange={(e) => setWithdrawAddress(e.target.value)}
                        className="w-full bg-[#0A0A0A] p-4 rounded-sm border border-white/10 text-xs text-white font-mono outline-none focus:border-accent transition"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center px-1">
                        <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Payout Allocation Limit</label>
                        <span className="text-[9px] text-accent font-bold font-mono uppercase tracking-wider">
                          MIN $30 - MAX $500
                        </span>
                      </div>
                      <input 
                        type="number" 
                        placeholder="Amount in USD" 
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="w-full bg-[#0A0A0A] p-4 rounded-sm border border-white/10 text-xs font-bold text-white outline-none focus:border-accent transition"
                      />
                    </div>

                    <button 
                      type="submit" 
                      className="w-full bg-white text-black hover:bg-accent py-4 rounded-sm font-bold text-xs uppercase tracking-[0.2em] shadow-md transition-all active:scale-[0.98]"
                    >
                      Initiate Safe Transfer
                    </button>
                  </form>
                </div>
              </div>
            )}

            {/* VIEW: REFERRALS */}
            {activeView === 'referrals' && (
              <div className="space-y-6 text-left">
                
                <div className="p-6 bg-[#111111] border border-white/10 rounded-sm">
                  <div className="flex items-center space-x-2 text-[#C1FF72] mb-3">
                    <Users className="w-5 h-5 text-accent" />
                    <span className="font-sans text-[10px] uppercase tracking-[0.25em] font-bold">Passive Affiliate Distribution</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    Build your sub-tier media validators. Unlock an automatic 10% cash commission loop on every advertising and streaming settlement completed inside their workspace.
                  </p>
                </div>

                <div className="bg-[#111111] p-6 rounded-sm border border-white/10 text-center relative overflow-hidden">
                  <p className="text-[10px] text-gray-500 uppercase tracking-[0.3em] font-black mb-1">Affiliate Distribution Ledger</p>
                  <h3 className="text-3xl font-serif italic text-accent mb-6 font-black">${currentUser.refEarnings.toFixed(4)}</h3>

                  <p className="text-xs text-gray-400 mb-2 font-bold uppercase tracking-widest text-[9px]">Invitation Node URL</p>
                  <div className="flex items-center space-x-2 bg-[#0A0A0A] p-2 rounded-sm border border-white/10">
                    <input 
                      type="text" 
                      readOnly 
                      value={`https://${window.location.host}/?ref=${currentUser.username}`}
                      className="flex-1 bg-transparent text-[11px] text-accent outline-none px-2 font-mono scrollbar-none"
                    />
                    <button 
                      onClick={handleCopyReferralLink}
                      className="bg-white text-black hover:bg-accent p-2 px-4 rounded-sm text-[10px] font-bold uppercase tracking-widest flex items-center space-x-1.5 transition-all"
                    >
                      <Copy className="w-3" />
                      <span>Copy</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">My Activated Network</h3>
                  <div className="bg-[#111111] rounded-sm border border-white/10 divide-y divide-white/10 overflow-hidden">
                    {referralList.length === 0 ? (
                      <div className="p-6 text-xs text-gray-500 text-center">No active credentials registered. Promote invitation link above.</div>
                    ) : (
                      referralList.map((ref) => (
                        <div key={ref.id} className="p-4 flex justify-between items-center hover:bg-white/5 transition duration-150">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-full border border-accent/20 bg-accent/10 text-accent flex items-center justify-center font-serif italic text-xs font-bold uppercase">
                              {ref.fromUser.charAt(0)}
                            </div>
                            <div>
                              <p className="text-xs font-bold text-white">{ref.fromUser}</p>
                              <p className="text-[9px] text-gray-500 font-mono">{ref.date}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-bold text-accent block font-mono">+${ref.commission.toFixed(4)}</span>
                            <span className="text-[8px] text-gray-500 uppercase tracking-widest font-bold">10% commission</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* VIEW: TRANSACTION HISTORY */}
            {activeView === 'history' && (
              <div className="space-y-4 text-left">
                <div className="flex justify-between items-baseline mb-2">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">Transaction Ledger</h3>
                  <span className="text-[9px] font-mono text-gray-500 uppercase">{transactionList.length} items logged</span>
                </div>
                
                <div className="flex flex-col bg-[#111] border border-white/10 divide-y divide-white/10 rounded-sm">
                  {transactionList.length === 0 ? (
                    <div className="p-8 text-xs text-gray-500 text-center">
                      Ledger is empty. Accumulate rewards to initialize transactional mapping.
                    </div>
                  ) : (
                    transactionList.map((tx) => (
                      <div key={tx.id} className="p-5 flex justify-between items-center hover:bg-white/5 transition-all">
                        <div className="space-y-1.5 pr-2">
                          <span className={`text-[8px] font-black tracking-widest uppercase px-2 py-0.5 rounded-sm block w-max
                            ${tx.type === 'Task Reward' ? 'bg-accent/10 text-accent border border-accent/20' : ''}
                            ${tx.type === 'Withdrawal Request' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : ''}
                          `}>
                            {tx.type}
                          </span>
                          <span className="text-xs text-white block leading-tight font-sans">{tx.details}</span>
                          <span className="text-[9px] text-gray-500 block font-mono">{tx.date}</span>
                        </div>
                        <div className="text-right shrink-0">
                          <span className={`text-sm font-bold block font-sans
                            ${tx.type === 'Task Reward' ? 'text-accent' : 'text-amber-500'}
                          `}>
                            {tx.type === 'Task Reward' ? '+' : '-'}${tx.amount.toFixed(2)}
                          </span>
                          <span className={`text-[8px] uppercase tracking-widest font-bold block mt-1
                            ${tx.status === 'completed' ? 'text-accent' : ''}
                            ${tx.status === 'pending' ? 'text-amber-400 animate-pulse' : ''}
                            ${tx.status === 'rejected' ? 'text-red-500' : ''}
                          `}>
                            {tx.status}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* VIEW: PROFILE */}
            {activeView === 'profile' && (
              <div className="space-y-6 text-left">
                
                <div className="p-5 bg-[#111111] border border-white/10 rounded-sm flex items-center space-x-4">
                  <div className="w-14 h-14 border border-accent/20 bg-accent/15 text-accent rounded-full flex items-center justify-center text-xl font-serif italic font-bold shadow-lg overflow-hidden shrink-0 uppercase">
                    {currentUser.profilePicUrl ? (
                      <img src={currentUser.profilePicUrl} className="w-full h-full object-cover" alt="User avatar profile" />
                    ) : (
                      currentUser.fullname.charAt(0)
                    )}
                  </div>
                  <div className="space-y-0.5 flex-1">
                    <span className="text-[9px] uppercase tracking-[0.2em] opacity-40">System Core Node</span>
                    <h4 className="text-sm font-black text-white tracking-tight leading-none mt-1">{currentUser.fullname}</h4>
                    <p className="text-xs text-accent font-mono font-medium">@{currentUser.username}</p>
                    <p className="text-[10px] text-gray-500">{currentUser.email}</p>
                    <span className="inline-block text-[9px] bg-white/5 border border-white/10 text-gray-400 px-2.5 py-0.5 rounded-sm font-bold uppercase mt-1.5 font-mono">
                      {currentUser.country}
                    </span>
                  </div>
                </div>

                {/* SETTINGS: UPDATE PROFILE PICTURE & PASSWORD */}
                <div className="bg-[#111111] border border-white/10 rounded-sm p-5 space-y-6 shadow-xl">
                  {/* UPDATE PROFILE PICTURE */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-bold text-accent uppercase tracking-[0.2em] flex items-center">
                      <span className="w-1.5 h-1.5 bg-accent rounded-full inline-block mr-2"></span>
                      Update Profile Picture
                    </h3>
                    
                    {/* Predefined Modern Premium Avatars */}
                    <div className="space-y-2">
                      <p className="text-[10px] text-gray-400 font-sans">Select from high-quality decentralized avatar presets:</p>
                      <div className="grid grid-cols-6 gap-2">
                        {[
                          { name: 'Felix', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Felix' },
                          { name: 'Aneka', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Aneka' },
                          { name: 'Nala', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Nala' },
                          { name: 'Jack', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Jack' },
                          { name: 'Peanut', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Peanut' },
                          { name: 'Buster', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Buster' }
                        ].map((av) => (
                          <button
                            key={av.name}
                            type="button"
                            onClick={() => handleUpdateProfilePic(av.url)}
                            className={`w-10 h-10 rounded-full border bg-black/40 overflow-hidden hover:scale-105 transition flex items-center justify-center p-1 cursor-pointer ${
                              currentUser.profilePicUrl === av.url ? 'border-accent ring-1 ring-accent' : 'border-white/10'
                            }`}
                            title={`Select ${av.name}`}
                          >
                            <img src={av.url} className="w-full h-full object-contain animate-fade-in" alt={av.name} referrerPolicy="no-referrer" />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom URL Field */}
                    <div className="space-y-2 pt-2 border-t border-white/5">
                      <p className="text-[10px] text-gray-400 font-sans">Or enter a custom image URL address:</p>
                      <div className="flex gap-2">
                        <input
                          type="url"
                          placeholder="https://example.com/avatar.png"
                          value={customPicUrl}
                          onChange={(e) => setCustomPicUrl(e.target.value)}
                          className="flex-1 bg-black/60 border border-white/10 text-xs px-3 py-2 rounded-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent"
                        />
                        <button
                          type="button"
                          onClick={() => handleUpdateProfilePic(customPicUrl)}
                          className="bg-white text-black hover:bg-accent hover:text-black hover:shadow-[0_0_15px_rgba(193,255,114,0.3)] transition text-xs font-black uppercase px-4 py-2 rounded-sm tracking-widest shrink-0"
                        >
                          Save URL
                        </button>
                      </div>
                    </div>
                  </div>
                         {/* UPDATE PASSWORD FORM */}
                  <form onSubmit={handleUpdatePassword} className="space-y-4 pt-4 border-t border-white/10 text-left">
                    <h3 className="text-xs font-bold text-accent uppercase tracking-[0.2em] flex items-center">
                      <span className="w-1.5 h-1.5 bg-accent rounded-full inline-block mr-2 animate-pulse"></span>
                      Secure Password Reset
                    </h3>
                    <p className="text-[11px] text-gray-400 font-sans leading-relaxed">
                      Your registered email address is: <span className="text-white font-mono font-bold">{currentUser.email}</span>. 
                      In accordance with security protocols, if you wish to reset or change your password, please click the button below to receive a secure reset link at your email address.
                    </p>

                    <button
                      type="submit"
                      disabled={updatingPass}
                      className="w-full bg-accent text-black hover:bg-white hover:text-black hover:shadow-lg transition duration-200 text-xs font-black uppercase py-3 rounded-sm tracking-widest flex items-center justify-center space-x-2 cursor-pointer"
                    >
                      {updatingPass ? (
                        <span>Sending Secure Email...</span>
                      ) : (
                        <span>Send Password Reset Email Link ✉️</span>
                      )}
                    </button>
                  </form>
                 {/* ADMIN / MONETIZATION CONTROL PANEL */}
                {isAdmin && (
                  <div className="bg-[#111111] border border-accent/20 rounded-sm p-5 space-y-4 shadow-xl">
                    <div className="flex justify-between items-center pb-3 border-b border-white/10">
                      <h3 className="text-xs font-bold text-accent uppercase tracking-[0.2em] flex items-center">
                        <span className="w-1.5 h-1.5 bg-accent rounded-full inline-block mr-2 animate-ping"></span>
                        Earning Settings & Adsterra / Monetag Setup
                      </h3>
                      <span className="bg-accent/10 text-accent font-mono text-[8px] font-bold px-2 py-0.5 rounded leading-none border border-accent/20">
                        APP OWNER ONLY
                      </span>
                    </div>

                    <p className="text-[11px] text-gray-400 font-sans leading-relaxed">
                      Configure your real ad network scripts, direct links, and survey gateways here. Customization instantly enables CPM web monetization, generating real revenue for you under your credentials when users execute tasks!
                    </p>

                    <form onSubmit={handleSaveMonetizationSettings} className="space-y-4">
                      <div className="space-y-4">
                        {/* Adsterra Link */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">
                            Adsterra Direct Link (CPM Ads)
                          </label>
                          <input
                            type="url"
                            placeholder="Paste your Adsterra Direct Link (e.g. https://mocklink.com/1234)"
                            value={adminAdsterraLink}
                            onChange={(e) => setAdminAdsterraLink(e.target.value)}
                            className="w-full bg-black/60 border border-white/10 text-xs px-3 py-2.5 rounded-sm text-white focus:outline-none focus:border-accent"
                          />
                          
                        </div>

                        {/* Monetag SmartLink */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">
                            Monetag / PropellerAds Smartlink
                          </label>
                          <input
                            type="url"
                            placeholder="Paste your Monetag Smartlink (e.g. https://xml.monetag.com/your-id)"
                            value={adminMonetagLink}
                            onChange={(e) => setAdminMonetagLink(e.target.value)}
                            className="w-full bg-black/60 border border-white/10 text-xs px-3 py-2.5 rounded-sm text-white focus:outline-none focus:border-accent"
                          />
                          
                        </div>

                        {/* CPALead Link */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">
                            CPALead Offerwall / CPA Content Gateway
                          </label>
                          <input
                            type="url"
                            placeholder="Paste CPALead Offerwall link (e.g. https://eeoff.com/your-offer-id)"
                            value={adminCpaLeadLink}
                            onChange={(e) => setAdminCpaLeadLink(e.target.value)}
                            className="w-full bg-black/60 border border-white/10 text-xs px-3 py-2.5 rounded-sm text-white focus:outline-none focus:border-accent"
                          />
                          
                        </div>

                        {/* Premium Short Video Portal Link */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">
                            Short Video Earning Hub / Video Offerwall Link
                          </label>
                          <input
                            type="url"
                            placeholder="Paste monetized video playlist or Lootably/HideoutTV link"
                            value={adminShortVidLink}
                            onChange={(e) => setAdminShortVidLink(e.target.value)}
                            className="w-full bg-black/60 border border-white/10 text-xs px-3 py-2.5 rounded-sm text-white focus:outline-none focus:border-accent"
                          />
                          <span className="text-[8px] text-gray-500 block leading-tight">
                            URL for monetized video channels or custom viral content.
                          </span>
                        </div>

                        {/* Alternative Micro Tasks Link */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block">
                            Micro Tasks / Survey Gateway Link (Alternative)
                          </label>
                          <input
                            type="url"
                            placeholder="Paste generic task wall web link"
                            value={adminMicroTasksLink}
                            onChange={(e) => setAdminMicroTasksLink(e.target.value)}
                            className="w-full bg-black/60 border border-white/10 text-xs px-3 py-2.5 rounded-sm text-white focus:outline-none focus:border-accent"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={saveLoading}
                        className="w-full bg-accent text-black hover:bg-white hover:text-black hover:shadow-lg transition duration-200 text-xs font-black uppercase py-4 rounded-sm tracking-widest flex items-center justify-center space-x-2 cursor-pointer"
                      >
                        {saveLoading ? (
                          <span>Updating Monetization Routes...</span>
                        ) : (
                          <span>Save Real Earning Settings 🚀</span>
                        )}
                      </button>
                    </form>
                  </div>
                )}
                </div>

                <div className="bg-[#111111] border border-white/10 rounded-sm divide-y divide-white/10 overflow-hidden shadow-lg">
                  
                  <div 
                    onClick={() => setActiveView('support')}
                    className="p-5 flex justify-between items-center hover:bg-white/5 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center space-x-3">
                      <Headphones className="w-4 h-4 text-accent shrink-0" />
                      <span className="text-xs font-bold text-gray-300 group-hover:text-white transition">Contact Support Ticket Desk</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-650" />
                  </div>

                  <div 
                    onClick={handleLogOut}
                    className="p-5 flex justify-between items-center hover:bg-white/5 cursor-pointer transition text-red-500"
                  >
                    <div className="flex items-center space-x-3">
                      <LogOut className="w-4 h-4 text-red-500 shrink-0" />
                      <span className="text-xs font-bold transition">Log Out Workspace Session</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-red-500/30" />
                  </div>

                  <div 
                    onClick={handleDeleteAccount}
                    className="p-5 flex justify-between items-center hover:bg-red-500/10 cursor-pointer transition text-red-500"
                  >
                    <div className="flex items-center space-x-3">
                      <Trash2 className="w-4 h-4 text-red-600 shrink-0" />
                      <span className="text-xs font-bold transition">Permanently Terminate Account</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-red-650" />
                  </div>

                </div>

              </div>
            )}

            {/* VIEW: SUPPORT */}
            {activeView === 'support' && (
              <div className="space-y-4 text-left">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center space-x-3">
                    <button 
                      onClick={() => setActiveView('profile')} 
                      className="text-gray-400 hover:text-white p-1 transition"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                      <span className="text-[10px] uppercase opacity-40 tracking-widest block">Core Node Help</span>
                      <h3 className="text-xl font-serif italic text-white tracking-tight">Support Ticket Desk</h3>
                    </div>
                  </div>
                </div>

                <div className="bg-[#111111] p-6 rounded-sm border border-white/10 space-y-4">
                  <form onSubmit={handleSupportSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Your Full Name</label>
                        <input 
                          type="text" 
                          readOnly 
                          value={currentUser.fullname} 
                          className="w-full bg-[#0A0A0A] p-3 rounded-sm border border-white/10 text-xs text-gray-500 outline-none select-none cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Your Username</label>
                        <input 
                          type="text" 
                          readOnly 
                          value={`@${currentUser.username}`} 
                          className="w-full bg-[#0A0A0A] p-3 rounded-sm border border-white/10 text-xs text-accent outline-none select-none cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Account Email Node</label>
                      <input 
                        type="text" 
                        readOnly 
                        value={currentUser.email} 
                        className="w-full bg-[#0A0A0A] p-3 rounded-sm border border-white/10 text-xs text-gray-500 outline-none select-none cursor-not-allowed"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-300 uppercase block mb-1">Ticket Subject</label>
                      <input 
                        type="text" 
                        placeholder="e.g., Blocked deposit delay, App bug" 
                        value={supportSubject}
                        onChange={(e) => setSupportSubject(e.target.value)}
                        className="w-full bg-[#0A0A0A] p-4 rounded-sm border border-white/10 text-xs text-white outline-none focus:border-accent transition"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-gray-300 uppercase block mb-1">Detailed Description</label>
                      <textarea 
                        rows={4} 
                        placeholder="Detail your issue..." 
                        value={supportDescription}
                        onChange={(e) => setSupportDescription(e.target.value)}
                        className="w-full bg-[#0A0A0A] p-4 rounded-sm border border-white/10 text-xs text-white outline-none focus:border-accent transition resize-none"
                      />
                    </div>

                    <button 
                      type="submit" 
                      className="w-full bg-white text-black hover:bg-accent py-4 rounded-sm font-bold text-xs uppercase tracking-widest shadow-md transition-all active:scale-[0.98]"
                    >
                      File Support Ticket
                    </button>
                  </form>
                </div>
              </div>
            )}

          </main>

          {/* CORE NAVIGATION BAR */}
          <nav className="bg-[#111111] border-t border-white/10 px-2 h-20 shrink-0 flex items-center justify-between sticky bottom-0 left-0 right-0 z-50 w-full shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.9)]">
            <button 
              onClick={() => setActiveView('dashboard')} 
              className={`flex flex-col items-center justify-center space-y-1 flex-1 h-full transition duration-150 ${
                activeView === 'dashboard' || activeView === 'tasks' ? 'text-accent font-bold font-sans' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Tv className="w-5 h-5" />
              <span className="tracking-widest uppercase font-bold text-[8px]">Home</span>
            </button>
            
            <button 
              onClick={() => setActiveView('wallet')} 
              className={`flex flex-col items-center justify-center space-y-1 flex-1 h-full transition duration-150 ${
                activeView === 'wallet' ? 'text-accent font-bold' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Wallet className="w-5 h-5" />
              <span className="tracking-widest uppercase font-bold text-[8px]">Wallet</span>
            </button>
            
            <button 
              onClick={() => setActiveView('referrals')} 
              className={`flex flex-col items-center justify-center space-y-1 flex-1 h-full transition duration-150 ${
                activeView === 'referrals' ? 'text-accent font-bold' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Users className="w-5 h-5" />
              <span className="tracking-widest uppercase font-bold text-[8px]">Invite</span>
            </button>
            
            <button 
              onClick={() => setActiveView('history')} 
              className={`flex flex-col items-center justify-center space-y-1 flex-1 h-full transition duration-150 ${
                activeView === 'history' ? 'text-accent font-bold' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <Clock className="w-5 h-5" />
              <span className="tracking-widest uppercase font-bold text-[8px]">Ledger</span>
            </button>
            
            <button 
              onClick={() => setActiveView('profile')} 
              className={`flex flex-col items-center justify-center space-y-1 flex-1 h-full transition duration-150 ${
                activeView === 'profile' || activeView === 'support' ? 'text-accent font-bold' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <User className="w-5 h-5" />
              <span className="tracking-widest uppercase font-bold text-[8px]">Profile</span>
            </button>
          </nav>

        </div>
      )}

    </div>
  );
}

