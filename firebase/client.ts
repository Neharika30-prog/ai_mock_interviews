import { initializeApp ,getApp , getApps} from "firebase/app";
import {getAuth} from "firebase/auth";
import {getFirestore} from "firebase/firestore";



const firebaseConfig = {
  apiKey: "AIzaSyDbe4LfXol2aGK0UC3WgjqVgRFyzpMuQE4",
  authDomain: "intervue-3fb94.firebaseapp.com",
  projectId: "intervue-3fb94",
  storageBucket: "intervue-3fb94.firebasestorage.app",
  messagingSenderId: "679959935796",
  appId: "1:679959935796:web:0aa82ea276c90d853f8361",
  measurementId: "G-VKQETD1ZDM"
};

const app = !getApps.length? initializeApp(firebaseConfig) :getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);
