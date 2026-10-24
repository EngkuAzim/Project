// ==========================================
// DB.JS - Firebase Firestore Live Artwork Gallery
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, serverTimestamp, query, orderBy, limit, startAfter } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

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

export const GALLERY_PAGE_SIZE = 10;

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
      studentClass: studentClass || '4 Inovatif',
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
 * Fetches paginated artworks from the 'gallery' collection in Firestore.
 * Uses limit(10) and startAfter() cursor to avoid browser freezing and bandwidth spikes.
 * @param {number} pageSize - Number of items to fetch per batch (default: 10)
 * @param {DocumentSnapshot|null} lastDoc - Cursor for next page
 * @returns {Promise<{ artworks: Array, lastVisibleDoc: Object|null, hasMore: boolean }>}
 */
export async function fetchGalleryArtworks(pageSize = GALLERY_PAGE_SIZE, lastDoc = null) {
  try {
    let q;
    try {
      if (lastDoc) {
        q = query(
          collection(db, 'gallery'),
          orderBy('timestamp', 'desc'),
          startAfter(lastDoc),
          limit(pageSize)
        );
      } else {
        q = query(
          collection(db, 'gallery'),
          orderBy('timestamp', 'desc'),
          limit(pageSize)
        );
      }
    } catch (e) {
      console.warn('Constructing query with orderBy failed:', e);
      q = query(collection(db, 'gallery'), limit(pageSize));
    }

    let querySnapshot;
    try {
      querySnapshot = await getDocs(q);
    } catch (err) {
      console.warn('OrderBy query failed, falling back to basic limited query:', err);
      querySnapshot = await getDocs(query(collection(db, 'gallery'), limit(pageSize)));
    }

    const artworks = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      artworks.push({
        id: doc.id,
        ...data
      });
    });

    const docs = querySnapshot.docs || [];
    const lastVisibleDoc = docs.length > 0 ? docs[docs.length - 1] : null;
    const hasMore = docs.length === pageSize;

    return {
      artworks,
      lastVisibleDoc,
      hasMore
    };
  } catch (error) {
    console.error('Error fetching gallery artworks from Firestore:', error);
    return {
      artworks: [],
      lastVisibleDoc: null,
      hasMore: false
    };
  }
}
