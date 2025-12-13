
import { initializeApp, getApp, getApps } from "firebase/app";
import {getAuth} from "firebase/auth";


const firebaseConfig = {
  apiKey: "AIzaSyDeqGoqVtkYfy9rCErlMYRZxmsTSLnWoDw",
  authDomain: "todolife-7fb55.firebaseapp.com",
  projectId: "todolife-7fb55",
  storageBucket: "todolife-7fb55.firebasestorage.app",
  messagingSenderId: "1086346775985",
  appId: "1:1086346775985:web:29d5184cd9a38ff2660190"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
 
