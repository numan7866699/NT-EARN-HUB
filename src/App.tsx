import React, { useState, useEffect } from 'react';
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
  ShieldCheck, 
  Copy, 
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
  Eye,
  EyeOff,
  Lock,
  Mail,
  Globe,
  Tag
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { dbService } from './dbService';
import { UserProfile, Task, Transaction, ReferralRecord, MonetizationSettings } from './types';

export default function App() {
  const [isSandbox, setIsSandbox] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean>(true);

  // TICKING TIMER STATE
  const [currentSyncTime, setCurrentSyncTime] = useState<number>(Date.now());
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setCurrentSyncTime(Date.now());
    }, 60000);
    return () => clearInterval(timerInterval);
  }, []);

  const ADMIN_EMAILS = [
    'onlineexpert912@gmail.com',
    'admin@app.com',
    'admin@gmail.com'
  ];
  const isAdmin = currentUser && (
    ADMIN_EMAILS.includes((currentUser.email || '').toLowerCase()) ||
    (currentUser.username || '').toLowerCase() === 'admin'
  );
  
  const [activeView, setActiveView] = useState<string>('dashboard');
  const [taskCategoryName, setTaskCategoryName] = useState<string>('');
  
  const [isSignup, setIsSignup] = useState<boolean>(false);
  const [isAuthProcessing, setIsAuthProcessing] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullname, setFullname] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [country, setCountry] = useState<string>('');
  const [referralCodeInput, setReferralCodeInput] = useState<string>('');

  const [referralList, setReferralList] = useState<ReferralRecord[]>([]);
  const [transactionList, setTransactionList] = useState<Transaction[]>([]);
  const [tasksList, setTasksList] = useState<Task[]>([]);

  const [activeRunningTask, setActiveRunningTask] = useState<Task | null>(null);
  const [taskTimeRemaining, setTaskTimeRemaining] = useState<number>(0);
  const [taskIntervalId, setTaskIntervalId] = useState<any>(null);
  
  const [withdrawNetwork, setWithdrawNetwork] = useState<string>('');
  const [withdrawAddress, setWithdrawAddress] = useState<string>('');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');

  const [supportSubject, setSupportSubject] = useState<string>('');
  const [supportDescription, setSupportDescription] = useState<string>('');
  const [supportFile, setSupportFile] = useState<string>('');

  const [modalActive, setModalActive] = useState<boolean>(false);
  const [modalTitle, setModalTitle] = useState<string>('');
  const [modalMessage, setModalMessage] = useState<string>('');
  const [modalStatusType, setModalStatusType] = useState<'success' | 'info' | 'warning' | 'error'>('info');

  const [monetizationSettings, setMonetizationSettings] = useState<MonetizationSettings | null>(null);
  const [monetizationLoading, setMonetizationLoading] = useState<boolean>(false);
  const [saveLoading, setSaveLoading] = useState<boolean>(false);

  const [adminAdsterraLink, setAdminAdsterraLink] = useState<string>('');
  const [adminMonetagLink, setAdminMonetagLink] = useState<string>('');
  const [adminCpaLeadLink, setAdminCpaLeadLink] = useState<string>('');
  const [adminShortVidLink, setAdminShortVidLink] = useState<string>('');
  const [adminMicroTasksLink, setAdminMicroTasksLink] = useState<string>('');

  const [customPicUrl, setCustomPicUrl] = useState<string>('');
  const [updatingPass, setUpdatingPass] = useState<boolean>(false);
  
  const [adClickCount, setAdClickCount] = useState(0);

  const handleSmartAdClick = () => {
    if (!monetizationSettings) {
      triggerModal('warning', 'Loading', 'Monetization protocols are syncing. Please try again in a few seconds.');
      return;
    }

    const DYNAMIC_ROTATOR_LINKS = [
      monetizationSettings.adsterraDirectLink,       
      monetizationSettings.monetagSmartlink,         
      monetizationSettings.shortVideoFeed,           
      monetizationSettings.microTasksOfferwall       
    ].filter(link => link && link.trim() !== "");    

    if (DYNAMIC_ROTATOR_LINKS.length === 0) {
      triggerModal('error', 'No Ads Available', 'Admin has not configured ad links yet.');
      return;
    }

    const nextLink = DYNAMIC_ROTATOR_LINKS[adClickCount % DYNAMIC_ROTATOR_LINKS.length];
    setAdClickCount(prev => prev + 1);
    window.open(nextLink, '_blank');
  };
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      setReferralCodeInput(ref);
      setIsSignup(true);
    }
  }, []);

  useEffect(() => {
    setIsLoadingAuth(true);
    dbService.setMode(isSandbox);

    if (isSandbox) {
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
      let unsubProfile: (() => void) | null = null;
      const unsubAuth = dbService.onAuthStateChanged((user) => {
        if (unsubProfile) {
          unsubProfile();
          unsubProfile = null;
        }

        if (user) {
          if (!isSandbox && user.emailVerified === false) {
            setCurrentUser(null);
            setIsLoadingAuth(false);
            return; 
          }

          unsubProfile = dbService.subscribeToProfile(user.uid, (profile) => {
            if (profile) {
              setCurrentUser(profile);
              setupLiveFeeds(profile.uid);
            } else {
              setCurrentUser(null);
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

  const triggerModal = (type: 'success' | 'info' | 'warning' | 'error', title: string, msg: string) => {
    setModalStatusType(type);
    setModalTitle(title);
    setModalMessage(msg);
    setModalActive(true);
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      triggerModal('warning', 'Empty Fields', 'Please specify both authorization credentials.');
      return;
    }

    try {
      setIsAuthProcessing(true);
      
      if (isSignup) {
        if (!fullname || !username || !country) {
          triggerModal('warning', 'Missing Registration Profile', 'Please complete all profile parameter nodes.');
          setIsAuthProcessing(false);
          return;
        }
        await dbService.signUp(email, password, fullname, username, country, referralCodeInput);
        if (isSandbox) {
          triggerModal('success', 'Profile Created', 'Test Sandbox Profile generated successfully! No verification is required.');
          setIsSignup(false);
        } else {
          triggerModal('success', 'Account Created Successfully!', 'A secure link has been sent to your email. Please check your Inbox/Spam folder to verify before signing in.');
          setIsSignup(false);
          setPassword('');
        }
      } else {
        const profile = await dbService.signIn(email, password);
        if (isSandbox) {
          setCurrentUser(profile);
          loadSandboxFeeds(profile.uid);
          triggerModal('success', 'Workspace Activated', `Welcome back, test worker ${profile.fullname}!`);
        } else {
          setCurrentUser(profile); 
          triggerModal('success', 'Workspace Activated', `Welcome back, ${profile.fullname || profile.username}!`);
        }
      }
    } catch (err: any) {
      if (err.message === 'EMAIL_UNVERIFIED') {
        triggerModal('warning', 'Email Unverified', 'Verify your email prior to dashboard access. Check spam folders.');
      } else {
        triggerModal('error', 'Authentication Denied', err.message || 'System was unable to authorize credentials.');
      }
    } finally {
      setIsAuthProcessing(false);
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
      triggerModal('error', 'Synchronization Failed', err.message || 'Could not write image path to security reference.');
    }
  };

  // --- NEW PRECISION LOCKING LOGIC ---
  const getTaskLockMs = (taskId: string): number => {
    if (!currentUser || !currentUser.completedTasks) return 0;
    const completedAt = currentUser.completedTasks[taskId];
    if (!completedAt) return 0;
    const elapsed = currentSyncTime - completedAt;
    const twentyFourHours = 24 * 60 * 60 * 1000;
    if (elapsed >= twentyFourHours) return 0;
    return twentyFourHours - elapsed;
  };

  const formatLockRemaining = (ms: number): string => {
    const totalMins = Math.floor(ms / 60000);
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return `${h}h ${m}m`;
  };

  const getCategoryDetails = (cat: string) => {
    let ids: string[] = [];
    if (cat === 'Watch Ads') {
      for (let i = 1; i <= 50; i++) ids.push(`tk_ad_${i}`);
    } else if (cat === 'Short Videos') {
      for (let i = 1; i <= 6; i++) ids.push(`tk_vid_${i}`); 
    } else if (cat === 'Micro Tasks') {
      ids = ['tk_nt_1', 'tk_nt_2', 'tk_nt_3', 'tk_nt_4', 'tk_nt_5'];
    }

    if (ids.length === 0) return { isLocked: false, remainingMs: 0, completedCount: 0, totalCount: 0 };

    let completedCount = 0;
    let timeUntilNextUnlock = Infinity;

    ids.forEach(id => {
      const lockMs = getTaskLockMs(id);
      if (lockMs > 0) {
        completedCount++;
        if (lockMs < timeUntilNextUnlock) timeUntilNextUnlock = lockMs;
      }
    });

    const isLocked = completedCount === ids.length;
    return {
      isLocked,
      remainingMs: isLocked ? timeUntilNextUnlock : 0,
      completedCount,
      totalCount: ids.length
    };
  };

  const handleOpenCategory = (cat: string) => {
    const details = getCategoryDetails(cat);
    if (details.isLocked) {
      triggerModal('warning', 'Category Locked', `You have completed all ${details.totalCount} tasks in this sector. Cooldown protocol requires a wait of ${formatLockRemaining(details.remainingMs)}.`);
      return;
    }
    
    setTaskCategoryName(cat);
    setActiveView('tasks');
    
    const adsterra = monetizationSettings?.adsterraDirectLink || '';
    const monetag = monetizationSettings?.monetagSmartlink || '';
    const cpaLead = monetizationSettings?.cpaLeadOfferwall || '';
    const shortVid = monetizationSettings?.shortVideoFeed || '';
    const microTasks = monetizationSettings?.microTasksOfferwall || '';

    const defaultAd = adsterra || monetag || 'https://www.google.com/search?q=earn+money+online+testing';
    const defaultVid = shortVid || 'https://www.youtube.com/shorts/3pxjN3_qBv4';
    const defaultTask = cpaLead || microTasks || 'https://www.google.com/search?q=microtasks+earn+money+at+home';

    let list: Task[] = [];
    if (cat === 'Watch Ads') {
      const titles = ["Global Media Ad", "Premium Network Verification", "Smart Route Node", "High-Yield Validator", "Direct Traffic Node"];
      for (let i = 1; i <= 50; i++) {
        list.push({
          id: `tk_ad_${i}`,
          title: `${titles[i % titles.length]} - Phase ${i}`, 
          reward: i % 3 === 0 ? 0.005 : 0.003, 
          destination: defaultAd,
          category: 'Watch Ads'
        });
      }
    } else if (cat === 'Short Videos') {
      list = []; 
    } else {
      list = [
        { id: 'tk_nt_1', title: 'Premium App Installation', reward: 0.15, destination: defaultTask, category: 'Micro Tasks' },
        { id: 'tk_nt_2', title: 'Global Identity Validation', reward: 0.20, destination: defaultTask, category: 'Micro Tasks' },
        { id: 'tk_nt_3', title: 'Smart Contract Auditing', reward: 0.12, destination: defaultTask, category: 'Micro Tasks' },
        { id: 'tk_nt_4', title: 'Survey Gateway Settlement', reward: 0.08, destination: defaultTask, category: 'Micro Tasks' },
        { id: 'tk_nt_5', title: 'Social Media Validation', reward: 0.04, destination: defaultTask, category: 'Micro Tasks' }
      ];
    }
    setTasksList(list);
  };

  const handleLaunchTask = (task: Task) => {
    if (getTaskLockMs(task.id) > 0) return;

    const length = 30;
    setActiveRunningTask(task);
    setTaskTimeRemaining(length);
    
    let linkToOpen = task.destination;
    
    if (task.id.startsWith('tk_ad') && monetizationSettings) {
      const DYNAMIC_ROTATOR_LINKS = [
        monetizationSettings.adsterraDirectLink,
        monetizationSettings.monetagSmartlink
      ].filter(link => link && link.trim() !== "");
      
      if (DYNAMIC_ROTATOR_LINKS.length > 0) {
        linkToOpen = DYNAMIC_ROTATOR_LINKS[adClickCount % DYNAMIC_ROTATOR_LINKS.length];
        setAdClickCount(prev => prev + 1); 
      }
    }
    
    const win = window.open(linkToOpen, '_blank');
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

    const DAILY_LIMIT = 50;
    const userAdsToday = currentUser.dailyAdCount || 0; 
    const today = new Date().toISOString().split('T')[0];
    const lastAdDate = currentUser.lastAdDate || today;

    if (lastAdDate === today && userAdsToday >= DAILY_LIMIT) {
      if (taskIntervalId) clearInterval(taskIntervalId);
      setActiveRunningTask(null);
      triggerModal('warning', 'Daily Limit Exceeded', 'Network security protocols activated. Your daily quota of 50 tasks is complete. Please return tomorrow to protect the earning ecosystem.');
      return;
    }

    try {
      await dbService.completeTask(currentUser.uid, task.id, task.title, task.reward);
      triggerModal('success', 'Reward Credited!', `Verification protocols cleared. $${task.reward.toFixed(4)} added instantly to your wallet.`);
      setCurrentSyncTime(Date.now());
    } catch (err: any) {
      triggerModal('error', 'Earning Sync Failed', err.message || 'Database write rules restricted transaction.');
    } finally {
      if (taskIntervalId) clearInterval(taskIntervalId); 
      setActiveRunningTask(null);
    }
  };

  const handleCancelActiveTask = () => {
    if (taskIntervalId) clearInterval(taskIntervalId);
    setActiveRunningTask(null);
    triggerModal('info', 'Task Suspended', 'The current tracking or feed stream verification has been terminated. Try again.');
  };

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
      triggerModal('success', 'Transfer Allocation Placed', `Requested payout of $${amt.toFixed(2)} USDT routed to secure blockchain queue. Processing takes 2-5 business days.`);
      setWithdrawAmount('');
      setWithdrawAddress('');
      setWithdrawNetwork('');
    } catch (err: any) {
      triggerModal('error', 'Declined', err.message || 'Withdrawal route restricted by ledger safeguards.');
    }
  };

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!supportSubject || !supportDescription) {
      triggerModal('warning', 'Required Streams', 'Please define ticket subject and complete descriptions.');
      return;
    }

    try {
      await dbService.fileTicket(currentUser.uid, currentUser.username, currentUser.fullname, currentUser.email, supportSubject, supportDescription, supportFile);
      triggerModal('success', 'Ticket Dispatched', 'Support desk has logged your issue parameters. Ref Ticket ID issued.');
      setSupportSubject('');
      setSupportDescription('');
      setSupportFile('');
      setActiveView('profile');
    } catch (err: any) {
      triggerModal('error', 'Failure', err.message);
    }
  };

  const handleCopyReferralLink = () => {
    if (!currentUser) return;
    const link = `https://${window.location.host}/?ref=${currentUser.username}`;
    navigator.clipboard.writeText(link);
    triggerModal('success', 'Link Copied', 'Your secure affiliate referral invitation is locked into target clipboard!');
  };

  const groupedReferralsMap: Record<string, { fromUser: string, date: string, commission: number }> = {};
  const uniqueUsersSet = new Set<string>();

  referralList.forEach(ref => {
    uniqueUsersSet.add(ref.fromUser);
    const key = `${ref.fromUser}_${ref.date}`;
    if (!groupedReferralsMap[key]) {
      groupedReferralsMap[key] = { fromUser: ref.fromUser, date: ref.date, commission: 0 };
    }
    groupedReferralsMap[key].commission += ref.commission;
  });

  const aggregatedReferrals = Object.values(groupedReferralsMap).sort((a, b) => {
    if (a.date !== b.date) return new Date(b.date).getTime() - new Date(a.date).getTime();
    return b.commission - a.commission;
  });
  const totalUniqueReferrals = uniqueUsersSet.size;
  
  const IS_MAINTENANCE = false; 
  if (IS_MAINTENANCE) {
    return (
      <div className="bg-[#0B0E14] text-white font-sans h-[100dvh] w-full flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-[#151A23] p-8 rounded-3xl border border-[#2A3143] max-w-sm w-full shadow-[0_0_50px_rgba(0,0,0,0.8)]">
          <div className="w-16 h-16 bg-[#00F0FF]/10 border border-[#00F0FF]/30 text-[#00F0FF] rounded-full flex items-center justify-center mx-auto mb-6">
            <RotateCw className="w-8 h-8 animate-spin delay-150" />
          </div>
          <h2 className="text-lg font-bold text-white mb-3 uppercase tracking-widest">System Upgrade</h2>
          <p className="text-xs text-gray-400 leading-relaxed mb-6 font-mono">
            NT Earn Hub is currently under scheduled maintenance to deploy technical fixes and security updates.
          </p>
        </div>
      </div>
    );
  }

  return (  
  <div className="bg-[#0B0E14] text-[#F8FAFC] font-sans min-h-[100dvh] w-full flex flex-col items-center justify-center p-4 py-8 overflow-y-auto selection:bg-[#00F0FF]/30 selection:text-white">      
      
      {/* Test Sandbox Toggler */}
      <div className="hidden bg-[#151A23] border-b border-[#2A3143] px-4 py-2.5 flex items-center justify-between z-[60] text-xs font-medium">
        <div className="flex items-center space-x-2 text-gray-300">
          <Database className="w-4 h-4 text-[#00F0FF]" />
          <span className="font-sans text-[10px] uppercase tracking-[0.25em] opacity-60">Testing Environment</span>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => handleToggleSandboxMode(!isSandbox)}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${isSandbox ? 'bg-[#00F0FF]' : 'bg-[#2A3143]'}`}
          >
            <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${isSandbox ? 'translate-x-4' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {modalActive && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#151A23] w-full max-w-sm rounded-3xl border border-[#2A3143] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] text-center relative overflow-hidden"
            >
              {modalStatusType === 'success' && <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.8)]"></div>}
              {modalStatusType === 'error' && <div className="absolute top-0 left-0 w-full h-1 bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.8)]"></div>}

              <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 border-2 
                ${modalStatusType === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.2)]' : ''}
                ${modalStatusType === 'info' ? 'bg-[#00F0FF]/10 border-[#00F0FF]/30 text-[#00F0FF] shadow-[0_0_30px_rgba(0,240,255,0.2)]' : ''}
                ${modalStatusType === 'warning' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.2)]' : ''}
                ${modalStatusType === 'error' ? 'bg-rose-500/10 border-rose-500/30 text-rose-500 shadow-[0_0_30px_rgba(244,63,94,0.2)]' : ''}
              `}>
                {modalStatusType === 'success' && <CheckCircle2 className="w-10 h-10" />}
                {modalStatusType === 'info' && <Info className="w-10 h-10" />}
                {modalStatusType === 'warning' && <AlertTriangle className="w-10 h-10" />}
                {modalStatusType === 'error' && <X className="w-10 h-10" />}
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">{modalTitle}</h3>
              <p className="text-sm text-gray-400 mt-3 leading-relaxed">{modalMessage}</p>
              
              <button 
                onClick={() => setModalActive(false)}
                className="mt-8 w-full bg-[#2A3143] hover:bg-[#3B445B] text-white font-bold py-4 rounded-full text-xs tracking-widest uppercase transition-all"
              >
                Acknowledge
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeRunningTask && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              className="bg-[#151A23] border border-[#2A3143] rounded-3xl max-w-sm w-full p-8 text-center shadow-[0_20px_50px_rgba(0,0,0,0.7)]"
            >
              <div className="flex justify-between items-center pb-4 border-b border-[#2A3143]">
                <span className="text-[10px] uppercase font-bold tracking-[0.2em] text-[#00F0FF]">Task Execution</span>
                <button onClick={handleCancelActiveTask} className="text-gray-500 hover:text-white transition">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-8">
                <div className="relative w-32 h-32 mx-auto flex items-center justify-center mb-6">
                  <svg className="w-full h-full transform -rotate-90 drop-shadow-[0_0_15px_rgba(0,240,255,0.4)]">
                    <circle cx="64" cy="64" r="56" stroke="#2A3143" strokeWidth="6" fill="transparent" />
                    <circle cx="64" cy="64" r="56" stroke="url(#cyanGradient)" strokeWidth="8" fill="transparent" strokeLinecap="round"
                      strokeDasharray="351.8"
                      strokeDashoffset={(351.8 * (1 - taskTimeRemaining / 30)).toString()}
                      className="transition-all duration-1000 ease-linear"
                    />
                    <defs>
                      <linearGradient id="cyanGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#00F0FF" />
                        <stop offset="100%" stopColor="#5704FF" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <span className="absolute text-4xl font-black text-white">{taskTimeRemaining}</span>
                </div>
                <h4 className="text-lg font-bold text-white tracking-tight">{activeRunningTask.title}</h4>
                <p className="text-sm text-gray-400 mt-2">Yield: <span className="text-[#00F0FF] font-bold">+${activeRunningTask.reward.toFixed(4)}</span></p>
              </div>

              <div className="flex space-x-3">
                <button 
                  onClick={handleCancelActiveTask} 
                  className="flex-1 bg-transparent border-2 border-[#2A3143] text-gray-400 hover:text-white py-4 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all"
                >
                  Abort
                </button>
                <button 
                  onClick={() => handleCompleteActiveTask(activeRunningTask)}
                  disabled={taskTimeRemaining > 0}
                  className="flex-1 bg-gradient-to-r from-[#00F0FF] to-[#5704FF] text-white disabled:opacity-50 disabled:from-[#2A3143] disabled:to-[#2A3143] py-4 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg"
                >
                  {taskTimeRemaining > 0 ? "Processing..." : "Claim Reward"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {!currentUser && !isLoadingAuth && (
        <div className="flex-1 flex flex-col justify-center max-w-[360px] mx-auto w-full pb-10">
          
          <div className="mb-10 text-center relative">
            <div className="w-24 h-24 mx-auto bg-gradient-to-tr from-[#00F0FF] to-[#5704FF] rounded-full p-1 mb-6 shadow-[0_0_40px_rgba(0,240,255,0.3)] hover:scale-105 transition-transform duration-500">
              <div className="w-full h-full bg-[#0B0E14] rounded-full flex items-center justify-center">
                 <span className="text-4xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#00F0FF] to-[#5704FF]">NT</span>
              </div>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">NT EARN HUB</h1>
            <p className="text-sm text-gray-400 mt-2">Enter your secure workspace credentials.</p>
          </div>

          <motion.div layout className="bg-[#151A23] border border-[#2A3143] p-6 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] w-full">
            <div className="mb-6 flex justify-between items-end border-b border-[#2A3143] pb-4">
              <h2 className="text-xl font-bold text-white">{isSignup ? 'Register' : 'Login'}</h2>
              <button type="button" onClick={() => { setIsSignup(!isSignup); setPassword(''); }} className="text-[#00F0FF] text-sm font-bold hover:underline">
                {isSignup ? "Have account? Login" : "No account? Register"}
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {isSignup && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <div className="relative flex items-center bg-[#070A11] border border-[#2A3143] rounded-2xl overflow-hidden focus-within:border-[#00F0FF] focus-within:ring-1 focus-within:ring-[#00F0FF] transition-all">
                    <div className="pl-4 pr-3 flex items-center justify-center border-r border-[#2A3143]"><User className="w-5 h-5 text-[#00F0FF]" /></div>
                    <input type="text" placeholder="Full Name" value={fullname} onChange={(e) => setFullname(e.target.value)} className="w-full bg-transparent p-4 outline-none text-sm text-white placeholder-gray-600" />
                  </div>
                  <div className="relative flex items-center bg-[#070A11] border border-[#2A3143] rounded-2xl overflow-hidden focus-within:border-[#00F0FF] focus-within:ring-1 focus-within:ring-[#00F0FF] transition-all">
                    <div className="pl-4 pr-3 flex items-center justify-center border-r border-[#2A3143]"><User className="w-5 h-5 text-[#00F0FF]" /></div>
                    <input type="text" placeholder="Unique Username" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-transparent p-4 outline-none text-sm text-white placeholder-gray-600" />
                  </div>
                  <div className="relative flex items-center bg-[#070A11] border border-[#2A3143] rounded-2xl overflow-hidden focus-within:border-[#00F0FF] focus-within:ring-1 focus-within:ring-[#00F0FF] transition-all">
                    <div className="pl-4 pr-3 flex items-center justify-center border-r border-[#2A3143]"><Globe className="w-5 h-5 text-[#00F0FF]" /></div>
                    <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full bg-transparent p-4 outline-none text-sm text-white placeholder-gray-600 appearance-none">
                      <option value="" disabled>Select Country</option>
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

              <div className="relative flex items-center bg-[#070A11] border border-[#2A3143] rounded-2xl overflow-hidden focus-within:border-[#00F0FF] focus-within:ring-1 focus-within:ring-[#00F0FF] transition-all">
                <div className="pl-4 pr-3 flex items-center justify-center border-r border-[#2A3143]"><Mail className="w-5 h-5 text-[#00F0FF]" /></div>
                <input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-transparent p-4 outline-none text-sm text-white placeholder-gray-600" />
              </div>

              <div className="relative flex items-center bg-[#070A11] border border-[#2A3143] rounded-2xl overflow-hidden focus-within:border-[#00F0FF] focus-within:ring-1 focus-within:ring-[#00F0FF] transition-all">
                <div className="pl-4 pr-3 flex items-center justify-center border-r border-[#2A3143]"><Lock className="w-5 h-5 text-[#00F0FF]" /></div>
                <input type={showPassword ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-transparent p-4 outline-none text-sm text-white placeholder-gray-600" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 text-[#00F0FF] hover:text-white transition">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {isSignup && (
                <div className="relative flex items-center bg-[#070A11] border border-[#2A3143] rounded-2xl overflow-hidden focus-within:border-[#00F0FF] focus-within:ring-1 focus-within:ring-[#00F0FF] transition-all">
                  <div className="pl-4 pr-3 flex items-center justify-center border-r border-[#2A3143]"><Tag className="w-5 h-5 text-[#00F0FF]" /></div>
                  <input type="text" placeholder="Invitation Code (Optional)" value={referralCodeInput} onChange={(e) => setReferralCodeInput(e.target.value)} className="w-full bg-transparent p-4 outline-none text-sm text-white placeholder-gray-600" />
                </div>
              )}

              <div className="pt-4">
                <button type="submit" disabled={isAuthProcessing} className={`w-full bg-gradient-to-r from-[#00F0FF] to-[#5704FF] hover:from-[#5704FF] hover:to-[#00F0FF] text-white font-bold text-sm py-4 rounded-full shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all transform hover:scale-[1.02] ${isAuthProcessing ? 'opacity-50 cursor-not-allowed scale-100' : ''}`}>
                  {isAuthProcessing ? 'AUTHORIZING...' : (isSignup ? 'CREATE ACCOUNT' : 'LOGIN NOW')}
                </button>
                
                {!isSignup && (
                  <div className="text-center mt-6">
                    <button type="button" onClick={handlePasswordReset} disabled={isAuthProcessing} className="text-xs text-gray-500 hover:text-[#00F0FF] transition disabled:opacity-50">
                      Forgot Password?
                    </button>
                  </div>
                )}
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {isLoadingAuth && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <RotateCw className="w-10 h-10 text-[#00F0FF] animate-spin drop-shadow-[0_0_10px_rgba(0,240,255,0.5)]" />
          <p className="text-[10px] text-gray-400 mt-6 uppercase tracking-widest font-bold">Synchronizing Nodes...</p>
        </div>
      )}

      {currentUser && !isLoadingAuth && (
        <div className="flex-1 flex flex-col h-full max-w-[400px] mx-auto w-full relative">
          
          <header className="bg-[#151A23]/90 backdrop-blur-xl border-b border-[#2A3143] p-4 sticky top-0 z-[50] flex justify-between items-center rounded-b-3xl">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full border-2 border-[#00F0FF] flex items-center justify-center text-sm font-black text-white bg-gradient-to-br from-[#00F0FF] to-[#5704FF] shadow-[0_0_15px_rgba(0,240,255,0.4)] overflow-hidden shrink-0">
                {currentUser.profilePicUrl ? <img src={currentUser.profilePicUrl} className="w-full h-full object-cover" alt="User" /> : currentUser.fullname.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-sm font-bold text-white tracking-tight truncate max-w-[150px]">{currentUser.fullname}</h1>
                <p className="text-[10px] text-[#00F0FF] font-mono">@{currentUser.username}</p>
              </div>
            </div>
            <button onClick={handleLogOut} className="w-10 h-10 flex items-center justify-center rounded-full bg-[#2A3143] text-gray-400 hover:text-white transition-all">
              <LogOut className="w-4 h-4" />
            </button>
          </header>

          <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-32 scrollbar-none">
            
            {activeView === 'dashboard' && (
              <div className="space-y-6">
                
                {/* Neon Floating Balance Card */}
                <div className="relative overflow-hidden rounded-3xl bg-[#151A23] border border-[#2A3143] p-6 shadow-[0_15px_40px_rgba(0,0,0,0.6)]">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#00F0FF] opacity-10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                  
                  <div className="flex justify-between items-center relative z-10">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mb-1">Total Balance</span>
                      <div className="flex items-baseline">
                        <span className="text-4xl font-black text-white drop-shadow-md">
                          ${Math.floor(currentUser?.balance || 0)}
                        </span>
                        <span className="text-xl font-bold text-gray-400 ml-1">
                          .{(currentUser?.balance % 1)?.toFixed(2).substring(2) || '00'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right border-l border-[#2A3143] pl-4">
                      <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1 block">Pending</span>
                      <span className="text-xl font-black text-[#00F0FF] drop-shadow-[0_0_8px_rgba(0,240,255,0.4)]">
                        ${(currentUser?.pending || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-left space-y-4">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-2 border-l-2 border-[#00F0FF]">Earning Nodes</h3>
                  
                  <div className="space-y-3">
                    {(() => {
                      const adsDetails = getCategoryDetails('Watch Ads');
                      return (
                        <button 
                          onClick={() => handleOpenCategory('Watch Ads')}
                          className={`w-full p-4 flex items-center justify-between rounded-2xl border border-[#2A3143] transition-all group ${adsDetails.isLocked ? 'opacity-50 cursor-not-allowed bg-[#070A11]' : 'bg-[#151A23] hover:border-[#00F0FF] shadow-lg'}`}
                        >
                          <div className="flex items-center space-x-4 text-left">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00F0FF]/10 to-[#5704FF]/10 border border-[#00F0FF]/30 flex items-center justify-center text-[#00F0FF] group-hover:scale-110 transition-transform">
                              <Tv className="w-5 h-5" />
                            </div>
                            <div>
                              <span className="text-sm font-bold text-white block">Promotional Ads</span>
                              <span className="text-[10px] font-mono text-gray-500">
                                {adsDetails.isLocked ? `Unlocks in: ${formatLockRemaining(adsDetails.remainingMs)}` : `${adsDetails.completedCount}/${adsDetails.totalCount} Completed`}
                              </span>
                            </div>
                          </div>
                          {adsDetails.isLocked ? <Lock className="text-rose-500 w-5 h-5" /> : <ChevronRight className="text-[#00F0FF] w-5 h-5 opacity-50 group-hover:opacity-100" />}
                        </button>
                      );
                    })()}

                    {(() => {
                      const vidDetails = getCategoryDetails('Short Videos');
                      return (
                        <button 
                          onClick={() => handleOpenCategory('Short Videos')}
                          className={`w-full p-4 flex items-center justify-between rounded-2xl border border-[#2A3143] transition-all group ${vidDetails.isLocked ? 'opacity-50 cursor-not-allowed bg-[#070A11]' : 'bg-[#151A23] hover:border-[#00F0FF] shadow-lg'}`}
                        >
                          <div className="flex items-center space-x-4 text-left">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00F0FF]/10 to-[#5704FF]/10 border border-[#00F0FF]/30 flex items-center justify-center text-[#00F0FF] group-hover:scale-110 transition-transform">
                              <Play className="w-5 h-5" />
                            </div>
                            <div>
                              <span className="text-sm font-bold text-white block">Short Video Streams</span>
                              <span className="text-[10px] font-mono text-gray-500">
                                {vidDetails.isLocked ? `Unlocks in: ${formatLockRemaining(vidDetails.remainingMs)}` : `${vidDetails.completedCount}/${vidDetails.totalCount} Completed`}
                              </span>
                            </div>
                          </div>
                          {vidDetails.isLocked ? <Lock className="text-rose-500 w-5 h-5" /> : <ChevronRight className="text-[#00F0FF] w-5 h-5 opacity-50 group-hover:opacity-100" />}
                        </button>
                      );
                    })()}

                    {(() => {
                      const taskDetails = getCategoryDetails('Micro Tasks');
                      return (
                        <button 
                          onClick={() => handleOpenCategory('Micro Tasks')}
                          className={`w-full p-4 flex items-center justify-between rounded-2xl border border-[#2A3143] transition-all group ${taskDetails.isLocked ? 'opacity-50 cursor-not-allowed bg-[#070A11]' : 'bg-[#151A23] hover:border-[#00F0FF] shadow-lg'}`}
                        >
                          <div className="flex items-center space-x-4 text-left">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00F0FF]/10 to-[#5704FF]/10 border border-[#00F0FF]/30 flex items-center justify-center text-[#00F0FF] group-hover:scale-110 transition-transform">
                              <ListCheck className="w-5 h-5" />
                            </div>
                            <div>
                              <span className="text-sm font-bold text-white block">Micro Job Settlements</span>
                              <span className="text-[10px] font-mono text-gray-500">
                                {taskDetails.isLocked ? `Unlocks in: ${formatLockRemaining(taskDetails.remainingMs)}` : `${taskDetails.completedCount}/${taskDetails.totalCount} Completed`}
                              </span>
                            </div>
                          </div>
                          {taskDetails.isLocked ? <Lock className="text-rose-500 w-5 h-5" /> : <ChevronRight className="text-[#00F0FF] w-5 h-5 opacity-50 group-hover:opacity-100" />}
                        </button>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}

            {activeView === 'tasks' && (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 mb-6 bg-[#151A23] p-4 rounded-2xl border border-[#2A3143]">
                  <button onClick={() => setActiveView('dashboard')} className="w-8 h-8 rounded-full bg-[#2A3143] flex items-center justify-center text-white hover:bg-[#00F0FF] hover:text-black transition-all">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <h3 className="text-lg font-bold text-white tracking-tight">{taskCategoryName}</h3>
                </div>

                <div className="space-y-3">
                  {tasksList.length === 0 && (
                    <div className="bg-[#151A23] border border-[#2A3143] rounded-3xl p-8 text-center space-y-3">
                      <div className="w-16 h-16 rounded-full bg-[#00F0FF]/10 text-[#00F0FF] mx-auto flex items-center justify-center mb-4"><Clock className="w-8 h-8" /></div>
                      <span className="block text-white font-bold tracking-widest text-sm uppercase">Integration in Progress</span>
                      <span className="block text-gray-400 text-xs leading-relaxed max-w-xs mx-auto">
                        Premium partners are currently syncing. High-yield tasks will be available shortly.
                      </span>
                    </div>
                  )}
                  {tasksList.map((t, idx) => {
                    const lockedTimeMs = getTaskLockMs(t.id);
                    const isTaskCompleted = lockedTimeMs > 0;
                    
                    return (
                      <div key={t.id} className={`bg-[#151A23] border border-[#2A3143] rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center text-left transition-all ${isTaskCompleted ? 'opacity-50' : 'hover:border-[#00F0FF] shadow-lg'}`}>
                        <div className="space-y-1 mb-4 sm:mb-0">
                          <h4 className={`text-base font-bold ${isTaskCompleted ? 'text-gray-500 line-through' : 'text-white'}`}>{t.title}</h4>
                          <span className="text-xs text-gray-400 block">Reward: <span className="text-[#00F0FF] font-bold">+${t.reward.toFixed(4)}</span></span>
                        </div>
                        <button 
                          onClick={() => handleLaunchTask(t)}
                          disabled={isTaskCompleted}
                          className={`w-full sm:w-auto font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-full transition-all shadow-md text-center ${
                            isTaskCompleted 
                              ? 'bg-[#070A11] text-emerald-500 cursor-not-allowed border border-emerald-500/30' 
                              : 'bg-gradient-to-r from-[#00F0FF] to-[#5704FF] text-white hover:scale-105 shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                          }`}
                        >
                          {isTaskCompleted ? 'COMPLETED' : 'Execute'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeView === 'wallet' && (
              <div className="space-y-6 text-left">
                <div className="bg-[#151A23] border border-[#2A3143] rounded-3xl p-6 shadow-lg">
                  <h3 className="text-lg font-bold text-white mb-6 flex items-center"><Wallet className="w-5 h-5 text-[#00F0FF] mr-2"/> Withdraw Crypto</h3>
                  <form onSubmit={handleInitiateWithdrawal} className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Network Protocol</label>
                      <div className="relative flex items-center bg-[#070A11] border border-[#2A3143] rounded-2xl overflow-hidden focus-within:border-[#00F0FF] focus-within:ring-1 focus-within:ring-[#00F0FF] transition-all">
                        <select value={withdrawNetwork} onChange={(e) => setWithdrawNetwork(e.target.value)} className="w-full bg-transparent p-4 outline-none text-sm text-white appearance-none">
                          <option value="" disabled className="text-gray-500">Select Network</option>
                          <option value="TRC-20">USDT (TRC-20) - Tron</option>
                          <option value="BEP-20">USDT (BEP-20) - Binance Smart Chain</option>
                        </select>
                        <ChevronRight className="absolute right-4 w-5 h-5 text-gray-500 pointer-events-none rotate-90" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Wallet Address</label>
                      <input type="text" placeholder="Paste Destination Address" value={withdrawAddress} onChange={(e) => setWithdrawAddress(e.target.value)} className="w-full bg-[#070A11] p-4 rounded-2xl border border-[#2A3143] text-sm text-white focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF] outline-none transition-all" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center pl-1 pr-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Amount (USD)</label>
                        <span className="text-[9px] text-[#00F0FF] font-bold uppercase tracking-wider">MIN $30</span>
                      </div>
                      <input type="number" placeholder="Enter Amount" value={withdrawAmount} onChange={(e) => setWithdrawAmount(e.target.value)} className="w-full bg-[#070A11] p-4 rounded-2xl border border-[#2A3143] text-sm font-bold text-white focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF] outline-none transition-all" />
                    </div>
                    <button type="submit" className="w-full mt-2 bg-gradient-to-r from-[#00F0FF] to-[#5704FF] hover:scale-[1.02] py-4 rounded-full font-bold text-white text-sm uppercase tracking-widest shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all">
                      Confirm Transfer
                    </button>
                  </form>
                </div>
              </div>
            )}

            {activeView === 'referrals' && (
              <div className="space-y-6 text-left">
                <div className="bg-[#151A23] p-6 rounded-3xl border border-[#2A3143] text-center shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#5704FF] opacity-10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                  <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-2">Affiliate Earnings</p>
                  <h3 className="text-4xl font-black text-[#00F0FF] drop-shadow-[0_0_15px_rgba(0,240,255,0.3)] mb-6">${currentUser.refEarnings.toFixed(4)}</h3>
                  
                  <div className="flex items-center space-x-2 bg-[#070A11] p-2 rounded-2xl border border-[#2A3143]">
                    <input type="text" readOnly value={`https://${window.location.host}/?ref=${currentUser.username}`} className="flex-1 bg-transparent text-xs text-gray-300 outline-none pl-3" />
                    <button onClick={handleCopyReferralLink} className="bg-gradient-to-r from-[#00F0FF] to-[#5704FF] text-white p-3 px-6 rounded-xl text-xs font-bold uppercase tracking-widest transition-all hover:shadow-[0_0_15px_rgba(0,240,255,0.4)]">
                      Copy
                    </button>
                  </div>
                </div>

                 <div className="space-y-3">
                  <div className="flex justify-between items-center px-2">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-l-2 border-[#5704FF] pl-2">Active Network</h3>
                    <span className="text-[10px] bg-[#5704FF]/20 text-[#00F0FF] px-2 py-1 rounded-md uppercase font-bold">
                      {totalUniqueReferrals} Nodes
                    </span>
                  </div>
                  <div className="bg-[#151A23] rounded-3xl border border-[#2A3143] overflow-hidden">
                    {aggregatedReferrals.length === 0 ? (
                      <div className="p-8 text-sm text-gray-500 text-center">No active credentials registered.</div>
                    ) : (
                      <div className="divide-y divide-[#2A3143]">
                        {aggregatedReferrals.map((ref, idx) => (
                          <div key={`${ref.fromUser}_${ref.date}_${idx}`} className="p-4 flex justify-between items-center hover:bg-white/5 transition duration-150">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 rounded-full border border-[#00F0FF]/30 bg-[#00F0FF]/10 text-[#00F0FF] flex items-center justify-center text-sm font-bold uppercase">{ref.fromUser.charAt(0)}</div>
                              <div>
                                <p className="text-sm font-bold text-white">{ref.fromUser}</p>
                                <p className="text-[10px] text-gray-500">Date: {ref.date}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-bold text-[#00F0FF] block">+${ref.commission.toFixed(4)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeView === 'history' && (
              <div className="space-y-4 text-left">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-2 border-l-2 border-emerald-500 mb-4">Transaction Ledger</h3>
                <div className="flex flex-col bg-[#151A23] border border-[#2A3143] rounded-3xl overflow-hidden shadow-lg">
                  {transactionList.length === 0 ? (
                    <div className="p-8 text-sm text-gray-500 text-center">Ledger is empty.</div>
                  ) : (
                    <div className="divide-y divide-[#2A3143]">
                      {transactionList.map((tx) => (
                        <div key={tx.id} className="p-5 flex justify-between items-center hover:bg-white/5 transition-all">
                          <div className="space-y-1 pr-2">
                            <span className="text-sm text-white block font-bold">{tx.details}</span>
                            <span className="text-[10px] text-gray-500 block">{tx.date}</span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className={`text-sm font-bold block ${tx.type === 'Task Reward' ? 'text-[#00F0FF]' : 'text-rose-500'}`}>{tx.type === 'Task Reward' ? '+' : '-'}${tx.amount.toFixed(2)}</span>
                            <span className={`text-[9px] uppercase tracking-widest font-bold block mt-1 ${tx.status === 'completed' ? 'text-emerald-400' : ''} ${tx.status === 'pending' ? 'text-amber-400' : ''} ${tx.status === 'rejected' ? 'text-rose-500' : ''}`}>{tx.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeView === 'profile' && (
              <div className="space-y-6 text-left">
                
                <div className="bg-[#151A23] border border-[#2A3143] rounded-3xl p-6 shadow-lg">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4 border-l-2 border-[#00F0FF] pl-2">Security Hub</h3>
                  <form onSubmit={handleUpdatePassword} className="space-y-4">
                    <p className="text-sm text-gray-400 leading-relaxed">
                      Send a secure password reset link to <span className="text-white font-bold">{currentUser.email}</span>
                    </p>
                    <button type="submit" disabled={updatingPass} className="w-full bg-[#2A3143] hover:bg-[#3B445B] text-white py-4 rounded-full font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center">
                      {updatingPass ? <span>Processing...</span> : <span>Change Password</span>}
                    </button>
                  </form>
                </div>

                {isAdmin && (
                  <div className="bg-[#151A23] border border-[#5704FF]/40 rounded-3xl p-6 shadow-lg">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xs font-bold text-[#00F0FF] uppercase tracking-widest border-l-2 border-[#00F0FF] pl-2">Admin Configuration</h3>
                      <span className="bg-[#5704FF]/20 text-[#00F0FF] text-[9px] font-bold px-2 py-1 rounded-md uppercase">Owner</span>
                    </div>

                    <form onSubmit={handleSaveMonetizationSettings} className="space-y-4">
                      <div className="space-y-3">
                        <input type="url" placeholder="Adsterra Direct Link" value={adminAdsterraLink} onChange={(e) => setAdminAdsterraLink(e.target.value)} className="w-full bg-[#070A11] border border-[#2A3143] text-sm px-4 py-3 rounded-2xl text-white focus:outline-none focus:border-[#00F0FF]" />
                        <input type="url" placeholder="Monetag Smartlink" value={adminMonetagLink} onChange={(e) => setAdminMonetagLink(e.target.value)} className="w-full bg-[#070A11] border border-[#2A3143] text-sm px-4 py-3 rounded-2xl text-white focus:outline-none focus:border-[#00F0FF]" />
                        <input type="url" placeholder="CPALead Offerwall" value={adminCpaLeadLink} onChange={(e) => setAdminCpaLeadLink(e.target.value)} className="w-full bg-[#070A11] border border-[#2A3143] text-sm px-4 py-3 rounded-2xl text-white focus:outline-none focus:border-[#00F0FF]" />
                        <input type="url" placeholder="Short Video Earning Hub" value={adminShortVidLink} onChange={(e) => setAdminShortVidLink(e.target.value)} className="w-full bg-[#070A11] border border-[#2A3143] text-sm px-4 py-3 rounded-2xl text-white focus:outline-none focus:border-[#00F0FF]" />
                        <input type="url" placeholder="Micro Tasks Gateway" value={adminMicroTasksLink} onChange={(e) => setAdminMicroTasksLink(e.target.value)} className="w-full bg-[#070A11] border border-[#2A3143] text-sm px-4 py-3 rounded-2xl text-white focus:outline-none focus:border-[#00F0FF]" />
                      </div>
                      <button type="submit" disabled={saveLoading} className="w-full mt-4 bg-gradient-to-r from-[#00F0FF] to-[#5704FF] hover:scale-[1.02] text-white font-bold py-4 rounded-full text-xs uppercase tracking-widest shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all">
                        {saveLoading ? 'Syncing...' : 'Save Settings'}
                      </button>
                    </form>
                  </div>
                )}
                
                <div className="bg-[#151A23] border border-rose-500/20 rounded-3xl p-4 overflow-hidden">
                  <div onClick={handleDeleteAccount} className="p-3 flex justify-between items-center bg-rose-500/10 hover:bg-rose-500/20 rounded-2xl cursor-pointer transition text-rose-500">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center"><Trash2 className="w-5 h-5" /></div>
                      <span className="text-sm font-bold">Terminate Account</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </main>

          {/* Premium Bottom Navigation Dock */}
          <nav className="fixed bottom-4 left-1/2 transform -translate-x-1/2 w-[90%] max-w-[360px] bg-[#151A23]/95 backdrop-blur-2xl border border-[#2A3143] rounded-3xl h-16 flex items-center justify-around px-2 shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-50">
            {[
              { id: 'dashboard', icon: Tv, label: 'Home' },
              { id: 'wallet', icon: Wallet, label: 'Wallet' },
              { id: 'referrals', icon: Users, label: 'Team' },
              { id: 'history', icon: Clock, label: 'History' },
              { id: 'profile', icon: User, label: 'Profile' }
            ].map((item) => (
              <button 
                key={item.id} 
                onClick={() => setActiveView(item.id)} 
                className={`relative flex flex-col items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 ${activeView === item.id || (item.id === 'dashboard' && activeView === 'tasks') ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                {activeView === item.id && (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#00F0FF]/20 to-[#5704FF]/20 rounded-2xl border border-[#00F0FF]/30 shadow-[0_0_15px_rgba(0,240,255,0.3)]"></div>
                )}
                <item.icon className={`w-5 h-5 relative z-10 ${activeView === item.id ? 'drop-shadow-[0_0_8px_rgba(0,240,255,1)]' : ''}`} />
              </button>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
}
