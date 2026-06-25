import { 
  ref, 
  runTransaction, 
  get, 
  set, 
  push, 
  child,
  onValue, 
  query, 
  orderByChild, 
  equalTo,
  increment 
} from 'firebase/database';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  deleteUser,
  onAuthStateChanged,
  User as FirebaseUser,
  updatePassword as firebaseUpdatePassword
} from 'firebase/auth';
import { dbInstance, authInstance } from './firebase';
import { UserProfile, Transaction, ReferralRecord, SupportTicket, MonetizationSettings } from './types';

// Sandbox State Store in LocalStorage
const LOCAL_STORAGE_KEY_MONETIZATION = 'nt_sandbox_monetization';
const DEFAULT_MONETIZATION_SETTINGS: MonetizationSettings = {
  adsterraDirectLink: '',
  monetagSmartlink: '',
  cpaLeadOfferwall: '',
  shortVideoFeed: '',
  microTasksOfferwall: ''
};

// Sandbox State Store in LocalStorage
const LOCAL_STORAGE_KEY_USER = 'nt_sandbox_user_profile';
const LOCAL_STORAGE_KEY_TRANSACTIONS = 'nt_sandbox_transactions';
const LOCAL_STORAGE_KEY_REFERRALS = 'nt_sandbox_referrals';
const LOCAL_STORAGE_KEY_TICKETS = 'nt_sandbox_tickets';

// Default initial user data
const DEFAULT_USER_PROFILE: UserProfile = {
  uid: 'sandbox_test_123',
  fullname: 'Test Worker',
  username: 'testworker',
  email: 'tester@ntearnhub.com',
  country: 'Pakistan',
  balance: 10.50,
  pending: 0.0,
  refEarnings: 1.50,
  referredBy: 'admin_invite',
  completedTasks: {}
};

const DEFAULT_SANDBOX_REFERRALS: ReferralRecord[] = [
  { id: 'ref_1', fromUser: 'Kamil Shah', commission: 0.85, date: '2026-06-09' },
  { id: 'ref_2', fromUser: 'Ayesha Khan', commission: 0.65, date: '2026-06-10' }
];

const DEFAULT_SANDBOX_TRANSACTIONS: Transaction[] = [
  { id: 'tx_s1', type: 'Task Reward', amount: 0.25, status: 'completed', details: 'Completed Telegram Node Engagement', date: '2026-06-10' },
  { id: 'tx_s2', type: 'Task Reward', amount: 0.40, status: 'completed', details: 'Completed Global Identity Validation', date: '2026-06-10' },
  { id: 'tx_s3', type: 'Withdrawal Request', amount: 15.00, status: 'pending', details: 'Withdraw USDT (TRC-20) to TXvR8Y...', date: '2026-06-09' }
];

// Helper to determine if we are in Sandbox Mode
export const getSavedMode = (): boolean => {
  const mode = localStorage.getItem('nt_earnhub_mode');
  return mode === 'sandbox' || !mode;
};

export const saveModeSelection = (isSandbox: boolean) => {
  localStorage.setItem('nt_earnhub_mode', isSandbox ? 'sandbox' : 'live');
};

class DBService {
  private isSandboxMode: boolean = getSavedMode();
  
  constructor() {
    this.isSandboxMode = getSavedMode();
  }

  setMode(sandbox: boolean) {
    this.isSandboxMode = sandbox;
    saveModeSelection(sandbox);
  }

  getMode() {
    return this.isSandboxMode;
  }

