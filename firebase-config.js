/* Arquivo: firebase-config.js */
// Substitua os dados abaixo pelos que você copiou do Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyDrThMwRTXl6b4oY5zqxDtKcTj8J9VrlnE",
  authDomain: "bandfolio-13d13.firebaseapp.com",
  databaseURL: "https://bandfolio-13d13-default-rtdb.firebaseio.com",
  projectId: "bandfolio-13d13",
  storageBucket: "bandfolio-13d13.firebasestorage.app",
  messagingSenderId: "494920789757",
  appId: "1:494920789757:web:f23620af56c4fbbd909894"
};

// Inicializa o Firebase (Global)
firebase.initializeApp(firebaseConfig);
const db = firebase.database();