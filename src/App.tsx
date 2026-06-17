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
  AlertTriangle,
  RotateCw,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { dbService } from './dbService';
import { UserProfile, Task, Transaction, ReferralRecord, MonetizationSettings } from './types';

export default function App() {
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

  // Monitor database connection state or authorization (Strictly Live Production)
  useEffect(() => {
    setIsLoadingAuth(true);
    dbService.setMode(false); // Force Live Firebase Mode

    let unsubProfile: (() => void) | null = null;
    const unsubAuth = dbService.onAuthStateChanged((user) => {
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      if (user) {
        unsubProfile = dbService.subscribeToProfile(user.uid, (profile) => {
          setCurrentUser(profile);
          if (profile) {
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
  }, []);

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
  }, []);

  const setupLiveFeeds = (uid: string) => {
    dbService.subscribeToReferrals(uid, (refs) => setReferralList(refs));
    dbService.subscribeToTransactions(uid, (txs) => setTransactionList(txs));
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
        triggerModal('info', 'Verification Outbound', 'A secure link has been sent to your email. Confirm verification prior to logging in.');
        setIsSignup(false);
      } else {
        await dbService.signIn(email, password);
        // Live handles it via Auth State Changed callback automatically
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
    // Determine countdown length: 30 seconds for live production
    const length = 30;
    
    setActiveRunningTask(task);
    setTaskTimeRemaining(length);
    
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

      {/* AUTH UI SCREEN */}
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

            <div className="flex items-center space-x-2