  // Auth Operations
  async signUp(email: string, password: string, fullname: string, username: string, country: string, referredBy: string): Promise<any> {
    if (this.isSandboxMode) {
      const mockUid = 'sandbox_' + Math.random().toString(36).substring(2, 9);
      const profile: UserProfile = {
        uid: mockUid,
        fullname,
        username: username.toLowerCase().trim(),
        email,
        country,
        balance: 0.0,
        pending: 0.0,
        refEarnings: 0.0,
        referredBy: referredBy || '',
        completedTasks: {}
      };
      
      localStorage.setItem(LOCAL_STORAGE_KEY_USER, JSON.stringify(profile));
      localStorage.setItem(LOCAL_STORAGE_KEY_TRANSACTIONS, JSON.stringify([]));
      localStorage.setItem(LOCAL_STORAGE_KEY_REFERRALS, JSON.stringify([]));
      return profile;
    } else {
      const cred = await createUserWithEmailAndPassword(authInstance, email, password);
      
      try {
        await sendEmailVerification(cred.user);
      } catch (err) {
        console.warn("Could not dispatch verification email:", err);
      }
      
      const profile: UserProfile = {
        uid: cred.user.uid,
        fullname,
        username: username.toLowerCase().trim(),
        email,
        country,
        balance: 0.0,
        pending: 0.0,
        refEarnings: 0.0,
        referredBy: referredBy || '',
        completedTasks: {}
      };

      await set(ref(dbInstance, `users/${cred.user.uid}`), {
        fullname,
        username: username.toLowerCase().trim(),
        country,
        balance: 0.0,
        pending: 0.0,
        refEarnings: 0.0,
        referredBy: referredBy || ''
      });

      return profile;
    }
  }

