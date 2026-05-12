import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyA7BUa4Qe3otPLSWP-pDuPUZsmVMhICqmc",
  authDomain: "sync-scale.firebaseapp.com",
  projectId: "sync-scale",
  storageBucket: "sync-scale.firebasestorage.app",
  messagingSenderId: "66964728618",
  appId: "1:66964728618:web:47df49602aab9b966dcc53"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

signInAnonymously(auth)
  .then(() => {
    console.log("Anonymous auth succeeded!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Anonymous auth failed:", error);
    process.exit(1);
  });
