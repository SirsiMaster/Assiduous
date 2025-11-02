/**
 * Favorites Service
 * Manages user's favorite/saved properties using Firestore subcollections
 */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  getDocs,
  onSnapshot,
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore.js";

// Initialize Firebase (assuming firebase-init.js exports firebaseConfig)
let app, auth, db;

/**
 * Initialize the favorites service
 * @param {Object} firebaseConfig - Firebase configuration object
 */
export function initializeFavoritesService(firebaseConfig) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
}

/**
 * Save a property to user's favorites
 * @param {string} propertyId - Property document ID
 * @returns {Promise<void>}
 */
export async function saveFavorite(propertyId) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Not signed in. Please log in to save favorites.");
  }

  const favoriteRef = doc(db, `users/${user.uid}/favorites/${propertyId}`);
  await setDoc(favoriteRef, {
    propertyId,
    createdAt: serverTimestamp(),
  }, { merge: true });

  console.log(`Property ${propertyId} saved to favorites`);
}

/**
 * Remove a property from user's favorites
 * @param {string} propertyId - Property document ID
 * @returns {Promise<void>}
 */
export async function removeFavorite(propertyId) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Not signed in");
  }

  const favoriteRef = doc(db, `users/${user.uid}/favorites/${propertyId}`);
  await deleteDoc(favoriteRef);

  console.log(`Property ${propertyId} removed from favorites`);
}

/**
 * List all favorite property IDs for current user
 * @returns {Promise<string[]>} Array of property IDs
 */
export async function listFavorites() {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Not signed in");
  }

  const favoritesCol = collection(db, `users/${user.uid}/favorites`);
  const snapshot = await getDocs(favoritesCol);
  
  return snapshot.docs.map(doc => doc.id);
}

/**
 * Check if a property is favorited
 * @param {string} propertyId - Property document ID
 * @returns {Promise<boolean>}
 */
export async function isFavorite(propertyId) {
  try {
    const favorites = await listFavorites();
    return favorites.includes(propertyId);
  } catch (error) {
    console.error("Error checking favorite status:", error);
    return false;
  }
}

/**
 * Subscribe to real-time updates of user's favorites
 * @param {Function} callback - Called with array of property IDs on changes
 * @returns {Function} Unsubscribe function
 */
export function subscribeFavorites(callback) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Not signed in");
  }

  const favoritesCol = collection(db, `users/${user.uid}/favorites`);
  
  return onSnapshot(favoritesCol, (snapshot) => {
    const propertyIds = snapshot.docs.map(doc => doc.id);
    callback(propertyIds);
  });
}

/**
 * Get favorites with full property data
 * Fetches property details for all favorited properties
 * @returns {Promise<Array>} Array of property objects
 */
export async function getFavoritesWithDetails() {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("Not signed in");
  }

  const propertyIds = await listFavorites();
  
  if (propertyIds.length === 0) {
    return [];
  }

  // Fetch property details from properties collection
  const properties = [];
  for (const propertyId of propertyIds) {
    try {
      const propertyDoc = await doc(db, `properties/${propertyId}`);
      const propertySnap = await getDocs(propertyDoc);
      if (propertySnap.exists()) {
        properties.push({
          id: propertyId,
          ...propertySnap.data(),
        });
      }
    } catch (error) {
      console.error(`Error fetching property ${propertyId}:`, error);
    }
  }

  return properties;
}

/**
 * Toggle favorite status (add if not exists, remove if exists)
 * @param {string} propertyId - Property document ID
 * @returns {Promise<boolean>} New favorite status (true = favorited)
 */
export async function toggleFavorite(propertyId) {
  const isFav = await isFavorite(propertyId);
  
  if (isFav) {
    await removeFavorite(propertyId);
    return false;
  } else {
    await saveFavorite(propertyId);
    return true;
  }
}

// Export singleton instance for convenience
export class FavoritesService {
  constructor(firebaseConfig) {
    initializeFavoritesService(firebaseConfig);
  }

  saveFavorite = saveFavorite;
  removeFavorite = removeFavorite;
  listFavorites = listFavorites;
  isFavorite = isFavorite;
  subscribeFavorites = subscribeFavorites;
  getFavoritesWithDetails = getFavoritesWithDetails;
  toggleFavorite = toggleFavorite;
}
