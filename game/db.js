// ==========================================
// DB.JS - Firebase Firestore Live Artwork Gallery
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, serverTimestamp, query, orderBy } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

// Web app Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCsYLzwvL3X2IdSv-bEp89Lc8GEkhJg7OU",
  authDomain: "jejak-jawi-bestari.firebaseapp.com",
  projectId: "jejak-jawi-bestari",
  storageBucket: "jejak-jawi-bestari.firebasestorage.app",
  messagingSenderId: "552314341944",
  appId: "1:552314341944:web:56f793d23b453e2c6ef4cd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

/**
 * Saves a student's artwork to the 'gallery' collection in Firestore.
 * @param {string} studentName
 * @param {string} studentClass
 * @param {string} base64Image
 * @returns {Promise<string>} Created document ID
 */
export async function saveArtworkToDB(studentName, studentClass, base64Image) {
  try {
    const docRef = await addDoc(collection(db, 'gallery'), {
      studentName: studentName || 'Penjelajah Bestari',
      studentClass: studentClass || '3 Inovatif',
      image: base64Image,
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString()
    });
    console.log('Artwork saved to Firestore with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error adding artwork to Firestore:', error);
    throw error;
  }
}

/**
 * Fetches all artworks from the 'gallery' collection in Firestore,
 * ordered by timestamp descending.
 * @returns {Promise<Array>} List of artwork documents
 */
export async function fetchGalleryArtworks() {
  try {
    let q;
    try {
      q = query(collection(db, 'gallery'), orderBy('timestamp', 'desc'));
    } catch (e) {
      q = collection(db, 'gallery');
    }

    let querySnapshot;
    try {
      querySnapshot = await getDocs(q);
    } catch (err) {
      console.warn('OrderBy query failed, falling back to basic collection query:', err);
      querySnapshot = await getDocs(collection(db, 'gallery'));
    }

    const artworks = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      artworks.push({
        id: doc.id,
        ...data
      });
    });

    // Sort by timestamp or createdAt descending
    artworks.sort((a, b) => {
      const timeA = a.timestamp ? (a.timestamp.toMillis ? a.timestamp.toMillis() : (a.timestamp.seconds ? a.timestamp.seconds * 1000 : 0)) : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const timeB = b.timestamp ? (b.timestamp.toMillis ? b.timestamp.toMillis() : (b.timestamp.seconds ? b.timestamp.seconds * 1000 : 0)) : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return timeB - timeA;
    });

    return artworks;
  } catch (error) {
    console.error('Error fetching gallery artworks from Firestore:', error);
    return [];
  }
}
