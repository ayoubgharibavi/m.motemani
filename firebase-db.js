/**
 * سرویس یکپارچه‌سازی پایگاه داده ابری Firebase Firestore
 * برای اسباب‌بازی فروشی متمنی
 */
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  onSnapshot,
  getDocFromServer
} from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';

// راه‌اندازی فایربیس و اتصال به دیتابیس اختصاصی
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const OperationType = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LIST: 'list',
  GET: 'get',
  WRITE: 'write',
};

// کنترل‌کننده خطاهای فایراستور مطابق با استاندارد رسمی
function handleFirestoreError(error, operationType, path) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: true,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// بررسی ارتباط اولیه با دیتابیس
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firestore client connecting in background.");
    }
  }
}
testConnection();

// عملیات روی محصولات (Products Collection)
export const FirebaseDB = {
  // دریافت تمامی اسباب‌بازی‌ها از دیتابیس
  async getAllProducts() {
    const path = 'products';
    try {
      const snap = await getDocs(collection(db, path));
      const list = [];
      snap.forEach(docSnap => {
        list.push(docSnap.data());
      });
      // مرتب‌سازی بر اساس شناسه نزولی یا صعودی
      list.sort((a, b) => Number(a.id) - Number(b.id));
      return list;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  },

  // اشتراک لحظه‌ای در تغییرات محصولات (Real-time updates)
  subscribeProducts(onUpdate, onError) {
    const path = 'products';
    return onSnapshot(
      collection(db, path),
      (snapshot) => {
        const list = [];
        snapshot.forEach(docSnap => {
          list.push(docSnap.data());
        });
        list.sort((a, b) => Number(a.id) - Number(b.id));
        onUpdate(list);
      },
      (error) => {
        console.error('Realtime products listener error:', error);
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  },

  // ذخیره یا ویرایش کامل اسباب‌بازی در دیتابیس
  async saveProduct(product) {
    const docId = String(product.id);
    const path = `products/${docId}`;
    try {
      const docRef = doc(db, 'products', docId);
      const cleanData = {
        id: Number(product.id),
        name: String(product.name || '').trim(),
        category: String(product.category || 'متفرقه').trim(),
        price: Number(product.price) || 0,
        oldPrice: Number(product.oldPrice) || 0,
        emoji: String(product.emoji || '🧸').trim(),
        desc: String(product.desc || '').trim(),
        stock: Boolean(product.stock),
        image: String(product.image || '').trim(),
        featured: Boolean(product.featured),
        salesCount: Number(product.salesCount) || 0,
        updatedAt: new Date().toISOString()
      };
      if (product.createdAt) {
        cleanData.createdAt = product.createdAt;
      } else {
        cleanData.createdAt = new Date().toISOString();
      }
      await setDoc(docRef, cleanData, { merge: true });
      return cleanData;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // ویرایش فیلدهای خاص محصول در دیتابیس
  async updateProduct(id, fields) {
    const docId = String(id);
    const path = `products/${docId}`;
    try {
      const docRef = doc(db, 'products', docId);
      const updateData = {
        ...fields,
        updatedAt: new Date().toISOString()
      };
      await updateDoc(docRef, updateData);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  // حذف اسباب‌بازی از دیتابیس
  async deleteProduct(id) {
    const docId = String(id);
    const path = `products/${docId}`;
    try {
      const docRef = doc(db, 'products', docId);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // بارگذاری اولیه داده‌های پیش‌فرض در صورت خالی بودن دیتابیس
  async seedInitialProductsIfEmpty(defaultProducts) {
    const path = 'products';
    try {
      const snap = await getDocs(collection(db, path));
      if (snap.empty && Array.isArray(defaultProducts) && defaultProducts.length > 0) {
        console.log('Seeding initial products into Firestore database...');
        for (const item of defaultProducts) {
          const docRef = doc(db, 'products', String(item.id));
          await setDoc(docRef, {
            id: Number(item.id),
            name: String(item.name || ''),
            category: String(item.category || ''),
            price: Number(item.price) || 0,
            oldPrice: Number(item.oldPrice) || 0,
            emoji: String(item.emoji || '🧸'),
            desc: String(item.desc || ''),
            stock: item.stock !== false,
            image: String(item.image || ''),
            featured: Boolean(item.featured),
            salesCount: Number(item.salesCount) || 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
        console.log('Database seeded successfully with initial products!');
      }
    } catch (error) {
      console.warn('Initial seeding note:', error);
    }
  },

  // ذخیره تنظیمات پایه فروشگاه در دیتابیس
  async saveStoreSettings(settings) {
    const path = 'settings/store_config';
    try {
      const docRef = doc(db, 'settings', 'store_config');
      await setDoc(docRef, {
        ...settings,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // دریافت تنظیمات پایه فروشگاه از دیتابیس
  async getStoreSettings() {
    const path = 'settings/store_config';
    try {
      const docRef = doc(db, 'settings', 'store_config');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data();
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  },

  // ذخیره نظر و امتیاز کاربر در دیتابیس
  async saveReview(review) {
    const docId = String(review.id || 'REV-' + Date.now());
    const path = `reviews/${docId}`;
    try {
      const docRef = doc(db, 'reviews', docId);
      const data = {
        id: docId,
        productId: Number(review.productId),
        author: String(review.author || 'مشتری عزیز').trim(),
        rating: Number(review.rating) || 5,
        comment: String(review.comment || '').trim(),
        likes: Number(review.likes) || 0,
        date: String(review.date || ''),
        createdAt: new Date().toISOString()
      };
      await setDoc(docRef, data);
      return data;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // دریافت نظرات از دیتابیس
  async getAllReviews() {
    const path = 'reviews';
    try {
      const snap = await getDocs(collection(db, path));
      const list = [];
      snap.forEach(docSnap => {
        list.push(docSnap.data());
      });
      return list;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  },

  // لایک کردن نظر در دیتابیس
  async updateReviewLikes(reviewId, newLikes) {
    const docId = String(reviewId);
    const path = `reviews/${docId}`;
    try {
      const docRef = doc(db, 'reviews', docId);
      await updateDoc(docRef, { likes: Number(newLikes) });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  // ثبت سفارش در دیتابیس
  async saveOrder(order) {
    const docId = String(order.id || 'MOT-' + Date.now());
    const path = `orders/${docId}`;
    try {
      const docRef = doc(db, 'orders', docId);
      const data = {
        id: docId,
        customerName: String(order.customerName || ''),
        customerPhone: String(order.customerPhone || ''),
        customerCity: String(order.customerCity || ''),
        customerAddress: String(order.customerAddress || ''),
        customerNotes: String(order.customerNotes || ''),
        isGift: Boolean(order.isGift),
        totalPrice: Number(order.totalPrice) || 0,
        items: order.items || [],
        date: String(order.date || ''),
        createdAt: new Date().toISOString()
      };
      await setDoc(docRef, data);
      return data;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }
};
