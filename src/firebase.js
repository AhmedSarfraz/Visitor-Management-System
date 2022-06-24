import React from "react";
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const FirebaseContext = React.createContext(null);

const firebaseConfig = {
    apiKey: "AIzaSyBmmZINF30GDfhzNF7WMs1W-0nRBeO1xfQ",
    authDomain: "office-apps.firebaseapp.com",
    projectId: "office-apps",
    storageBucket: "office-apps.appspot.com",
    messagingSenderId: "463801785427",
    appId: "1:463801785427:web:3c886f9ec7162eccf0faa6"
};
initializeApp(firebaseConfig);

const addPrefix = (collectionName) => {
  return collectionName ? String(process.env.REACT_APP_COLLECTION_PREFIX)+String(collectionName) : ""
};

const db = getFirestore();

export {db, addPrefix, FirebaseContext}