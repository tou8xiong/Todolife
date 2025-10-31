
import { initializeApp } from "firebase/app";
import {getFirestore} from "firebase/firestore"


const firebaseConfig = {
  apiKey: "AIzaSyDeqGoqVtkYfy9rCErlMYRZxmsTSLnWoDw",
  authDomain: "todolife-7fb55.firebaseapp.com",
  projectId: "todolife-7fb55",
  storageBucket: "todolife-7fb55.firebasestorage.app",
  messagingSenderId: "1086346775985",
  appId: "1:1086346775985:web:29d5184cd9a38ff2660190"
};

const app = initializeApp(firebaseConfig);
const UsersDB = getFirestore(app); 
 export default UsersDB;