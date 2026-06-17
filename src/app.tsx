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
  AlertTriangle,
  RotateCw,
  CheckCircle2
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { dbService } from './dbService';
import { UserProfile, Task, Transaction, ReferralRecord, MonetizationSettings } from './types';

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null&gt;(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState<boolean&gt;(true);

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
  const [activeView, setActiveView] = useState<string&gt;('dashboard');
  const [taskCategoryName, setTaskCategoryName] = useState<string&gt;('');
  
  // Auth Form parameters
  const [isSignup, setIsSignup] = useState<boolean&gt;(false);
  const [email, setEmail] = useState<string&gt;('');
  const [password, setPassword] = useState<string&gt;('');
  const [fullname, setFullname] = useState<string&gt;('');
  const [username, setUsername] = useState<string&gt;('');
  const [country, setCountry] = useState<string&gt;('');
  const [referralCodeInput, setReferralCodeInput] = useState<string&gt;('');

  // Feed Lists
  const [referralList, setReferralList] = useState<ReferralRecord[]&gt;([]);
  const [transactionList, setTransactionList] = useState<Transaction[]&gt;([]);
  const [tasksList, setTasksList] = useState<Task[]&gt;([]);

  // Active Task Processing States
  const [activeRunningTask, setActiveRunningTask] = useState<Task | null&gt;(null);
  const [taskTimeRemaining, setTaskTimeRemaining] = useState<number&gt;(0);
  const [taskIntervalId, setTaskIntervalId] = useState<any&gt;(null);
  
  // Wallet Withdrawal State
  const [withdrawNetwork, setWithdrawNetwork] = useState<string&gt;('');
  const [withdrawAddress, setWithdrawAddress] = useState<string&gt;('');
  const [withdrawAmount, setWithdrawAmount] = useState<string&gt;('');

  // Support State
  const [supportSubject, setSupportSubject] = useState<string&gt;('');
  const [supportDescription, setSupportDescription] = useState<string&gt;('');

  // Custom Dialog States
  const [modalActive, setModalActive] = useState<boolean&gt;(false);
  const [modalTitle, setModalTitle] = useState<string&gt;('');
  const [modalMessage, setModalMessage] = useState<string&gt;('');
  const [modalStatusType, setModalStatusType] = useState<'success' | 'info' | 'warning' | 'error'&gt;('info');

  // Monetization Settings State
  const [monetizationSettings, setMonetizationSettings] = useState<MonetizationSettings | null&gt;(null);
  const [saveLoading, setSaveLoading] = useState<boolean&gt;(false);

  // Form states for Admin settings
  const [adminAdsterraLink, setAdminAdsterraLink] = useState<string&gt;('');
  const [adminMonetagLink, setAdminMonetagLink] = useState<string&gt;('');
  const [adminCpaLeadLink, setAdminCpaLeadLink] = useState<string&gt;('');
  const [adminShortVidLink, setAdminShortVidLink] = useState<string&gt;('');
  const [adminMicroTasksLink, setAdminMicroTasksLink] = useState<string&gt;('');

  // Profile update form states
  const [customPicUrl, setCustomPicUrl] = useState<string&gt;('');
  const [updatingPass, setUpdatingPass] = useState<boolean&gt;(false);

  // Trigger read of referral code from URL query parameters
  useEffect(() =&gt; {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) {
      setReferralCodeInput(ref);
      setIsSignup(true);
    }
  }, []);

  // Strictly Live Firebase mode auth state listener
  useEffect(() =&gt; {
    setIsLoadingAuth(true);
    dbService.setMode(false); // Force live mode

    let unsubProfile: (() =&gt; void) | null = null;
    const unsubAuth = dbService.onAuthStateChanged((user) =&gt; {
      if (unsubProfile) {
        unsubProfile();
        unsubProfile = null;
      }

      if (user) {
        unsubProfile = dbService.subscribeToProfile(user.uid, (profile) =&gt; {
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

    return () =&gt; {
      unsubAuth();
      if (unsubProfile) {
        unsubProfile();
      }
    };
  }, []);

  // Load monetization settings from database
  useEffect(() =&gt; {
    const fetchMonetization = async () =&gt; {
      try {
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
      }
    };
    fetchMonetization();
  }, []);

  const setupLiveFeeds = (uid: string) =&gt; {
    dbService.subscribeToReferrals(uid, (refs) =&gt; setReferralList(refs));
    dbService.subscribeToTransactions(uid, (txs) =&gt; setTransactionList(txs));
  };

  // Show standard custom modal
  const triggerModal = (type: 'success' | 'info' | 'warning' | 'error', title: string, msg: string) =&gt; {
    setModalStatusType(type);
    setModalTitle(title);
    setModalMessage(msg);
    setModalActive(true);
  };

  // Auth processing actions
  const handleAuthSubmit = async (e: React.FormEvent) =&gt; {
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
      }
    } catch (err: any) {
      if (err.message === 'EMAIL_UNVERIFIED') {
        triggerModal('warning', 'Email Unverified', 'Verify your email prior to dashboard access. Check spam folders.');
      } else {
        triggerModal('error', 'Authentication Denied', err.message || 'System was unable to authorize credentials.');
      }
    }
  };

  const handlePasswordReset = async () =&gt; {
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

  const handleLogOut = async () =&gt; {
    try {
      await dbService.signOut();
      setCurrentUser(null);
      setActiveView('dashboard');
      triggerModal('info', 'Session Deactivated', 'Secure workspace session closed. Core logged out safely.');
    } catch (err: any) {
      triggerModal('error', 'Fail', err.message);
    }
  };

  const handleDeleteAccount = async () =&gt; {
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

  const handleUpdatePassword = async (e: React.FormEvent) =&gt; {
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

  const handleSaveMonetizationSettings = async (e: React.FormEvent) =&gt; {
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

  const handleUpdateProfilePic = async (url: string) =&gt; {
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
  const handleOpenCategory = (cat: string) =&gt; {
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
  const handleLaunchTask = (task: Task) =&gt; {
    // Determine countdown length: 30 seconds for live production
    const length = 30;
    
    setActiveRunningTask(task);
    setTaskTimeRemaining(length);
    
    // Open partner page
    const win = window.open(task.destination, '_blank');
    if (!win) {
      console.warn("Popup blocked. Continuing task tracking internally.");
    }

    if (taskIntervalId) clearInterval(taskIntervalId);

    const interval = setInterval(() =&gt; {
      setTaskTimeRemaining((prev) =&gt; {
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

  const handleCompleteActiveTask = async (task: Task) =&gt; {
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

  const handleCancelActiveTask = () =&gt; {
    if (taskIntervalId) clearInterval(taskIntervalId);
    setActiveRunningTask(null);
    triggerModal('info', 'Task Suspended', 'The current ad tracking or feed stream verification has been terminated.');
  };

  // Withdrawal logic
  const handleInitiateWithdrawal = async (e: React.FormEvent) =&gt; {
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

    if (amt &gt; 500) {
      triggerModal('error', 'Limit Overflow', 'The system sets a maximum secure threshold limit of $500.00 per 24-hour cycle.');
      return;
    }

    if (amt &gt; currentUser.balance) {
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
  const handleSupportSubmit = async (e: React.FormEvent) =&gt; {
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
        ''
      );
      triggerModal('success', 'Ticket Dispatched', 'Support desk has logged your issue parameters. Ref Ticket ID issued.');
      setSupportSubject('');
      setSupportDescription('');
      setActiveView('profile');
    } catch (err: any) {
      triggerModal('error', 'Failure', err.message);
    }
  };

  // Clipboard copy referral link
  const handleCopyReferralLink = () =&gt; {
    if (!currentUser) return;
    const link = `https://${window.location.host}/?ref=${currentUser.username}`;
    navigator.clipboard.writeText(link);
    triggerModal('success', 'Link Copied', 'Your secure affiliate referral invitation is locked into target clipboard!');
  };

  return (
    <div className="bg-[#0A0A0A] text-[#F5F5F5] font-sans min-h-screen flex flex-col justify-between selection:bg-accent selection:text-black"&gt;
      
      {/* Global Interactive Modal Overlay */}
      <AnimatePresence&gt;
        {modalActive && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[110] flex items-center justify-center p-4"&gt;
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111111] w-full max-w-sm rounded-sm border border-white/10 p-6 shadow-2xl shadow-black text-center"
            &gt;
              <div className={`w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4 border 
                ${modalStatusType === 'success' ? 'bg-accent/15 border-accent/30 text-accent' : ''}
                ${modalStatusType === 'info' ? 'bg-white/5 border-white/10 text-[#F5F5F5]/80' : ''}
                ${modalStatusType === 'warning' ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' : ''}
                ${modalStatusType === 'error' ? 'bg-red-500/15 border-red-500/30 text-red-500' : ''}
              `}&gt;
                {modalStatusType === 'success' && <CheckCircle2 className="w-6 h-6" /&gt;}
                {modalStatusType === 'info' && <Info className="w-6 h-6" /&gt;}
                {modalStatusType === 'warning' && <AlertTriangle className="w-6 h-6" /&gt;}
                {modalStatusType === 'error' && <X className="w-6 h-6" /&gt;}
              </div&gt;
              <h3 className="text-base font-bold text-white tracking-tight"&gt;{modalTitle}</h3&gt;
              <p className="text-xs text-gray-400 mt-2 leading-relaxed"&gt;{modalMessage}</p&gt;
              
              <button 
                onClick={() =&gt; setModalActive(false)}
                className="mt-6 w-full bg-white text-black font-bold py-3.5 px-4 rounded-sm text-xs font-sans tracking-widest uppercase hover:bg-accent transition duration-150"
              &gt;
                Acknowledge
              </button&gt;
            </motion.div&gt;
          </div&gt;
        )}
      </AnimatePresence&gt;

      {/* Embedded Action Task Countdown Progress HUD */}
      <AnimatePresence&gt;
        {activeRunningTask && (
          <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-[100] flex items-center justify-center p-4"&gt;
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="bg-[#111111] border border-accent/30 rounded-sm max-w-sm w-full p-6 text-center space-y-4 shadow-xl shadow-black"
            &gt;
              <div className="flex justify-between items-center pb-2 border-b border-white/10"&gt;
                <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-accent"&gt;Verify Earning Process</span&gt;
                <button onClick={handleCancelActiveTask} className="text-gray-400 hover:text-white transition"&gt;
                  <X className="w-4 h-4" /&gt;
                </button&gt;
              </div&gt;

              <div className="space-y-2 py-4"&gt;
                <div className="relative w-24 h-24 mx-auto flex items-center justify-center"&gt;
                  <svg className="w-full h-full transform -rotate-90"&gt;
                    <circle cx="48" cy="48" r="40" stroke="rgba(255,255,255,0.05)" strokeWidth="6" fill="transparent" /&gt;
                    <circle cx="48" cy="48" r="40" stroke="#C1FF72" strokeWidth="6" fill="transparent"
                      strokeDasharray="251.2"
                      strokeDashoffset={(251.2 * (1 - taskTimeRemaining / 30)).toString()}
                      className="transition-all duration-1000 ease-linear"
                    /&gt;
                  </svg&gt;
                  <span className="absolute text-2xl font-serif italic text-accent font-black tracking-tighter"&gt;{taskTimeRemaining}s</span&gt;
                </div&gt;

                <div className="pt-2"&gt;
                  <span className="text-[9px] uppercase tracking-widest text-[#F5F5F5]/40"&gt;Active Task ID: {activeRunningTask.id}</span&gt;
                  <h4 className="text-lg font-serif italic text-white tracking-tight mt-1"&gt;{activeRunningTask.title}</h4&gt;
                  <p className="text-xs text-gray-400 mt-1"&gt;Reward pool: <span className="text-accent font-bold"&gt;${activeRunningTask.reward.toFixed(2)}</span&gt;</p&gt;
                </div&gt;
              </div&gt;

              <div className="space-y-2 pb-2"&gt;
                <p className="text-[11px] text-[#F5F5F5]/50 leading-relaxed"&gt;
                  Earn-alignment protocols request user focus. Keep ads active until the countdown validates session mapping.
                </p&gt;
                
                <a 
                  href={activeRunningTask.destination} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="inline-flex items-center space-x-1.5 text-xs text-accent underline font-semibold hover:text-accent/80 pt-1"
                &gt;
                  <span&gt;Verify Ad Core Web Service</span&gt;
                  <ExternalLink className="w-3.5 h-3.5" /&gt;
                </a&gt;
              </div&gt;

              <div className="flex space-x-2.5 pt-2"&gt;
                <button 
                  onClick={handleCancelActiveTask} 
                  className="flex-1 bg-white/5 border border-white/10 text-gray-300 py-3.5 px-4 rounded-sm text-[10px] font-bold uppercase tracking-wider hover:bg-white/10 transition"
                &gt;
                  Terminate
                </button&gt;
                <button 
                  onClick={() =&gt; handleCompleteActiveTask(activeRunningTask)}
                  disabled={taskTimeRemaining &gt; 0}
                  className="flex-1 bg-accent text-black disabled:bg-white/10 disabled:text-white/40 py-3.5 px-4 rounded-sm text-[10px] font-bold uppercase tracking-wider transition"
                &gt;
                  {taskTimeRemaining &gt; 0 ? "Analyzing..." : "Claim Reward"}
                </button&gt;
              </div&gt;
            </motion.div&gt;
          </div&gt;
        )}
      </AnimatePresence&gt;

      {/* AUTH UI SCREEN (Clean and Production Ready) */}
      {!currentUser && !isLoadingAuth && (
        <div className="flex-1 flex flex-col justify-center p-6 max-w-md mx-auto w-full"&gt;
          <div className="text-center mb-8"&gt;
            <span className="font-sans text-[10px] uppercase tracking-[0.3em] opacity-50 mb-2 block"&gt;
              Global Security Workspace
            </span&gt;
            <h1 className="text-4xl font-sans font-bold tracking-tighter text-white uppercase"&gt;
              SYNC.EARN <span className="text-accent font-normal italic font-serif lowercase"&gt;v1.2.4</span&gt;
            </h1&gt;
            <p className="text-xs text-gray-500 mt-2 font-medium"&gt;Verified microtask settlement node feed</p&gt;
          </div&gt;

          <motion.div 
            layout
            className="bg-[#111111] p-6 rounded-sm border border-white/10 shadow-xl"
          &gt;
            <form onSubmit={handleAuthSubmit} className="space-y-4"&gt;
              {isSignup && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                &gt;
                  <div&gt;
                    <label className="text-[9px] font-bold tracking-widest text-[#F5F5F5]/50 uppercase block mb-1"&gt;Full Name (As per ID)</label&gt;
                    <input 
                      type="text" 
                      placeholder="e.g., JANE DOE" 
                      value={fullname}
                      onChange={(e) =&gt; setFullname(e.target.value)}
                      className="w-full bg-[#0A0A0A] p-4 rounded-sm border border-white/10 focus:border-accent outline-none text-xs text-white transition"
                    /&gt;
                  </div&gt;
                  <div&gt;
                    <label className="text-[9px] font-bold tracking-widest text-[#F5F5F5]/50 uppercase block mb-1"&gt;Unique Username</label&gt;
                    <input 
                      type="text" 
                      placeholder="e.g., janedoe" 
                      value={username}
                      onChange={(e) =&gt; setUsername(e.target.value)}
                      className="w-full bg-[#0A0A0A] p-4 rounded-sm border border-white/10 focus:border-accent outline-none text-xs text-white transition"
                    /&gt;
                  </div&gt;
                  <div&gt;
                    <label className="text-[9px] font-bold tracking-widest text-[#F5F5F5]/50 uppercase block mb-1"&gt;Select Country</label&gt;
                    <select 
                      value={country}
                      onChange={(e) =&gt; setCountry(e.target.value)}
                      className="w-full bg-[#0A0A0A] p-4 rounded-sm border border-white/10 focus:border-accent outline-none text-xs text-white transition appearance-none"
                    &gt;
                      <option value="" disabled&gt;Choose Your Country</option&gt;
                      <option value="Pakistan"&gt;Pakistan</option&gt;
                      <option value="India"&gt;India</option&gt;
                      <option value="Bangladesh"&gt;Bangladesh</option&gt;
                      <option value="UAE"&gt;United Arab Emirates</option&gt;
                      <option value="Saudi Arabia"&gt;Saudi Arabia</option&gt;
                      <option value="USA"&gt;United States</option&gt;
                      <option value="UK"&gt;United Kingdom</option&gt;
                      <option value="Global"&gt;Other / International</option&gt;
                    </select&gt;
                  </div&gt;
                </motion.div&gt;
              )}

              <div&gt;
                <label className="text-[9px] font-bold tracking-widest text-[#F5F5F5]/50 uppercase block mb-1"&gt;Email Address</label&gt;
                <input 
                  type="email" 
                  placeholder="e.g., user@syncearn.com" 
                  value={email}
                  onChange={(e) =&gt; setEmail(e.target.value)}
                  className="w-full bg-[#0A0A0A] p-4 rounded-sm border border-white/10 focus:border-accent outline-none text-xs text-white transition"
                /&gt;
              </div&gt;

              <div&gt;
                <label className="text-[9px] font-bold tracking-widest text-[#F5F5F5]/50 uppercase block mb-1"&gt;Password</label&gt;
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) =&gt; setPassword(e.target.value)}
                  className="w-full bg-[#0A0A0A] p-4 rounded-sm border border-white/10 focus:border-accent outline-none text-xs text-white transition"
                /&gt;
              </div&gt;

              {isSignup && (
                <div&gt;
                  <label className="text-[9px] font-bold tracking-widest text-[#F5F5F5]/50 uppercase block mb-1"&gt;Referral Code (Optional)</label&gt;
                  <input 
                    type="text" 
                    placeholder="Ref handler" 
                    value={referralCodeInput}
                    onChange={(e) =&gt; setReferralCodeInput(e.target.value)}
                    className="w-full bg-[#0A0A0A] p-4 rounded-sm border border-white/10 focus:border-accent outline-none text-xs text-accent tracking-wide font-mono transition"
                  /&gt;
                </div&gt;
              )}

              <div className="pt-4 flex flex-col space-y-3"&gt;
                <button 
                  type="submit" 
                  className="w-full bg-white text-black py-4 rounded-sm font-bold text-xs uppercase tracking-[0.25em] hover:bg-accent hover:text-black transition duration-150 shadow-md"
                &gt;
                  {isSignup ? 'CREATE SECURE ACCOUNT' : 'SIGN IN WORKSPACE'}
                </button&gt;
                
                <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-widest px-1"&gt;
                  <button 
                    type="button" 
                    onClick={() =&gt; setIsSignup(!isSignup)} 
                    className="hover:text-accent underline transition"
                  &gt;
                    {isSignup ? "Sign In" : "Register"}
                  </button&gt;
                  {!isSignup && (
                    <button 
                      type="button" 
                      onClick={handlePasswordReset} 
                      className="hover:text-accent underline transition"
                    &gt;
                      Reset Password
                    </button&gt;
                  )}
                </div&gt;
              </div&gt;
            </form&gt;
          </motion.div&gt;
        </div&gt;
      )}

      {/* LOADING WAITING SCREEN */}
      {isLoadingAuth && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center"&gt;
          <RotateCw className="w-8 h-8 text-accent animate-spin" /&gt;
          <p className="text-[10px] text-gray-400 font-medium font-mono mt-4 uppercase tracking-[0.25em]"&gt;
            Syncing secure ledger nodes...
          </p&gt;
        </div&gt;
      )}

      {/* LOGGED IN CORE PLATFORM UI */}
      {currentUser && !isLoadingAuth && (
        <div className="flex-1 flex flex-col h-full max-w-md mx-auto w-full overflow-hidden"&gt;
          
          <header className="bg-[#111111] border-b border-white/10 p-4 sticky top-0 z-[50] backdrop-blur-md shrink-0 flex justify-between items-center"&gt;
            <div className="flex items-center space-x-3 text-left"&gt;
              <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-sm font-serif italic text-accent font-bold bg-[#1a1a1a] shadow-lg overflow-hidden shrink-0 uppercase"&gt;
                {currentUser.profilePicUrl ? (
                  <img src={currentUser.profilePicUrl} className="w-full h-full object-cover" alt="User avatar" /&gt;
                ) : (
                  currentUser.fullname.charAt(0)
                )}
              </div&gt;
              <div&gt;
                <h1 className="text-xs font-black text-white tracking-tight uppercase"&gt;
                  {currentUser.fullname}
                </h1&gt;
                <p className="text-[10px] text-[#F5F5F5]/40 font-mono"&gt;
                  @{currentUser.username}
                </p&gt;
              </div&gt;
            </div&gt;

            <div className="flex items-center space-x-2"&gt;
              <button 
                onClick={handleLogOut}
                className="text-xs border border-white/10 bg-white/5 text-gray-300 p-2.5 rounded-sm hover:bg-white/15 transition-all"
                title="Log Out Session"
              &gt;
                <LogOut className="w-3.5 h-3.5" /&gt;
              </button&gt;
            </div&gt;
          </header&gt;

          <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-28 relative"&gt;
            
            {/* VIEW: DASHBOARD */}
            {activeView === 'dashboard' && (
              <div className="space-y-6"&gt;
                
                {/* Banner Welcome Info */}
                <div className="bg-gradient-to-br from-[#111] via-gray-950 to-[#0A0A0A] p-6 rounded-sm border border-white/10 shadow-xl relative overflow-hidden group text-left"&gt;
                  <div className="absolute -right-6 -bottom-6 text-accent/5 text-7xl font-serif font-black pointer-events-none select-none italic"&gt;
                    NT
                  </div&gt;
                  <span className="font-sans text-[10px] uppercase tracking-[0.25em] text-accent mb-2 block"&gt;Active Ledger Node</span&gt;
                  <h2 className="text-lg font-serif italic text-white tracking-tight"&gt;Welcome to <span className="text-accent font-sans font-bold tracking-tight uppercase not-italic"&gt;NT EARN HUB</span&gt; <span className="text-accent"&gt;🚀</span&gt;</h2&gt;
                  <p className="text-xs text-gray-400 mt-2 leading-relaxed font-sans"&gt;
                    The ultimate microtask settlement network. Turn your daily digital interactions into safe, instant payouts by validating high-yield cloud ad nodes, promotional video streams, and decentralized job validations.
                  </p&gt;
                </div&gt;

                {/* Editorial Capital Board layout */}
                <div className="bg-[#111111] border border-white/10 p-6 rounded-sm text-left relative overflow-hidden"&gt;
                  <span className="font-sans text-[10px] uppercase opacity-40 tracking-[0.3em] block mb-4"&gt;Accumulated Capital</span&gt;
                  <div className="flex justify-between items-end"&gt;
                    <div className="relative"&gt;
                      <span className="text-6xl font-serif italic text-accent leading-none"&gt;
                        ${Math.floor(currentUser.balance)}
                      </span&gt;
                      <span className="text-2xl font-sans font-light opacity-60"&gt;
                        .{(currentUser.balance % 1).toFixed(2).substring(2)}
                      </span&gt;
                    </div&gt;
                    
                    <div className="text-right"&gt;
                      <span className="text-[10px] uppercase opacity-40 tracking-widest block font-bold mb-1"&gt;Pending Funds</span&gt;
                      <span className="text-lg font-sans font-medium text-amber-500 font-mono"&gt;
                        ${currentUser.pending.toFixed(2)}
                      </span&gt;
                    </div&gt;
                  </div&gt;
                </div&gt;

                {/* Earning Zone category nodes list */}
                <div className="text-left"&gt;
                  <div className="flex justify-between items-baseline mb-4"&gt;
                    <h3 className="text-[11px] uppercase opacity-50 tracking-[0.3em] font-sans"&gt;Earning Channels</h3&gt;
                    <span className="text-[10px] tracking-widest opacity-40 font-mono"&gt;Select Feed</span&gt;
                  </div&gt;
                  
                  <div className="flex flex-col bg-[#111111] border border-white/10 divider divide-white/10 rounded-sm"&gt;
                    
                    <button 
                      onClick={() =&gt; handleOpenCategory('Watch Ads')}
                      className="p-6 hover:bg-[#1a1a1a] transition-all flex items-center justify-between group text-left"
                    &gt;
                      <div className="flex items-center space-x-4"&gt;
                        <div className="bg-accent/10 border border-accent/20 w-12 h-12 rounded-sm flex items-center justify-center text-accent group-hover:scale-105 transition-all"&gt;
                          <Tv className="w-5 h-5" /&gt;
                        </div&gt;
                        <div&gt;
                          <span className="text-sm font-bold text-white block"&gt;Promotional Video Ads</span&gt;
                          <span className="text-[10px] text-gray-400 tracking-tight"&gt;Ad server verified validation nodes</span&gt;
                        </div&gt;
                      </div&gt;
                      <ChevronRight className="text-gray-500 w-4 h-4" /&gt;
                    </button&gt;

                    <button 
                      onClick={() =&gt; handleOpenCategory('Short Videos')}
                      className="p-6 hover:bg-[#1a1a1a] transition-all border-t border-white/10 flex items-center justify-between group text-left"
                    &gt;
                      <div className="flex items-center space-x-4"&gt;
                        <div className="bg-accent/10 border border-accent/20 w-12 h-12 rounded-sm flex items-center justify-center text-accent group-hover:scale-105 transition-all"&gt;
                          <Play className="w-5 h-5" /&gt;
                        </div&gt;
                        <div&gt;
                          <span className="text-sm font-bold text-white block"&gt;Short Video Streams</span&gt;
                          <span className="text-[10px] text-gray-400 tracking-tight"&gt;Active media clustering validated feeds</span&gt;
                        </div&gt;
                      </div&gt;
                      <ChevronRight className="text-gray-500 w-4 h-4" /&gt;
                    </button&gt;

                    <button 
                      onClick={() =&gt; handleOpenCategory('Micro Tasks')}
                      className="p-6 hover:bg-[#1a1a1a] transition-all border-t border-white/10 flex items-center justify-between group text-left"
                    &gt;
                      <div className="flex items-center space-x-4"&gt;
                        <div className="bg-accent/10 border border-accent/20 w-12 h-12 rounded-sm flex items-center justify-center text-accent group-hover:scale-105 transition-all"&gt;
                          <ListCheck className="w-5 h-5" /&gt;
                        </div&gt;
                        <div&gt;
                          <span className="text-sm font-bold text-white block"&gt;Micro Job Settlements</span&gt;
                          <span className="text-[10px] text-gray-400 tracking-tight"&gt;Verification social settlement validations</span&gt;
                        </div&gt;
                      </div&gt;
                      <ChevronRight className="text-gray-500 w-4 h-4" /&gt;
                    </button&gt;

                  </div&gt;
                </div&gt;

              </div&gt;
            )}

            {/* VIEW: CATEGORY TASKS */}
            {activeView === 'tasks' && (
              <div className="space-y-4"&gt;
                <div className="flex justify-between items-center mb-6"&gt;
                  <div className="flex items-center space-x-3 text-left"&gt;
                    <button 
                      onClick={() =&gt; setActiveView('dashboard')} 
                      className="text-gray-400 hover:text-white transition-colors p-1"
                    &gt;
                      <ArrowLeft className="w-5 h-5" /&gt;
                    </button&gt;
                    <div&gt;
                      <span className="text-[10px] uppercase tracking-[0.25em] opacity-40 block"&gt;Available Feed</span&gt;
                      <h3 className="text-xl font-serif italic text-white tracking-tight"&gt;{taskCategoryName}</h3&gt;
                    </div&gt;
                  </div&gt;
                  <span className="text-[10px] opacity-40 uppercase tracking-[0.15em]"&gt;{tasksList.length} Options Available</span&gt;
                </div&gt;

                <div className="flex flex-col bg-[#111] border border-white/10 rounded-sm"&gt;
                  {tasksList.length === 0 ? (
                    <div className="text-center p-8 text-xs text-gray-500"&gt;No active settlement sessions currently loaded.</div&gt;
                  ) : (
                    tasksList.map((t, idx) =&gt; (
                      <div 
                        key={t.id} 
                        className={`p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center text-left ${idx &gt; 0 ? 'border-t border-white/10' : ''}`}
                      &gt;
                        <div className="space-y-1 pr-4 mb-3 sm:mb-0"&gt;
                          <span className="text-[9px] text-accent uppercase tracking-widest block font-bold"&gt;TASK INTEGRATION</span&gt;
                          <h4 className="text-base text-[#F5F5F5] font-sans leading-snug"&gt;{t.title}</h4&gt;
                          <span className="text-[10px] text-[#F5F5F5]/40 block font-mono"&gt;Process reward: <span className="text-accent font-bold"&gt;${t.reward.toFixed(2)}</span&gt;</span&gt;
                        </div&gt;
                        <button 
                          onClick={() =&gt; handleLaunchTask(t)}
                          className="bg-white text-black hover:bg-accent font-sans text-[10px] uppercase font-bold tracking-widest px-6 py-3 rounded-sm transition-all shadow-sm self-stretch sm:self-auto text-center"
                        &gt;
                          Execute Task
                        </button&gt;
                      </div&gt;
                    ))
                  )}
                </div&gt;
              </div&gt;
            )}

            {/* VIEW: WALLET */}
            {activeView === 'wallet' && (
              <div className="space-y-6 text-left"&gt;
                <div className="p-6 bg-[#111111] border border-white/10 rounded-sm"&gt;
                  <div className="flex items-center space-x-2 text-accent mb-3"&gt;
                    <ShieldCheck className="w-5 h-5 font-bold" /&gt;
                    <span className="font-sans text-[10px] uppercase tracking-[0.25em] font-bold"&gt;Crypto Clearance Gateway</span&gt;
                  </div&gt;
                  <p className="text-xs text-gray-400 leading-relaxed"&gt;
                    Processing node handles settlements dynamically. Ensure exact USDT deposit network parameters are specified to block transit network losses.
                  </p&gt;
                </div&gt;

                <div className="bg-[#111111] p-6 rounded-sm border border-white/10 space-y-4"&gt;
                  <h3 className="text-sm font-sans font-bold uppercase tracking-[0.2em] pb-3 border-b border-white/10 text-white"&gt;Withdraw Capital</h3&gt;
                  
                  <form onSubmit={handleInitiateWithdrawal} className="space-y-4"&gt;
                    <div className="space-[#111] space-y-2"&gt;
                      <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block"&gt;USDT Asset Network Protocol</label&gt;
                      <select 
                        value={withdrawNetwork}
                        onChange={(e) =&gt; setWithdrawNetwork(e.target.value)}
                        className="w-full bg-[#0A0A0A] p-4 rounded-sm border border-white/10 focus:border-accent outline-none text-xs text-white transition appearance-none"
                      &gt;
                        <option value="" disabled&gt;Select Network Protocol</option&gt;
                        <option value="TRC-20"&gt;USDT (TRC-20) - Tron Core System</option&gt;
                        <option value="BEP-20"&gt;USDT (BEP-20) - Binance Smart Chain (BSC)</option&gt;
                      </select&gt;
                    </div&gt;

                    <div className="space-y-2"&gt;
                      <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block"&gt;Target Core Wallet Address</label&gt;
                      <input 
                        type="text" 
                        placeholder="Paste TRC20/BEP20 Address" 
                        value={withdrawAddress}
                        onChange={(e) =&gt; setWithdrawAddress(e.target.value)}
                        className="w-full bg-[#0A0A0A] p-4 rounded-sm border border-white/10 text-xs text-white font-mono outline-none focus:border-accent transition"
                      /&gt;
                    </div&gt;

                    <div className="space-y-2"&gt;
                      <div className="flex justify-between items-center px-1"&gt;
                        <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest"&gt;Payout Allocation Limit</label&gt;
                        <span className="text-[9px] text-accent font-bold font-mono uppercase tracking-wider"&gt;
                          MIN $30 - MAX $500
                        </span&gt;
                      </div&gt;
                      <input 
                        type="number" 
                        placeholder="Amount in USD" 
                        value={withdrawAmount}
                        onChange={(e) =&gt; setWithdrawAmount(e.target.value)}
                        className="w-full bg-[#0A0A0A] p-4 rounded-sm border border-white/10 text-xs font-bold text-white outline-none focus:border-accent transition"
                      /&gt;
                    </div&gt;

                    <button 
                      type="submit" 
                      className="w-full bg-white text-black hover:bg-accent py-4 rounded-sm font-bold text-xs uppercase tracking-[0.2em] shadow-md transition-all active:scale-[0.98]"
                    &gt;
                      Initiate Safe Transfer
                    </button&gt;
                  </form&gt;
                </div&gt;
              </div&gt;
            )}

            {/* VIEW: REFERRALS */}
            {activeView === 'referrals' && (
              <div className="space-y-6 text-left"&gt;
                
                <div className="p-6 bg-[#111111] border border-white/10 rounded-sm"&gt;
                  <div className="flex items-center space-x-2 text-[#C1FF72] mb-3"&gt;
                    <Users className="w-5 h-5 text-accent" /&gt;
                    <span className="font-sans text-[10px] uppercase tracking-[0.25em] font-bold"&gt;Passive Affiliate Distribution</span&gt;
                  </div&gt;
                  <p className="text-xs text-gray-400 leading-relaxed"&gt;
                    Build your sub-tier media validators. Unlock an automatic 10% cash commission loop on every advertising and streaming settlement completed inside their workspace.
                  </p&gt;
                </div&gt;

                <div className="bg-[#111111] p-6 rounded-sm border border-white/10 text-center relative overflow-hidden"&gt;
                  <p className="text-[10px] text-gray-500 uppercase tracking-[0.3em] font-black mb-1"&gt;Affiliate Distribution Ledger</p&gt;
                  <h3 className="text-3xl font-serif italic text-accent mb-6 font-black"&gt;${currentUser.refEarnings.toFixed(4)}</h3&gt;

                  <p className="text-xs text-gray-400 mb-2 font-bold uppercase tracking-widest text-[9px]"&gt;Invitation Node URL</p&gt;
                  <div className="flex items-center space-x-2 bg-[#0A0A0A] p-2 rounded-sm border border-white/10"&gt;
                    <input 
                      type="text" 
                      readOnly 
                      value={`https://${window.location.host}/?ref=${currentUser.username}`}
                      className="flex-1 bg-transparent text-[11px] text-accent outline-none px-2 font-mono scrollbar-none"
                    /&gt;
                    <button 
                      onClick={handleCopyReferralLink}
                      className="bg-white text-black hover:bg-accent p-2 px-4 rounded-sm text-[10px] font-bold uppercase tracking-widest flex items-center space-x-1.5 transition-all"
                    &gt;
                      <Copy className="w-3" /&gt;
                      <span&gt;Copy</span&gt;
                    </button&gt;
                  </div&gt;
                </div&gt;

                <div className="space-y-3"&gt;
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]"&gt;My Activated Network</h3&gt;
                  <div className="bg-[#111111] rounded-sm border border-white/10 divide-y divide-white/10 overflow-hidden"&gt;
                    {referralList.length === 0 ? (
                      <div className="p-6 text-xs text-gray-500 text-center"&gt;No active credentials registered. Promote invitation link above.</div&gt;
                    ) : (
                      referralList.map((ref) =&gt; (
                        <div key={ref.id} className="p-4 flex justify-between items-center hover:bg-white/5 transition duration-150"&gt;
                          <div className="flex items-center space-x-3"&gt;
                            <div className="w-8 h-8 rounded-full border border-accent/20 bg-accent/10 text-accent flex items-center justify-center font-serif italic text-xs font-bold uppercase"&gt;
                              {ref.fromUser.charAt(0)}
                            </div&gt;
                            <div&gt;
                              <p className="text-xs font-bold text-white"&gt;{ref.fromUser}</p&gt;
                              <p className="text-[9px] text-gray-500 font-mono"&gt;{ref.date}</p&gt;
                            </div&gt;
                          </div&gt;
                          <div className="text-right"&gt;
                            <span className="text-xs font-bold text-accent block font-mono"&gt;+${ref.commission.toFixed(4)}</span&gt;
                            <span className="text-[8px] text-gray-500 uppercase tracking-widest font-bold"&gt;10% commission</span&gt;
                          </div&gt;
                        </div&gt;
                      ))
                    )}
                  </div&gt;
                </div&gt;

              </div&gt;
            )}

            {/* VIEW: TRANSACTION HISTORY */}
            {activeView === 'history' && (
              <div className="space-y-4 text-left"&gt;
                <div className="flex justify-between items-baseline mb-2"&gt;
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]"&gt;Transaction Ledger</h3&gt;
                  <span className="text-[9px] font-mono text-gray-500 uppercase"&gt;{transactionList.length} items logged</span&gt;
                </div&gt;
                
                <div className="flex flex-col bg-[#111] border border-white/10 divide-y divide-white/10 rounded-sm"&gt;
                  {transactionList.length === 0 ? (
                    <div className="p-8 text-xs text-gray-500 text-center"&gt;
                      Ledger is empty. Accumulate rewards to initialize transactional mapping.
                    </div&gt;
                  ) : (
                    transactionList.map((tx) =&gt; (
                      <div key={tx.id} className="p-5 flex justify-between items-center hover:bg-white/5 transition-all"&gt;
                        <div className="space-y-1.5 pr-2"&gt;
                          <span className={`text-[8px] font-black tracking-widest uppercase px-2 py-0.5 rounded-sm block w-max
                            ${tx.type === 'Task Reward' ? 'bg-accent/10 text-accent border border-accent/20' : ''}
                            ${tx.type === 'Withdrawal Request' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : ''}
                          `}&gt;
                            {tx.type}
                          </span&gt;
                          <span className="text-xs text-white block leading-tight font-sans"&gt;{tx.details}</span&gt;
                          <span className="text-[9px] text-gray-500 block font-mono"&gt;{tx.date}</span&gt;
                        </div&gt;
                        <div className="text-right shrink-0"&gt;
                          <span className={`text-sm font-bold block font-sans
                            ${tx.type === 'Task Reward' ? 'text-accent' : 'text-amber-500'}
                          `}&gt;
                            {tx.type === 'Task Reward' ? '+' : '-'}${tx.amount.toFixed(2)}
                          </span&gt;
                          <span className={`text-[8px] uppercase tracking-widest font-bold block mt-1
                            ${tx.status === 'completed' ? 'text-accent' : ''}
                            ${tx.status === 'pending' ? 'text-amber-400 animate-pulse' : ''}
                            ${tx.status === 'rejected' ? 'text-red-500' : ''}
                          `}&gt;
                            {tx.status}
                          </span&gt;
                        </div&gt;
                      </div&gt;
                    ))
                  )}
                </div&gt;
              </div&gt;
            )}

            {/* VIEW: PROFILE */}
            {activeView === 'profile' && (
              <div className="space-y-6 text-left"&gt;
                
                <div className="p-5 bg-[#111111] border border-white/10 rounded-sm flex items-center space-x-4"&gt;
                  <div className="w-14 h-14 border border-accent/20 bg-accent/15 text-accent rounded-full flex items-center justify-center text-xl font-serif italic font-bold shadow-lg overflow-hidden shrink-0 uppercase"&gt;
                    {currentUser.profilePicUrl ? (
                      <img src={currentUser.profilePicUrl} className="w-full h-full object-cover" alt="User avatar profile" /&gt;
                    ) : (
                      currentUser.fullname.charAt(0)
                    )}
                  </div&gt;
                  <div className="space-y-0.5 flex-1"&gt;
                    <span className="text-[9px] uppercase tracking-[0.2em] opacity-40"&gt;System Core Node</span&gt;
                    <h4 className="text-sm font-black text-white tracking-tight leading-none mt-1"&gt;{currentUser.fullname}</h4&gt;
                    <p className="text-xs text-accent font-mono font-medium"&gt;@{currentUser.username}</p&gt;
                    <p className="text-[10px] text-gray-500"&gt;{currentUser.email}</p&gt;
                    <span className="inline-block text-[9px] bg-white/5 border border-white/10 text-gray-400 px-2.5 py-0.5 rounded-sm font-bold uppercase mt-1.5 font-mono"&gt;
                      {currentUser.country}
                    </span&gt;
                  </div&gt;
                </div&gt;

                {/* SETTINGS: UPDATE PROFILE PICTURE & PASSWORD */}
                <div className="bg-[#111111] border border-white/10 rounded-sm p-5 space-y-6 shadow-xl"&gt;
                  {/* UPDATE PROFILE PICTURE */}
                  <div className="space-y-4"&gt;
                    <h3 className="text-xs font-bold text-accent uppercase tracking-[0.2em] flex items-center"&gt;
                      <span className="w-1.5 h-1.5 bg-accent rounded-full inline-block mr-2"&gt;</span&gt;
                      Update Profile Picture
                    </h3&gt;
                    
                    {/* Predefined Modern Premium Avatars */}
                    <div className="space-y-2"&gt;
                      <p className="text-[10px] text-gray-400 font-sans"&gt;Select from high-quality decentralized avatar presets:</p&gt;
                      <div className="grid grid-cols-6 gap-2"&gt;
                        {[
                          { name: 'Felix', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Felix' },
                          { name: 'Aneka', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Aneka' },
                          { name: 'Nala', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Nala' },
                          { name: 'Jack', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Jack' },
                          { name: 'Peanut', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Peanut' },
                          { name: 'Buster', url: 'https://api.dicebear.com/7.x/bottts/svg?seed=Buster' }
                        ].map((av) =&gt; (
                          <button
                            key={av.name}
                            type="button"
                            onClick={() =&gt; handleUpdateProfilePic(av.url)}
                            className={`w-10 h-10 rounded-full border bg-black/40 overflow-hidden hover:scale-105 transition flex items-center justify-center p-1 cursor-pointer ${
                              currentUser.profilePicUrl === av.url ? 'border-accent ring-1 ring-accent' : 'border-white/10'
                            }`}
                            title={`Select ${av.name}`}
                          &gt;
                            <img src={av.url} className="w-full h-full object-contain animate-fade-in" alt={av.name} referrerPolicy="no-referrer" /&gt;
                          </button&gt;
                        ))}
                      </div&gt;
                    </div&gt;

                    {/* Custom URL Field */}
                    <div className="space-y-2 pt-2 border-t border-white/5"&gt;
                      <p className="text-[10px] text-gray-400 font-sans"&gt;Or enter a custom image URL address:</p&gt;
                      <div className="flex gap-2"&gt;
                        <input
                          type="url"
                          placeholder="https://example.com/avatar.png"
                          value={customPicUrl}
                          onChange={(e) =&gt; setCustomPicUrl(e.target.value)}
                          className="flex-1 bg-black/60 border border-white/10 text-xs px-3 py-2 rounded-sm text-white placeholder-gray-600 focus:outline-none focus:border-accent"
                        /&gt;
                        <button
                          type="button"
                          onClick={() =&gt; handleUpdateProfilePic(customPicUrl)}
                          className="bg-white text-black hover:bg-accent hover:text-black hover:shadow-[0_0_15px_rgba(193,255,114,0.3)] transition text-xs font-black uppercase px-4 py-2 rounded-sm tracking-widest shrink-0"
                        &gt;
                          Save URL
                        </button&gt;
                      </div&gt;
                    </div&gt;
                  </div&gt;
                         {/* UPDATE PASSWORD FORM */}
                  <form onSubmit={handleUpdatePassword} className="space-y-4 pt-4 border-t border-white/10 text-left"&gt;
                    <h3 className="text-xs font-bold text-accent uppercase tracking-[0.2em] flex items-center"&gt;
                      <span className="w-1.5 h-1.5 bg-accent rounded-full inline-block mr-2 animate-pulse"&gt;</span&gt;
                      Secure Password Reset
                    </h3&gt;
                    <p className="text-[11px] text-gray-400 font-sans leading-relaxed"&gt;
                      Your registered email address is: <span className="text-white font-mono font-bold"&gt;{currentUser.email}</span&gt;. 
                      In accordance with security protocols, if you wish to reset or change your password, please click the button below to receive a secure reset link at your email address.
                    </p&gt;

                    <button
                      type="submit"
                      disabled={updatingPass}
                      className="w-full bg-accent text-black hover:bg-white hover:text-black hover:shadow-lg transition duration-200 text-xs font-black uppercase py-3 rounded-sm tracking-widest flex items-center justify-center space-x-2 cursor-pointer"
                    &gt;
                      {updatingPass ? (
                        <span&gt;Sending Secure Email...</span&gt;
                      ) : (
                        <span&gt;Send Password Reset Email Link ✉️</span&gt;
                      )}
                    </button&gt;
                  </form&gt;
                 {/* ADMIN / MONETIZATION CONTROL PANEL */}
                {isAdmin && (
                  <div className="bg-[#111111] border border-accent/20 rounded-sm p-5 space-y-4 shadow-xl"&gt;
                    <div className="flex justify-between items-center pb-3 border-b border-white/10"&gt;
                      <h3 className="text-xs font-bold text-accent uppercase tracking-[0.2em] flex items-center"&gt;
                        <span className="w-1.5 h-1.5 bg-accent rounded-full inline-block mr-2 animate-ping"&gt;</span&gt;
                        Earning Settings & Adsterra / Monetag Setup
                      </h3&gt;
                      <span className="bg-accent/10 text-accent font-mono text-[8px] font-bold px-2 py-0.5 rounded leading-none border border-accent/20"&gt;
                        APP OWNER ONLY
                      </span&gt;
                    </div&gt;

                    <p className="text-[11px] text-gray-400 font-sans leading-relaxed"&gt;
                      Configure your real ad network scripts, direct links, and survey gateways here. Customization instantly enables CPM web monetization, generating real revenue for you under your credentials when users execute tasks!
                    </p&gt;

                    <form onSubmit={handleSaveMonetizationSettings} className="space-y-4"&gt;
                      <div className="space-y-4"&gt;
                        {/* Adsterra Link */}
                        <div className="space-y-1"&gt;
                          <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block"&gt;
                            Adsterra Direct Link (CPM Ads)
                          </label&gt;
                          <input
                            type="url"
                            placeholder="Paste your Adsterra Direct Link (e.g. https://mocklink.com/1234)"
                            value={adminAdsterraLink}
                            onChange={(e) =&gt; setAdminAdsterraLink(e.target.value)}
                            className="w-full bg-black/60 border border-white/10 text-xs px-3 py-2.5 rounded-sm text-white focus:outline-none focus:border-accent"
                          /&gt;
                          <span className="text-[8px] text-gray-500 block leading-tight"&gt;
                            Go to <strong&gt;adsterra.com</strong&gt; &gt; Direct Links &gt; Request/Copy a link.
                          </span&gt;
                        </div&gt;

                        {/* Monetag SmartLink */}
                        <div className="space-y-1"&gt;
                          <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block"&gt;
                            Monetag / PropellerAds Smartlink
                          </label&gt;
                          <input
                            type="url"
                            placeholder="Paste your Monetag Smartlink (e.g. https://xml.monetag.com/your-id)"
                            value={adminMonetagLink}
                            onChange={(e) =&gt; setAdminMonetagLink(e.target.value)}
                            className="w-full bg-black/60 border border-white/10 text-xs px-3 py-2.5 rounded-sm text-white focus:outline-none focus:border-accent"
                          /&gt;
                          <span className="text-[8px] text-gray-500 block leading-tight"&gt;
                            Go to <strong&gt;monetag.com</strong&gt; &gt; Smartlink &gt; Copy URL.
                          </span&gt;
                        </div&gt;

                        {/* CPALead Link */}
                        <div className="space-y-1"&gt;
                          <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block"&gt;
                            CPALead Offerwall / CPA Content Gateway
                          </label&gt;
                          <input
                            type="url"
                            placeholder="Paste CPALead Offerwall link (e.g. https://eeoff.com/your-offer-id)"
                            value={adminCpaLeadLink}
                            onChange={(e) =&gt; setAdminCpaLeadLink(e.target.value)}
                            className="w-full bg-black/60 border border-white/10 text-xs px-3 py-2.5 rounded-sm text-white focus:outline-none focus:border-accent"
                          /&gt;
                          <span className="text-[8px] text-gray-500 block leading-tight"&gt;
                            Go to <strong&gt;cpalead.com</strong&gt; &gt; Offerwalls/Locker &gt; Copy offerwall link.
                          </span&gt;
                        </div&gt;

                        {/* Premium Short Video Portal Link */}
                        <div className="space-y-1"&gt;
                          <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block"&gt;
                            Short Video Earning Hub / Video Offerwall Link
                          </label&gt;
                          <input
                            type="url"
                            placeholder="Paste monetized video playlist or Lootably/HideoutTV link"
                            value={adminShortVidLink}
                            onChange={(e) =&gt; setAdminShortVidLink(e.target.value)}
                            className="w-full bg-black/60 border border-white/10 text-xs px-3 py-2.5 rounded-sm text-white focus:outline-none focus:border-accent"
                          /&gt;
                          <span className="text-[8px] text-gray-500 block leading-tight"&gt;
                            URL for monetized video channels or custom viral content.
                          </span&gt;
                        </div&gt;

                        {/* Alternative Micro Tasks Link */}
                        <div className="space-y-1"&gt;
                          <label className="text-[9px] font-bold text-gray-400 uppercase tracking-widest block"&gt;
                            Micro Tasks / Survey Gateway Link (Alternative)
                          </label&gt;
                          <input
                            type="url"
                            placeholder="Paste generic task wall web link"
                            value={adminMicroTasksLink}
                            onChange={(e) =&gt; setAdminMicroTasksLink(e.target.value)}
                            className="w-full bg-black/60 border border-white/10 text-xs px-3 py-2.5 rounded-sm text-white focus:outline-none focus:border-accent"
                          /&gt;
                        </div&gt;
                      </div&gt;

                      <button
                        type="submit"
                        disabled={saveLoading}
                        className="w-full bg-accent text-black hover:bg-white hover:text-black hover:shadow-lg transition duration-200 text-xs font-black uppercase py-4 rounded-sm tracking-widest flex items-center justify-center space-x-2 cursor-pointer"
                      &gt;
                        {saveLoading ? (
                          <span&gt;Updating Monetization Routes...</span&gt;
                        ) : (
                          <span&gt;Save Real Earning Settings 🚀</span&gt;
                        )}
                      </button&gt;
                    </form&gt;
                  </div&gt;
                )}
                </div&gt;

                <div className="bg-[#111111] border border-white/10 rounded-sm divide-y divide-white/10 overflow-hidden shadow-lg"&gt;
                  
                  <div 
                    onClick={() =&gt; setActiveView('support')}
                    className="p-5 flex justify-between items-center hover:bg-white/5 cursor-pointer transition-all group"
                  &gt;
                    <div className="flex items-center space-x-3"&gt;
                      <Headphones className="w-4 h-4 text-accent shrink-0" /&gt;
                      <span className="text-xs font-bold text-gray-300 group-hover:text-white transition"&gt;Contact Support Ticket Desk</span&gt;
                    </div&gt;
                    <ChevronRight className="w-4 h-4 text-gray-650" /&gt;
                  </div&gt;

                  <div 
                    onClick={handleLogOut}
                    className="p-5 flex justify-between items-center hover:bg-white/5 cursor-pointer transition text-red-500"
                  &gt;
                    <div className="flex items-center space-x-3"&gt;
                      <LogOut className="w-4 h-4 text-red-500 shrink-0" /&gt;
                      <span className="text-xs font-bold transition"&gt;Log Out Workspace Session</span&gt;
                    </div&gt;
                    <ChevronRight className="w-4 h-4 text-red-500/30" /&gt;
                  </div&gt;

                  <div 
                    onClick={handleDeleteAccount}
                    className="p-5 flex justify-between items-center hover:bg-red-500/10 cursor-pointer transition text-red-500"
                  &gt;
                    <div className="flex items-center space-x-3"&gt;
                      <Trash2 className="w-4 h-4 text-red-600 shrink-0" /&gt;
                      <span className="text-xs font-bold transition"&gt;Permanently Terminate Account</span&gt;
                    </div&gt;
                    <ChevronRight className="w-4 h-4 text-red-650" /&gt;
                  </div&gt;

                </div&gt;

              </div&gt;
            )}

            {/* VIEW: SUPPORT */}
            {activeView === 'support' && (
              <div className="space-y-4 text-left"&gt;
                <div className="flex justify-between items-center mb-4"&gt;
                  <div className="flex items-center space-x-3"&gt;
                    <button 
                      onClick={() =&gt; setActiveView('profile')} 
                      className="text-gray-400 hover:text-white p-1 transition"
                    &gt;
                      <ArrowLeft className="w-5 h-5" /&gt;
                    </button&gt;
                    <div&gt;
                      <span className="text-[10px] uppercase opacity-40 tracking-widest block"&gt;Core Node Help</span&gt;
                      <h3 className="text-xl font-serif italic text-white tracking-tight"&gt;Support Ticket Desk</h3&gt;
                    </div&gt;
                  </div&gt;
                </div&gt;

                <div className="bg-[#111111] p-6 rounded-sm border border-white/10 space-y-4"&gt;
                  <form onSubmit={handleSupportSubmit} className="space-y-4"&gt;
                    <div className="grid grid-cols-2 gap-3"&gt;
                      <div&gt;
                        <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block mb-1"&gt;Your Full Name</label&gt;
                        <input 
                          type="text" 
                          readOnly 
                          value={currentUser.fullname} 
                          className="w-full bg-[#0A0A0A] p-3 rounded-sm border border-white/10 text-xs text-gray-500 outline-none select-none cursor-not-allowed"
                        /&gt;
                      </div&gt;
                      <div&gt;
                        <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block mb-1"&gt;Your Username</label&gt;
                        <input 
                          type="text" 
                          readOnly 
                          value={`@${currentUser.username}`} 
                          className="w-full bg-[#0A0A0A] p-3 rounded-sm border border-white/10 text-xs text-accent outline-none select-none cursor-not-allowed"
                        /&gt;
                      </div&gt;
                    </div&gt;

                    <div&gt;
                      <label className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block mb-1"&gt;Account Email Node</label&gt;
                      <input 
                        type="text" 
                        readOnly 
                        value={currentUser.email} 
                        className="w-full bg-[#0A0A0A] p-3 rounded-sm border border-white/10 text-xs text-gray-500 outline-none select-none cursor-not-allowed"
                      /&gt;
                    </div&gt;

                    <div&gt;
                      <label className="text-[10px] font-bold text-gray-300 uppercase block mb-1"&gt;Ticket Subject</label&gt;
                      <input 
                        type="text" 
                        placeholder="e.g., Blocked deposit delay, App bug" 
                        value={supportSubject}
                        onChange={(e) =&gt; setSupportSubject(e.target.value)}
                        className="w-full bg-[#0A0A0A] p-4 rounded-sm border border-white/10 text-xs text-white outline-none focus:border-accent transition"
                      /&gt;
                    </div&gt;

                    <div&gt;
                      <label className="text-[10px] font-bold text-gray-300 uppercase block mb-1"&gt;Detailed Description</label&gt;
                      <textarea 
                        rows={4} 
                        placeholder="Detail your issue..." 
                        value={supportDescription}
                        onChange={(e) =&gt; setSupportDescription(e.target.value)}
                        className="w-full bg-[#0A0A0A] p-4 rounded-sm border border-white/10 text-xs text-white outline-none focus:border-accent transition resize-none"
                      /&gt;
                    </div&gt;

                    <button 
                      type="submit" 
                      className="w-full bg-white text-black hover:bg-accent py-4 rounded-sm font-bold text-xs uppercase tracking-widest shadow-md transition-all active:scale-[0.98]"
                    &gt;
                      File Support Ticket
                    </button&gt;
                  </form&gt;
                </div&gt;
              </div&gt;
            )}

          </main&gt;

          {/* CORE NAVIGATION BAR */}
          <nav className="bg-[#111111] border-t border-white/10 px-2 h-20 shrink-0 flex items-center justify-between sticky bottom-0 left-0 right-0 z-50 w-full shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.9)]"&gt;
            <button 
              onClick={() =&gt; setActiveView('dashboard')} 
              className={`flex flex-col items-center justify-center space-y-1 flex-1 h-full transition duration-150 ${
                activeView === 'dashboard' || activeView === 'tasks' ? 'text-accent font-bold font-sans' : 'text-gray-500 hover:text-gray-300'
              }`}
            &gt;
              <Tv className="w-5 h-5" /&gt;
              <span className="tracking-widest uppercase font-bold text-[8px]"&gt;Home</span&gt;
            </button&gt;
            
            <button 
              onClick={() =&gt; setActiveView('wallet')} 
              className={`flex flex-col items-center justify-center space-y-1 flex-1 h-full transition duration-150 ${
                activeView === 'wallet' ? 'text-accent font-bold' : 'text-gray-500 hover:text-gray-300'
              }`}
            &gt;
              <Wallet className="w-5 h-5" /&gt;
              <span className="tracking-widest uppercase font-bold text-[8px]"&gt;Wallet</span&gt;
            </button&gt;
            
            <button 
              onClick={() =&gt; setActiveView('referrals')} 
              className={`flex flex-col items-center justify-center space-y-1 flex-1 h-full transition duration-150 ${
                activeView === 'referrals' ? 'text-accent font-bold' : 'text-gray-500 hover:text-gray-300'
              }`}
            &gt;
              <Users className="w-5 h-5" /&gt;
              <span className="tracking-widest uppercase font-bold text-[8px]"&gt;Invite</span&gt;
            </button&gt;
            
            <button 
              onClick={() =&gt; setActiveView('history')} 
              className={`flex flex-col items-center justify-center space-y-1 flex-1 h-full transition duration-150 ${
                activeView === 'history' ? 'text-accent font-bold' : 'text-gray-500 hover:text-gray-300'
              }`}
            &gt;
              <Clock className="w-5 h-5" /&gt;
              <span className="tracking-widest uppercase font-bold text-[8px]"&gt;Ledger</span&gt;
            </button&gt;
            
            <button 
              onClick={() =&gt; setActiveView('profile')} 
              className={`flex flex-col items-center justify-center space-y-1 flex-1 h-full transition duration-150 ${
                activeView === 'profile' || activeView === 'support' ? 'text-accent font-bold' : 'text-gray-500 hover:text-gray-300'
              }`}
            &gt;
              <User className="w-5 h-5" /&gt;
              <span className="tracking-widest uppercase font-bold text-[8px]"&gt;Profile</span&gt;
            </button&gt;
          </nav&gt;

        </div&gt;
      )}

    </div&gt;
  );
}