  async signIn(email: string, password: string): Promise<any> {
    if (this.isSandboxMode) {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY_USER);
      if (stored) {
        const u = JSON.parse(stored) as UserProfile;
        if (u.email.toLowerCase() === email.toLowerCase()) {
          return u;
        }
      }
      const profile: UserProfile = {
        ...DEFAULT_USER_PROFILE,
        uid: 'sandbox_' + Math.random().toString(36).substring(2, 9),
        email,
        fullname: email.split('@')[0].toUpperCase(),
        username: email.split('@')[0].toLowerCase()
      };
      localStorage.setItem(LOCAL_STORAGE_KEY_USER, JSON.stringify(profile));
      if (!localStorage.getItem(LOCAL_STORAGE_KEY_TRANSACTIONS)) {
        localStorage.setItem(LOCAL_STORAGE_KEY_TRANSACTIONS, JSON.stringify(DEFAULT_SANDBOX_TRANSACTIONS));
      }
      if (!localStorage.getItem(LOCAL_STORAGE_KEY_REFERRALS)) {
        localStorage.setItem(LOCAL_STORAGE_KEY_REFERRALS, JSON.stringify(DEFAULT_SANDBOX_REFERRALS));
      }
      return profile;
    } else {
      const cred = await signInWithEmailAndPassword(authInstance, email, password);
      
      // 🚀 FIX: Zabardasti token refresh karein taake latest "Email Verified" status foran mil jaye
      await cred.user.reload(); 
      
      if (!cred.user.emailVerified) {
        await signOut(authInstance); // Flush the phantom session
        throw new Error('EMAIL_UNVERIFIED');
      }

      const snap = await get(ref(dbInstance, `users/${cred.user.uid}`));
      return { uid: cred.user.uid, ...snap.val() };
    }
  }

  async signOut(): Promise<void> {
    if (this.isSandboxMode) {
      return;
    } else {
      await signOut(authInstance);
    }
  }

  async resetPassword(email: string): Promise<void> {
    if (this.isSandboxMode) {
      return;
    } else {
      await sendPasswordResetEmail(authInstance, email);
    }
  }

  async deleteUserData(uid: string): Promise<void> {
    if (this.isSandboxMode) {
      localStorage.removeItem(LOCAL_STORAGE_KEY_USER);
      localStorage.removeItem(LOCAL_STORAGE_KEY_TRANSACTIONS);
      localStorage.removeItem(LOCAL_STORAGE_KEY_REFERRALS);
      localStorage.removeItem(LOCAL_STORAGE_KEY_TICKETS);
    } else {
      await set(ref(dbInstance, `users/${uid}`), null);
      if (authInstance.currentUser) {
        await deleteUser(authInstance.currentUser);
      }
    }
  }

  subscribeToProfile(uid: string, callback: (profile: UserProfile | null) => void): () => void {
    if (this.isSandboxMode) {
      const load = () => {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY_USER);
        if (stored) {
          callback(JSON.parse(stored) as UserProfile);
        } else {
          localStorage.setItem(LOCAL_STORAGE_KEY_USER, JSON.stringify(DEFAULT_USER_PROFILE));
          callback(DEFAULT_USER_PROFILE);
        }
      };
      
      load();
      window.addEventListener('storage', load);
      const intervalId = setInterval(load, 1500);

      return () => {
        window.removeEventListener('storage', load);
        clearInterval(intervalId);
      };
    } else {
      const userRef = ref(dbInstance, `users/${uid}`);
      const unsub = onValue(userRef, (snapshot) => {
        const val = snapshot.val();
        if (val) {
          callback({
            uid,
            fullname: val.fullname || 'Active User',
            username: val.username || 'user',
            email: authInstance.currentUser?.email || '',
            country: val.country || 'Global',
            balance: Number(val.balance || 0),
            pending: Number(val.pending || 0),
            refEarnings: Number(val.refEarnings || 0),
            referredBy: val.referredBy || '',
            profilePicUrl: val.profilePicUrl,
            completedTasks: val.completedTasks || {} // ATOMIC FIX: Pull strict server timestamps
          });
        } else {
          callback(null);
        }
      }, (error) => {
        console.error("Firebase read profile failed: ", error);
      });
      return unsub;
    }
  }

  subscribeToReferrals(uid: string, callback: (refs: ReferralRecord[]) => void): () => void {
    if (this.isSandboxMode) {
      const load = () => {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY_REFERRALS);
        if (stored) {
          callback(JSON.parse(stored) as ReferralRecord[]);
        } else {
          localStorage.setItem(LOCAL_STORAGE_KEY_REFERRALS, JSON.stringify(DEFAULT_SANDBOX_REFERRALS));
          callback(DEFAULT_SANDBOX_REFERRALS);
        }
      };
      load();
      const intId = setInterval(load, 1500);
      return () => clearInterval(intId);
    } else {
      const referralsRef = ref(dbInstance, `referrals/${uid}`);
      const unsub = onValue(referralsRef, (snapshot) => {
        const val = snapshot.val();
        const list: ReferralRecord[] = [];
        if (val) {
          Object.entries(val).forEach(([key, value]: [string, any]) => {
            list.push({
              id: key,
              fromUser: value.fromUser || 'Anonymous User',
              commission: Number(value.commission || 0),
              date: value.date || new Date().toISOString().split('T')[0]
            });
          });
        }
        callback(list.reverse());
      });
      return unsub;
    }
  }

  subscribeToTransactions(uid: string, callback: (txs: Transaction[]) => void): () => void {
    if (this.isSandboxMode) {
      const load = () => {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY_TRANSACTIONS);
        if (stored) {
          callback(JSON.parse(stored) as Transaction[]);
        } else {
          localStorage.setItem(LOCAL_STORAGE_KEY_TRANSACTIONS, JSON.stringify(DEFAULT_SANDBOX_TRANSACTIONS));
          callback(DEFAULT_SANDBOX_TRANSACTIONS);
        }
      };
      load();
      const intId = setInterval(load, 1500);
      return () => clearInterval(intId);
    } else {
      const txRef = ref(dbInstance, `transactions/${uid}`);
      const unsub = onValue(txRef, (snapshot) => {
        const val = snapshot.val();
        const list: Transaction[] = [];
        if (val) {
          Object.entries(val).forEach(([key, value]: [string, any]) => {
            list.push({
              id: key,
              type: value.type,
              amount: Number(value.amount || 0),
              status: value.status || 'completed',
              details: value.details || '',
              date: value.date || new Date().toISOString().split('T')[0]
            });
          });
        }
        callback(list.reverse());
      });
      return unsub;
    }
  }

    async completeTask(uid: string, taskId: string, taskTitle: string, reward: number): Promise<void> {
    const timestampNow = Date.now(); // SECURITY LOCK: Exact atomic time generated

    if (this.isSandboxMode) {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY_USER);
      if (stored) {
        const profile = JSON.parse(stored) as UserProfile;
        profile.balance = Number((profile.balance + reward).toFixed(2));
        if (!profile.completedTasks) profile.completedTasks = {};
        profile.completedTasks[taskId] = timestampNow; // Save lock time locally
        
        // 🛡️ ANTI-BAN PROTOCOL: Daily Ad Counter Sync
        const today = new Date().toISOString().split('T')[0];
        if (profile.lastAdDate === today) {
          profile.dailyAdCount = (profile.dailyAdCount || 0) + 1; // Aaj ke din mein +1 click
        } else {
          profile.dailyAdCount = 1; // Naya din shuru, counter reset to 1
          profile.lastAdDate = today;
        }
        
        localStorage.setItem(LOCAL_STORAGE_KEY_USER, JSON.stringify(profile));

        const txsStored = localStorage.getItem(LOCAL_STORAGE_KEY_TRANSACTIONS);
        const txs = txsStored ? (JSON.parse(txsStored) as Transaction[]) : [];
        const newTx: Transaction = {
          id: 'tx_sb_' + Math.random().toString(36).substring(3, 8),
          type: 'Task Reward',
          amount: reward,
          status: 'completed',
          details: `Completed "${taskTitle}"`,
          date: today // Reused 'today' variable safely
        };
        txs.push(newTx);
        localStorage.setItem(LOCAL_STORAGE_KEY_TRANSACTIONS, JSON.stringify(txs));
      }
      return; // Ensure sandbox execution stops here
    }

        if (profile.referredBy) {
          const commission = Number((reward * 0.10).toFixed(4));
          const refsStored = localStorage.getItem(LOCAL_STORAGE_KEY_REFERRALS);
          const refs = refsStored ? (JSON.parse(refsStored) as ReferralRecord[]) : [];
          refs.push({
            id: 'ref_sb_' + Math.random().toString(36).substring(3, 8),
            fromUser: profile.fullname || profile.username,
            commission: commission,
            date: new Date().toISOString().split('T')[0]
          });
          localStorage.setItem(LOCAL_STORAGE_KEY_REFERRALS, JSON.stringify(refs));

          profile.refEarnings = Number((profile.refEarnings + commission).toFixed(4));
          localStorage.setItem(LOCAL_STORAGE_KEY_USER, JSON.stringify(profile));
        }
      }
    } else {
      const userBalancePath = ref(dbInstance, `users/${uid}/balance`);
      await set(userBalancePath, increment(reward));

      // ATOMIC FIX: Save the strict 24-hour lock timestamp securely into Database
      await set(ref(dbInstance, `users/${uid}/completedTasks/${taskId}`), timestampNow);

      const userTxPushRef = push(ref(dbInstance, `transactions/${uid}`));
      await set(userTxPushRef, {
        type: 'Task Reward',
        amount: reward,
        status: 'completed',
        details: `Completed "${taskTitle}"`,
        date: new Date().toISOString().split('T')[0]
      });

      const userProfileSnap = await get(ref(dbInstance, `users/${uid}`));
      const userData = userProfileSnap.val();
      
      if (userData && userData.referredBy) {
        const commission = Number((reward * 0.10).toFixed(4));
        const referrerUsername = String(userData.referredBy).toLowerCase().trim();

        const usersRef = ref(dbInstance, 'users');
        const referrerQuery = query(usersRef, orderByChild('username'), equalTo(referrerUsername));
        const referrerSnap = await get(referrerQuery);

        if (referrerSnap.exists()) {
          const referrerUid = Object.keys(referrerSnap.val())[0];
          
          await set(ref(dbInstance, `users/${referrerUid}/balance`), increment(commission));
          await set(ref(dbInstance, `users/${referrerUid}/refEarnings`), increment(commission));

          const refDetailPushRef = push(ref(dbInstance, `referrals/${referrerUid}`));
          await set(refDetailPushRef, {
            fromUser: userData.fullname || userData.username || 'Ecosystem Node',
            commission: commission,
            date: new Date().toISOString().split('T')[0]
          });
        }
      }
    }
  }

  async withdrawFunds(uid: string, amount: number, network: string, walletAddress: string): Promise<void> {
    if (this.isSandboxMode) {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY_USER);
      if (stored) {
        const profile = JSON.parse(stored) as UserProfile;
        if (profile.balance < amount) {
          throw new Error('Insufficient available balance.');
        }
        profile.balance = Number((profile.balance - amount).toFixed(2));
        profile.pending = Number((profile.pending + amount).toFixed(2));
        localStorage.setItem(LOCAL_STORAGE_KEY_USER, JSON.stringify(profile));

        const txsStored = localStorage.getItem(LOCAL_STORAGE_KEY_TRANSACTIONS);
        const txs = txsStored ? (JSON.parse(txsStored) as Transaction[]) : [];
        txs.push({
          id: 'tx_sb_w' + Math.random().toString(36).substring(3, 8),
          type: 'Withdrawal Request',
          amount,
          status: 'pending',
          details: `Withdraw USDT (${network}) to ${walletAddress.substring(0, 5)}...${walletAddress.substring(walletAddress.length - 4)}`,
          date: new Date().toISOString().split('T')[0]
        });
        localStorage.setItem(LOCAL_STORAGE_KEY_TRANSACTIONS, JSON.stringify(txs));
      }
    } else {
      const userRef = ref(dbInstance, `users/${uid}`);
      await runTransaction(userRef, (current) => {
        if (current) {
          const currentBal = Number(current.balance || 0);
          if (currentBal >= amount) {
            current.balance = Number((currentBal - amount).toFixed(2));
            current.pending = Number(((current.pending || 0) + amount).toFixed(2));
          } else {
            return undefined; 
          }
        }
        return current;
      });

      const userTxPushRef = push(ref(dbInstance, `transactions/${uid}`));
      await set(userTxPushRef, {
        type: 'Withdrawal Request',
        amount: amount,
        status: 'pending',
        details: `USDT (${network}) withdraw request to ${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`,
        date: new Date().toISOString().split('T')[0]
      });
    }
  }

  async updatePicUrl(uid: string, url: string): Promise<void> {
    if (this.isSandboxMode) {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY_USER);
      if (stored) {
        const profile = JSON.parse(stored) as UserProfile;
        profile.profilePicUrl = url;
        localStorage.setItem(LOCAL_STORAGE_KEY_USER, JSON.stringify(profile));
      }
    } else {
      await set(ref(dbInstance, `users/${uid}/profilePicUrl`), url);
    }
  }

  async updateAccountPassword(password: string): Promise<void> {
    if (this.isSandboxMode) {
      return;
    } else {
      const user = authInstance.currentUser;
      if (user) {
        await firebaseUpdatePassword(user, password);
      } else {
        throw new Error('No active user found to change password');
      }
    }
  }

  async fileTicket(uid: string, username: string, name: string, email: string, subject: string, description: string, attachmentUrl?: string): Promise<void> {
    if (this.isSandboxMode) {
      const ticketsStored = localStorage.getItem(LOCAL_STORAGE_KEY_TICKETS);
      const tickets = ticketsStored ? JSON.parse(ticketsStored) : [];
      tickets.push({
        ticketId: 'tkt_' + Math.random().toString(36).substring(3, 8),
        uid,
        fullname: name,
        username,
        email,
        subject,
        description,
        attachmentUrl,
        status: 'open',
        timestamp: new Date().toISOString()
      });
      localStorage.setItem(LOCAL_STORAGE_KEY_TICKETS, JSON.stringify(tickets));
    } else {
      const ticketPushRef = push(ref(dbInstance, 'support_tickets'));
      const ticketId = ticketPushRef.key;
      await set(ticketPushRef, {
        ticketId,
        uid,
        username,
        fullname: name,
        email,
        subject,
        description,
        attachmentUrl: attachmentUrl || '',
        status: 'open',
        timestamp: new Date().toISOString()
      });
    }
  }

  async getMonetizationSettings(): Promise<MonetizationSettings> {
    if (this.isSandboxMode) {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY_MONETIZATION);
      if (stored) {
        return JSON.parse(stored) as MonetizationSettings;
      }
      return DEFAULT_MONETIZATION_SETTINGS;
    } else {
      const snap = await get(ref(dbInstance, 'settings/monetization'));
      if (snap.exists()) {
        const val = snap.val();
        return {
          adsterraDirectLink: val.adsterraDirectLink || '',
          monetagSmartlink: val.monetagSmartlink || '',
          cpaLeadOfferwall: val.cpaLeadOfferwall || '',
          shortVideoFeed: val.shortVideoFeed || '',
          microTasksOfferwall: val.microTasksOfferwall || ''
        };
      }
      return DEFAULT_MONETIZATION_SETTINGS;
    }
  }

  async saveMonetizationSettings(settings: MonetizationSettings): Promise<void> {
    if (this.isSandboxMode) {
      localStorage.setItem(LOCAL_STORAGE_KEY_MONETIZATION, JSON.stringify(settings));
    } else {
      await set(ref(dbInstance, 'settings/monetization'), settings);
    }
  }

  onAuthStateChanged(callback: (user: FirebaseUser | null) => void): () => void {
    if (this.isSandboxMode) {
      return () => {};
    } else {
      return onAuthStateChanged(authInstance, callback);
    }
  }
}

export const dbService = new DBService();
