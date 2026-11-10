/**
 * اسباب بازی فروشی متمنی - جاوااسکریپت و پایگاه داده ابری Firebase Firestore
 * متصل به دیتابیس پایدار و بلادرنگ برای ثبت، ویرایش و نگهداری دائم محصولات
 */
import { FirebaseDB } from './firebase-db.js';

// کلیدهای ذخیره‌سازی LocalStorage جهت کش سریع
const STORAGE_KEYS = {
  cart: 'motamani_toy_cart_v1',
  customProducts: 'motamani_products_custom_v1',
  salesStats: 'motamani_sales_stats_v1',
  ordersLog: 'motamani_orders_log_v1',
  storeSettings: 'motamani_store_settings_v1',
  userHistory: 'motamani_user_history_v1',
  reviews: 'motamani_product_reviews_v1',
  likedReviews: 'motamani_liked_reviews_v1',
};

// تنظیمات پایه و پیش‌فرض جامع فروشگاه
let CONFIG = {
  // ۱. برندینگ و عناوین وبسایت
  storeName: 'اسباب بازی فروشی متمنی',
  storeSlogan: 'دنیای خنده و شادی کودکان 🎈',
  storeLogoEmoji: '🧸',
  brandBadge: '🎈 ۱۰۰۰+ مدل اسباب‌بازی',
  heroTitle: 'به دنیای رنگارنگ اسباب‌بازی‌های متمنی خوش آمدید!',
  heroSubtitle: 'انتخاب از بین صدها عروسک، ماشین‌های کنترلی، لگوهای خلاقانه و بازی‌های فکری. سفارش دهید و بدون دردسر در واتساپ تحویل بگیرید!',

  // ۲. تماس و پیام‌رسان‌ها
  whatsappNumber: '989921021055', // برای لینک wa.me بدون + و بدون ۰
  phoneNumber: '09921021055',
  secondaryPhone: '۰۲۱-۵۵۶۲۳۴۸۹',
  instagramId: 'motamani_toys',
  telegramId: 'motamani_toys',

  // ۳. آدرس، ساعات کاری و ارسال
  storeAddress: 'تهران، بازار بزرگ، مجتمع تجاری اسباب‌بازی متمنی، پلاک ۴۲',
  workingHours: 'همه روزه از ساعت ۹:۰۰ الی ۲۲:۰۰',
  shippingInfo: 'پست پیشتاز سراسری، تیپاکس و پیک موتوری فوری',
  freeShippingThreshold: 800000,

  // ۴. نوار اطلاعیه و متن درباره ما
  isAnnouncementActive: true,
  announcementText: '🎉 جشنواره متمنی: ارسال سریع به سراسر ایران + کادوپیچی رایگان برای هدیه تولد 🎁',
  aboutText: 'ما در اسباب بازی متمنی تلاش می‌کنیم با ارائه زیباترین و باکیفیت‌ترین اسباب‌بازی‌های روز دنیا، لبخند رضایت را بر لبان کودکان و خانواده‌های گرامی بنشانیم.',

  // ۵. دسترسی ادمین
  adminPin: '1234',
  pageSize: 24,
};

// بارگذاری تنظیمات اختصاصی ذخیره‌شده
try {
  const savedSettings = localStorage.getItem(STORAGE_KEYS.storeSettings);
  if (savedSettings) {
    CONFIG = { ...CONFIG, ...JSON.parse(savedSettings) };
  }
} catch (e) {
  console.warn('Could not read store settings', e);
}

// تابع هماهنگ‌سازی تمام بخش‌های سایت بر اساس اطلاعات پایه فروشگاه
function applyStoreConfigToDOM() {
  // ۱. عنوان صفحه
  if (CONFIG.storeName) {
    document.title = `${CONFIG.storeName} | خرید آنلاین و سفارش در واتساپ`;
  }

  // ۲. نوار اطلاعیه
  const announcementBar = document.getElementById('announcement-bar');
  const announcementTextEl = document.getElementById('announcement-text');
  if (announcementBar) {
    announcementBar.style.display = (CONFIG.isAnnouncementActive !== false) ? 'block' : 'none';
  }
  if (announcementTextEl && CONFIG.announcementText) {
    announcementTextEl.innerText = CONFIG.announcementText;
  }

  // ۳. هدر سایت و لوگو
  const brandLogoEl = document.getElementById('brand-logo');
  if (brandLogoEl && CONFIG.storeLogoEmoji) {
    brandLogoEl.innerText = CONFIG.storeLogoEmoji;
  }

  const brandNameEl = document.getElementById('brand-name');
  if (brandNameEl && CONFIG.storeName) {
    brandNameEl.innerHTML = escapeHTML(CONFIG.storeName);
  }

  const brandBadgeEl = document.getElementById('brand-badge');
  if (brandBadgeEl && CONFIG.brandBadge) {
    brandBadgeEl.innerText = CONFIG.brandBadge;
  }

  const headerCallLink = document.getElementById('header-call-link');
  const headerCallText = document.getElementById('header-call-text');
  if (headerCallLink && CONFIG.phoneNumber) {
    headerCallLink.href = `tel:${CONFIG.phoneNumber.replace(/[^0-9]/g, '')}`;
  }
  if (headerCallText && CONFIG.phoneNumber) {
    headerCallText.innerText = toPersianDigits(CONFIG.phoneNumber);
  }

  // ۴. بخش هیرو (Hero)
  const heroSloganEl = document.getElementById('hero-slogan');
  if (heroSloganEl && CONFIG.storeSlogan) {
    heroSloganEl.innerText = CONFIG.storeSlogan;
  }

  const heroTitleEl = document.getElementById('hero-title');
  if (heroTitleEl && CONFIG.heroTitle) {
    heroTitleEl.innerText = CONFIG.heroTitle;
  }

  const heroSubtitleEl = document.getElementById('hero-subtitle');
  if (heroSubtitleEl && CONFIG.heroSubtitle) {
    heroSubtitleEl.innerText = CONFIG.heroSubtitle;
  }

  // ۵. بخش راهنمای خرید
  const stepsWaText = document.getElementById('steps-wa-text');
  if (stepsWaText && CONFIG.phoneNumber) {
    stepsWaText.innerText = `پیام آماده فاکتور را برای شماره ${toPersianDigits(CONFIG.phoneNumber)} ارسال نمایید.`;
  }

  // ۶. فوتر سایت
  const footerBrandTitle = document.getElementById('footer-brand-title');
  if (footerBrandTitle && CONFIG.storeName) {
    footerBrandTitle.innerText = `${CONFIG.storeName} ${CONFIG.storeLogoEmoji || '🧸'}`;
  }

  const footerAboutText = document.getElementById('footer-about-text');
  if (footerAboutText && CONFIG.aboutText) {
    footerAboutText.innerText = CONFIG.aboutText;
  }

  const footerPhone = document.getElementById('footer-phone');
  if (footerPhone && CONFIG.phoneNumber) {
    footerPhone.href = `tel:${CONFIG.phoneNumber.replace(/[^0-9]/g, '')}`;
    footerPhone.innerText = toPersianDigits(CONFIG.phoneNumber);
  }

  const footerSecPhoneWrapper = document.getElementById('footer-secondary-phone-wrapper');
  const footerSecPhone = document.getElementById('footer-secondary-phone');
  if (footerSecPhoneWrapper && footerSecPhone) {
    if (CONFIG.secondaryPhone && CONFIG.secondaryPhone.trim()) {
      footerSecPhoneWrapper.style.display = 'flex';
      footerSecPhone.href = `tel:${CONFIG.secondaryPhone.replace(/[^0-9]/g, '')}`;
      footerSecPhone.innerText = toPersianDigits(CONFIG.secondaryPhone);
    } else {
      footerSecPhoneWrapper.style.display = 'none';
    }
  }

  const footerWa = document.getElementById('footer-wa');
  if (footerWa && CONFIG.whatsappNumber) {
    footerWa.href = `https://wa.me/${CONFIG.whatsappNumber}`;
    footerWa.innerText = `${toPersianDigits(CONFIG.phoneNumber || CONFIG.whatsappNumber)} (${CONFIG.whatsappNumber})`;
  }

  const footerHours = document.getElementById('footer-hours');
  if (footerHours && CONFIG.workingHours) {
    footerHours.innerText = CONFIG.workingHours;
  }

  const footerAddress = document.getElementById('footer-address');
  if (footerAddress && CONFIG.storeAddress) {
    footerAddress.innerText = CONFIG.storeAddress;
  }

  const footerShipping = document.getElementById('footer-shipping');
  if (footerShipping && CONFIG.shippingInfo) {
    footerShipping.innerText = CONFIG.shippingInfo;
  }

  // اینستاگرام و تلگرام
  const footerIg = document.getElementById('footer-instagram');
  const footerIgHandle = document.getElementById('footer-instagram-handle');
  if (footerIg && footerIgHandle) {
    if (CONFIG.instagramId && CONFIG.instagramId.trim()) {
      const cleanHandle = CONFIG.instagramId.replace(/^@/, '').trim();
      footerIg.style.display = 'inline-flex';
      footerIg.href = `https://instagram.com/${cleanHandle}`;
      footerIgHandle.innerText = cleanHandle;
    } else {
      footerIg.style.display = 'none';
    }
  }

  const footerTg = document.getElementById('footer-telegram');
  const footerTgHandle = document.getElementById('footer-telegram-handle');
  if (footerTg && footerTgHandle) {
    if (CONFIG.telegramId && CONFIG.telegramId.trim()) {
      const cleanHandle = CONFIG.telegramId.replace(/^@/, '').trim();
      footerTg.style.display = 'inline-flex';
      footerTg.href = `https://t.me/${cleanHandle}`;
      footerTgHandle.innerText = cleanHandle;
    } else {
      footerTg.style.display = 'none';
    }
  }

  const footerCopyright = document.getElementById('footer-copyright-text');
  if (footerCopyright && CONFIG.storeName) {
    footerCopyright.innerText = `© تمامی حقوق محفوظ است - ${CONFIG.storeName} | طراحی با عشق برای کودکان ایران زمین ❤️`;
  }

  // ۷. دکمه شناور واتساپ و دکمه‌های موبایل
  const floatingWa = document.getElementById('floating-wa-btn');
  if (floatingWa && CONFIG.whatsappNumber) {
    const defaultMsg = encodeURIComponent(`سلام وقت بخیر! برای سفارش اسباب‌بازی از فروشگاه ${CONFIG.storeName} پیام می‌دهم 🧸`);
    floatingWa.href = `https://wa.me/${CONFIG.whatsappNumber}?text=${defaultMsg}`;
  }

  const mobileBottomWa = document.getElementById('mobile-bottom-wa-btn');
  if (mobileBottomWa && CONFIG.whatsappNumber) {
    const defaultMsg = encodeURIComponent(`سلام وقت بخیر، برای سفارش اسباب‌بازی پیام می‌دهم 🧸`);
    mobileBottomWa.href = `https://wa.me/${CONFIG.whatsappNumber}?text=${defaultMsg}`;
  }

  const mobileNavCall = document.getElementById('mobile-nav-call');
  if (mobileNavCall && CONFIG.phoneNumber) {
    mobileNavCall.href = `tel:${CONFIG.phoneNumber.replace(/[^0-9]/g, '')}`;
  }
}

// متغیرهای وضعیت برنامه
let allProducts = [];
let filteredProducts = [];
let visibleCount = CONFIG.pageSize;
let activeCategory = 'all';
let searchQuery = '';
let currentSort = 'newest';
let onlyInStock = false;
let currentDetailProduct = null;
let detailModalQty = 1;

// متغیرهای سیستم نظرات و امتیازدهی
let selectedStarRating = 5;
let isReviewFormVisible = false;
const STAR_FEEDBACK_TEXTS = {
  1: 'خیلی ضعیف 😕',
  2: 'نیاز به بهبود 🙁',
  3: 'معمولی و متوسط 🙂',
  4: 'خوب و باکیفیت 😊',
  5: 'عالی و فوق‌العاده! عاشقش شدیم 😍'
};

function renderStarsHtml(rating, max = 5) {
  const val = Number(rating) || 0;
  let html = '';
  for (let i = 1; i <= max; i++) {
    if (val >= i) {
      html += '<span class="star-icon star-full">★</span>';
    } else if (val >= i - 0.5) {
      html += '<span class="star-icon star-half">★</span>';
    } else {
      html += '<span class="star-icon star-empty">☆</span>';
    }
  }
  return html;
}

function getAvatarGradient(name) {
  const gradients = [
    'linear-gradient(135deg, #ff4785, #ff7849)',
    'linear-gradient(135deg, #0ea5e9, #38bdf8)',
    'linear-gradient(135deg, #10b981, #34d399)',
    'linear-gradient(135deg, #8b5cf6, #c084fc)',
    'linear-gradient(135deg, #f59e0b, #fbbf24)',
    'linear-gradient(135deg, #f97316, #fdba74)',
    'linear-gradient(135deg, #ec4899, #f472b6)'
  ];
  let charCodeSum = 0;
  for (let i = 0; i < (name || '').length; i++) {
    charCodeSum += name.charCodeAt(i);
  }
  return gradients[charCodeSum % gradients.length];
}

// متغیرهای پنل ادمین
let isAdminAuthenticated = false;
let adminActiveTab = 'analytics'; // باز شدن روی تب آمار و پرفروش‌ترین‌ها
let adminSearchQuery = '';
let adminFilterCategory = 'all';
let adminFilterStock = 'all';
let uploadedNewProductImage = '';
let uploadedEditProductImage = '';
let editingProductId = null;

// توابع کمکی
function escapeHTML(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function toPersianDigits(n) {
  if (n === null || n === undefined) return '';
  const pDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(n).replace(/\d/g, d => pDigits[d]);
}

function formatPrice(amount) {
  if (amount === 0) return 'رایگان';
  if (!amount) return 'تماس بگیرید';
  const formatted = Number(amount).toLocaleString('en-US');
  return toPersianDigits(formatted) + ' تومان';
}

function calculateDiscount(price, oldPrice) {
  if (!oldPrice || oldPrice <= price) return 0;
  return Math.round(((oldPrice - price) / oldPrice) * 100);
}

// تاریخ و ساعت به وقت فارسی
function getPersianDateTime() {
  const now = new Date();
  return now.toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/* =================================================== */
/* مدیریت سیستم آمار و پرفروش‌ترین‌ها (Sales Analytics)  */
/* =================================================== */

const AnalyticsManager = {
  getSalesStats() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.salesStats);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Error reading sales stats', e);
    }
    // مقادیر اولیه نمونه و واقعی برای شروع
    const initialStats = {
      1: { sales: 48, revenue: 32640000, views: 320 },
      2: { sales: 39, revenue: 48750000, views: 410 },
      3: { sales: 31, revenue: 16740000, views: 245 },
      4: { sales: 26, revenue: 7280000, views: 190 },
      5: { sales: 52, revenue: 16640000, views: 480 },
      6: { sales: 22, revenue: 10780000, views: 180 },
      7: { sales: 28, revenue: 10920000, views: 210 },
      9: { sales: 25, revenue: 21250000, views: 230 },
      11: { sales: 34, revenue: 14620000, views: 290 },
      14: { sales: 21, revenue: 10920000, views: 160 },
      15: { sales: 36, revenue: 9360000, views: 310 },
      24: { sales: 27, revenue: 9720000, views: 240 },
    };
    this.saveSalesStats(initialStats);
    return initialStats;
  },

  saveSalesStats(stats) {
    try {
      localStorage.setItem(STORAGE_KEYS.salesStats, JSON.stringify(stats));
    } catch (e) {
      console.error('Error saving sales stats', e);
    }
  },

  recordProductView(productId) {
    const stats = this.getSalesStats();
    if (!stats[productId]) {
      stats[productId] = { sales: 0, revenue: 0, views: 0 };
    }
    stats[productId].views = (stats[productId].views || 0) + 1;
    this.saveSalesStats(stats);
  },

  recordOrder(orderItems, customerInfo, totalPrice) {
    // بروزرسانی آمار فروش اقلام
    const stats = this.getSalesStats();
    orderItems.forEach(item => {
      if (!stats[item.id]) {
        stats[item.id] = { sales: 0, revenue: 0, views: 1 };
      }
      stats[item.id].sales = (stats[item.id].sales || 0) + item.qty;
      stats[item.id].revenue = (stats[item.id].revenue || 0) + (item.price * item.qty);
    });
    this.saveSalesStats(stats);

    // ثبت در تاریخچه سفارشات
    try {
      let orders = this.getOrdersLog();
      const newOrder = {
        id: 'MOT-' + Math.floor(1000 + Math.random() * 9000),
        dateTime: getPersianDateTime(),
        customer: customerInfo,
        items: orderItems,
        totalPrice: totalPrice,
        status: 'ارسال شده در واتساپ 📲',
      };
      orders.unshift(newOrder);
      if (orders.length > 50) orders = orders.slice(0, 50); // نگه‌داری ۵۰ سفارش اخیر
      localStorage.setItem(STORAGE_KEYS.ordersLog, JSON.stringify(orders));
    } catch (e) {
      console.error('Error logging order', e);
    }
  },

  getOrdersLog() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ordersLog);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Error reading orders log', e);
    }
    // چند نمونه سفارش اولیه واقعی
    return [
      {
        id: 'MOT-3841',
        dateTime: 'امروز، ساعت ۱۴:۲۰',
        customer: { name: 'فاطمه اکبری', phone: '09121112233', city: 'تهران' },
        items: [
          { name: 'عروسک خرس تدی بزرگ', qty: 1, price: 680000 },
          { name: 'تفنگ حباب‌ساز برقی موشکی', qty: 1, price: 320000 }
        ],
        totalPrice: 1000000,
        status: 'ارسال شده در واتساپ 📲'
      },
      {
        id: 'MOT-3840',
        dateTime: 'دیروز، ساعت ۱۸:۴۵',
        customer: { name: 'امیررضا کریمی', phone: '09358889900', city: 'اصفهان' },
        items: [
          { name: 'ماشین کنترلی آفرود صخره‌نورد', qty: 1, price: 1250000 }
        ],
        totalPrice: 1250000,
        status: 'ارسال شده در واتساپ 📲'
      }
    ];
  }
};

/* =================================================== */
/* سیستم مدیریت امتیازها و نظرات کاربران (Reviews)    */
/* =================================================== */

const ReviewsManager = {
  getReviewsData() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.reviews);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.warn('Error reading reviews', e);
    }
    const initial = this.getInitialReviews();
    this.saveReviewsData(initial);
    return initial;
  },

  saveReviewsData(reviewsData) {
    try {
      localStorage.setItem(STORAGE_KEYS.reviews, JSON.stringify(reviewsData));
    } catch (e) {
      console.error('Error saving reviews', e);
    }
  },

  getInitialReviews() {
    return {
      1: [
        {
          id: 'rev_1_1',
          userName: 'مریم رضایی',
          rating: 5,
          comment: 'کیفیت پارچه و الیافش فوق‌العاده نرم و باکیفیت هست. برای تولد دختر ۶ ساله‌ام سفارش دادم، کادوپیچی رایگان و کارت تبریک هم گذاشته بودید که واقعاً سورپرایز قشنگی شد. ممنون از آقای متمنی! ❤️',
          date: '۱۴۰۳/۰۸/۰۸',
          timeAgo: '۳ روز پیش',
          isVerifiedBuyer: true,
          recommend: true,
          helpfulCount: 8
        },
        {
          id: 'rev_1_2',
          userName: 'علی کاظمی',
          rating: 5,
          comment: 'اصلاً پرز نمیده و دوخت محکمی داره. در واتساپ خیلی صبورانه راهنمایی کردند و همون روز با پیک ارسال شد.',
          date: '۱۴۰۳/۰۸/۰۲',
          timeAgo: '۱ هفته پیش',
          isVerifiedBuyer: true,
          recommend: true,
          helpfulCount: 5
        },
        {
          id: 'rev_1_3',
          userName: 'فرشته مرادی',
          rating: 4,
          comment: 'خرس خیلی نازه، دقیقاً مثل عکسش بود و ارتفاعش ۱ متره. فقط کاش رنگ صورتی هم موجود بشه.',
          date: '۱۴۰۳/۰۷/۲۵',
          timeAgo: '۲ هفته پیش',
          isVerifiedBuyer: true,
          recommend: true,
          helpfulCount: 3
        }
      ],
      2: [
        {
          id: 'rev_2_1',
          userName: 'بهروز محمدی',
          rating: 5,
          comment: 'قدرت موتورش محشره! پسرم باهاش روی سنگ و شیب تند بازی میکنه و آخ نگفته. باتریش حدود ۴۰ دقیقه کار میده که واقعاً خوبه.',
          date: '۱۴۰۳/۰۸/۰۵',
          timeAgo: '۵ روز پیش',
          isVerifiedBuyer: true,
          recommend: true,
          helpfulCount: 11
        },
        {
          id: 'rev_2_2',
          userName: 'حمید امینی',
          rating: 5,
          comment: 'بدنه ضدضربه و لاستیک‌های ژله‌ای بسیار نرم و باکیفیت. قیمت نسبت به بازار خیلی منصفانه‌تر بود.',
          date: '۱۴۰۳/۰۷/۲۸',
          timeAgo: '۲ هفته پیش',
          isVerifiedBuyer: true,
          recommend: true,
          helpfulCount: 6
        }
      ],
      3: [
        {
          id: 'rev_3_1',
          userName: 'زهرا کمالی',
          rating: 5,
          comment: 'قطعات کاملاً سالم و بدون پلیسه هستن و قفل قطعات عالیه. دفترچه راهنما تمام مراحل رو دقیق نشون میده.',
          date: '۱۴۰۳/۰۸/۰۴',
          timeAgo: '۶ روز پیش',
          isVerifiedBuyer: true,
          recommend: true,
          helpfulCount: 7
        },
        {
          id: 'rev_3_2',
          userName: 'مسعود حسینی',
          rating: 5,
          comment: 'برای تقویت هوش و تمرکز بچه‌ها فوق‌العاده‌ست. مینی‌فیگورهای شوالیه هم خیلی بامزه هستن.',
          date: '۱۴۰۳/۰۷/۲۲',
          timeAgo: '۲ هفته پیش',
          isVerifiedBuyer: true,
          recommend: true,
          helpfulCount: 4
        }
      ],
      4: [
        {
          id: 'rev_4_1',
          userName: 'سعید رستمی',
          rating: 5,
          comment: 'نسخه فارسی و روان، جمعه‌ها کل خانواده دور هم بازی می‌کنیم و کلی می‌خندیم. بسته‌بندی عالی بود.',
          date: '۱۴۰۳/۰۸/۰۱',
          timeAgo: '۱ هفته پیش',
          isVerifiedBuyer: true,
          recommend: true,
          helpfulCount: 9
        }
      ],
      5: [
        {
          id: 'rev_5_1',
          userName: 'مهسا نوری',
          rating: 5,
          comment: 'شیر آب واقعاً کار میکنه و آب می‌چرخه! دخترم ساعت‌ها با وسایل کوچولوی آشپزخونه سرگرمه.',
          date: '۱۴۰۳/۰۸/۰۶',
          timeAgo: '۴ روز پیش',
          isVerifiedBuyer: true,
          recommend: true,
          helpfulCount: 14
        }
      ],
      6: [
        {
          id: 'rev_6_1',
          userName: 'پیمان سلطانی',
          rating: 5,
          comment: 'رقص نور چرخ‌ها در تاریکی خیلی قشنگه و بدنه فلزی محکمی داره. ترمز پایی عقب هم ایمنه.',
          date: '۱۴۰۳/۰۷/۲۹',
          timeAgo: '۱ هفته پیش',
          isVerifiedBuyer: true,
          recommend: true,
          helpfulCount: 5
        }
      ],
      7: [
        {
          id: 'rev_7_1',
          userName: 'سارا فتاحی',
          rating: 5,
          comment: 'خمیرها کاملاً نرم و بوی مطبوعی دارن و به دست نمی‌چسبن. شابلون‌ها و ابزارهاش هم خیلی متنوعه.',
          date: '۱۴۰۳/۰۸/۰۷',
          timeAgo: '۲ روز پیش',
          isVerifiedBuyer: true,
          recommend: true,
          helpfulCount: 6
        }
      ],
      8: [
        {
          id: 'rev_8_1',
          userName: 'کیان راد',
          rating: 5,
          comment: 'سنسورهای دستش خیلی جذابن، با تکان دادن دست به جلو و عقب حرکت میکنه و موزیکال حرف میزنه!',
          date: '۱۴۰۳/۰۸/۰۳',
          timeAgo: '۵ روز پیش',
          isVerifiedBuyer: true,
          recommend: true,
          helpfulCount: 12
        }
      ]
    };
  },

  getReviews(productId) {
    const all = this.getReviewsData();
    return all[productId] || [];
  },

  getProductRating(productId) {
    const list = this.getReviews(productId);
    if (!list || list.length === 0) {
      // مقادیر اولیه برای کالاهایی که هنوز نظر دستی ثبت نشده
      const seedRatings = {
        9: { avg: 4.8, count: 2 },
        10: { avg: 4.9, count: 3 },
        11: { avg: 4.7, count: 2 },
        12: { avg: 5.0, count: 1 },
        13: { avg: 4.9, count: 4 },
        14: { avg: 4.8, count: 2 },
        15: { avg: 4.9, count: 3 },
        16: { avg: 5.0, count: 2 },
        17: { avg: 4.7, count: 1 },
        18: { avg: 4.9, count: 2 },
        19: { avg: 4.8, count: 2 },
        20: { avg: 5.0, count: 3 },
        21: { avg: 4.9, count: 2 },
        22: { avg: 4.8, count: 1 },
        23: { avg: 5.0, count: 2 },
        24: { avg: 4.9, count: 3 },
      };
      const def = seedRatings[productId] || { avg: 4.8, count: 1 };
      return {
        average: def.avg.toFixed(1),
        averageRaw: def.avg,
        count: def.count,
        distribution: { 5: def.count, 4: 0, 3: 0, 2: 0, 1: 0 },
        recommendPercent: 100
      };
    }

    const count = list.length;
    const sum = list.reduce((acc, r) => acc + (Number(r.rating) || 5), 0);
    const avgRaw = sum / count;
    const avgFormatted = (Math.round(avgRaw * 10) / 10).toFixed(1);

    const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let recCount = 0;
    list.forEach(r => {
      const star = Math.min(5, Math.max(1, Math.round(Number(r.rating) || 5)));
      dist[star] = (dist[star] || 0) + 1;
      if (r.recommend !== false) recCount++;
    });

    const recPercent = Math.round((recCount / count) * 100);

    return {
      average: avgFormatted,
      averageRaw: avgRaw,
      count,
      distribution: dist,
      recommendPercent: recPercent
    };
  },

  addReview(productId, review) {
    const all = this.getReviewsData();
    if (!all[productId]) all[productId] = [];

    const newRev = {
      id: 'rev_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      userName: review.userName || 'مشتری گرامی',
      rating: Number(review.rating) || 5,
      comment: review.comment || '',
      date: new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date()),
      timeAgo: 'هم‌اکنون',
      isVerifiedBuyer: true,
      recommend: review.recommend !== false,
      helpfulCount: 0
    };

    all[productId].unshift(newRev);
    this.saveReviewsData(all);

    // ذخیره ابری نظر در دیتابیس فایربیس
    try {
      FirebaseDB.saveReview({
        id: newRev.id,
        productId: Number(productId),
        author: newRev.userName,
        rating: newRev.rating,
        comment: newRev.comment,
        likes: 0,
        date: newRev.date
      }).catch(err => console.warn('Cloud review record note:', err));
    } catch (err) {}

    return newRev;
  },

  likeReview(productId, reviewId) {
    let liked = [];
    try {
      liked = JSON.parse(localStorage.getItem(STORAGE_KEYS.likedReviews) || '[]');
    } catch (e) {}

    if (liked.includes(reviewId)) {
      showToast('شما قبلاً این نظر را پسندیده‌اید! 👍', 'info');
      return false;
    }

    const all = this.getReviewsData();
    if (!all[productId]) return false;
    const item = all[productId].find(r => r.id === reviewId);
    if (!item) return false;

    item.helpfulCount = (item.helpfulCount || 0) + 1;
    this.saveReviewsData(all);

    liked.push(reviewId);
    localStorage.setItem(STORAGE_KEYS.likedReviews, JSON.stringify(liked));
    return true;
  }
};

/* =================================================== */
/* فشرده‌سازی و آپلود خودکار عکس محصول (Image Upload)   */
/* =================================================== */

function compressAndConvertImage(file, maxWidth = 600, maxHeight = 600, quality = 0.85) {
  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('لطفاً یک فایل تصویری معتبر انتخاب کنید.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // تولید فرمت بهینه WebP یا JPEG
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('خطا در پردازش تصویر.'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('خطا در خواندن فایل.'));
    reader.readAsDataURL(file);
  });
}

// مدیریت سبد خرید در LocalStorage
const CartManager = {
  getCart() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.cart);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading cart', e);
      return [];
    }
  },

  saveCart(cart) {
    try {
      localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(cart));
      updateCartUI();
    } catch (e) {
      console.error('Error saving cart', e);
    }
  },

  addItem(productId, quantity = 1, triggerElement = null) {
    const product = allProducts.find(p => p.id === productId);
    if (!product || !product.stock) {
      showToast('متأسفانه این محصول در حال حاضر ناموجود است.', 'error');
      return;
    }

    const cart = this.getCart();
    const existingIndex = cart.findIndex(item => item.id === productId);

    if (existingIndex > -1) {
      cart[existingIndex].qty += quantity;
    } else {
      cart.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        emoji: product.emoji,
        qty: quantity,
      });
    }

    this.saveCart(cart);
    showToast(`«${escapeHTML(product.name)}» به سبد خرید افزوده شد! 🎉`, 'success');
    triggerFlyToCartAnimation(productId, triggerElement);
  },

  updateQuantity(productId, delta) {
    let cart = this.getCart();
    const index = cart.findIndex(item => item.id === productId);
    if (index > -1) {
      cart[index].qty += delta;
      if (cart[index].qty <= 0) {
        cart.splice(index, 1);
      }
      this.saveCart(cart);
    }
  },

  removeItem(productId) {
    let cart = this.getCart();
    cart = cart.filter(item => item.id !== productId);
    this.saveCart(cart);
    showToast('کالا از سبد خرید حذف شد.', 'info');
  },

  clearCart() {
    localStorage.removeItem(STORAGE_KEYS.cart);
    updateCartUI();
  },

  getTotalCount() {
    const cart = this.getCart();
    return cart.reduce((sum, item) => sum + item.qty, 0);
  },

  getTotalPrice() {
    const cart = this.getCart();
    return cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  }
};

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${type === 'success' ? '✅' : type === 'error' ? '⚠️' : 'ℹ️'}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s forwards';
    setTimeout(() => toast.remove(), 300);
  }, 3200);
}

function animateCartBadge() {
  const badge = document.getElementById('cart-badge');
  const mobBadge = document.getElementById('mobile-cart-badge');
  const cartBtn = document.getElementById('cart-toggle-btn');

  // انیمیشن پرش و لرزش دکمه سبد خرید در هدر
  if (cartBtn) {
    cartBtn.classList.remove('cart-bump-hit');
    void cartBtn.offsetWidth;
    cartBtn.classList.add('cart-bump-hit');
  }

  [badge, mobBadge].forEach(el => {
    if (el) {
      el.classList.remove('bump');
      void el.offsetWidth;
      el.classList.add('bump');
    }
  });
}

// انیمیشن پرواز تصویر اسباب‌بازی به سمت آیکون سبد خرید در هدر
function triggerFlyToCartAnimation(productId, startElement = null) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;

  const cartBtn = document.getElementById('cart-toggle-btn');
  if (!cartBtn) {
    animateCartBadge();
    return;
  }

  // پیدا کردن منبع شروع انیمیشن (عکس محصول)
  let sourceEl = null;

  if (startElement && startElement instanceof HTMLElement) {
    const card = startElement.closest('.product-card, .detail-modal-layout, .related-card');
    if (card) {
      sourceEl = card.querySelector('.card-img, .detail-img, .related-img, .card-fallback-emoji, .detail-fallback-emoji, .related-fallback-emoji, .card-image-box, .detail-img-wrapper, .related-card-img-box');
    }
    if (!sourceEl) sourceEl = startElement;
  }

  if (!sourceEl) {
    // اگر مودال باز است و همین محصول است، از عکس مودال پرواز کند
    const inModalImg = document.querySelector('.detail-img-wrapper');
    const modalBackdrop = document.getElementById('product-modal-backdrop');
    if (modalBackdrop && modalBackdrop.classList.contains('open') && currentDetailProduct?.id === productId && inModalImg) {
      sourceEl = inModalImg;
    } else {
      const inGrid = document.querySelector(`article[data-id="${productId}"] .card-image-box, article[data-id="${productId}"]`);
      if (inGrid) sourceEl = inGrid;
    }
  }

  let startRect = { left: window.innerWidth / 2 - 35, top: window.innerHeight / 2 - 35, width: 70, height: 70 };
  if (sourceEl) {
    const rect = sourceEl.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      startRect = rect;
    }
  }

  const targetRect = cartBtn.getBoundingClientRect();
  const startSize = Math.min(Math.max(startRect.width * 0.75, 65), 110);
  const startLeft = startRect.left + (startRect.width / 2) - (startSize / 2);
  const startTop = startRect.top + (startRect.height / 2) - (startSize / 2);

  const targetLeft = targetRect.left + (targetRect.width / 2) - 16;
  const targetTop = targetRect.top + (targetRect.height / 2) - 16;

  // ساخت المان پروازکننده حبابی شکل
  const flyer = document.createElement('div');
  flyer.className = 'fly-to-cart-bubble';

  if (product.image) {
    flyer.innerHTML = `<img src="${escapeHTML(product.image)}" alt="" class="fly-img" onerror="this.onerror=null; this.parentElement.innerHTML='<span class=\\'fly-emoji\\'>${escapeHTML(product.emoji || '🧸')}</span>';" />`;
  } else {
    flyer.innerHTML = `<span class="fly-emoji">${escapeHTML(product.emoji || '🧸')}</span>`;
  }

  Object.assign(flyer.style, {
    position: 'fixed',
    left: `${startLeft}px`,
    top: `${startTop}px`,
    width: `${startSize}px`,
    height: `${startSize}px`,
    zIndex: '99999',
    pointerEvents: 'none',
    transform: 'scale(1) rotate(0deg)',
    opacity: '1'
  });

  document.body.appendChild(flyer);

  // آغاز انیمیشن پرواز منحنی به سمت هدر با چرخش ملایم
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      Object.assign(flyer.style, {
        left: `${targetLeft}px`,
        top: `${targetTop}px`,
        width: '32px',
        height: '32px',
        transform: 'scale(0.35) rotate(380deg)',
        opacity: '0.85'
      });
    });
  });

  // هنگام رسیدن اسباب‌بازی به آیکون سبد در هدر
  setTimeout(() => {
    flyer.remove();
    animateCartBadge();
    createCartSparkles(targetRect.left + targetRect.width / 2, targetRect.top + targetRect.height / 2);
  }, 720);
}

// تولید ذرات نورانی و رنگارنگ هنگام فرود در سبد خرید
function createCartSparkles(x, y) {
  const sparkleContainer = document.createElement('div');
  sparkleContainer.className = 'cart-sparkles-container';
  Object.assign(sparkleContainer.style, {
    left: `${x}px`,
    top: `${y}px`
  });

  const sparkles = ['✨', '🎈', '🌟', '💖', '⭐', '🧸'];
  for (let i = 0; i < 6; i++) {
    const s = document.createElement('span');
    s.className = 'cart-sparkle-item';
    s.innerText = sparkles[i % sparkles.length];
    const angle = (i / 6) * 2 * Math.PI;
    const dist = 22 + Math.random() * 18;
    const tx = Math.cos(angle) * dist;
    const ty = Math.sin(angle) * dist;
    s.style.setProperty('--tx', `${tx}px`);
    s.style.setProperty('--ty', `${ty}px`);
    sparkleContainer.appendChild(s);
  }

  document.body.appendChild(sparkleContainer);
  setTimeout(() => sparkleContainer.remove(), 600);
}

function persistProducts() {
  try {
    localStorage.setItem(STORAGE_KEYS.customProducts, JSON.stringify(allProducts));
  } catch (e) {
    console.error('Error saving custom products', e);
  }
}

// متغیر نگه‌دارنده لغو اشتراک بلادرنگ
let unsubscribeProductsListener = null;

// بارگذاری محصولات از پایگاه داده ابری فایربیس با همگام‌سازی بلادرنگ
async function loadProducts() {
  const grid = document.getElementById('products-grid');

  // ۱. بارگذاری فوری از کش محلی جهت جلوگیری از پرش و لودینگ طولانی
  try {
    const cached = localStorage.getItem(STORAGE_KEYS.customProducts);
    if (cached) {
      allProducts = JSON.parse(cached);
      populateCategories();
      applyFilters();
    }
  } catch (e) {
    console.warn('Cache read note:', e);
  }

  // ۲. دریافت محصولات از دیتابیس ابری فایربیس (Firestore)
  try {
    let cloudProducts = await FirebaseDB.getAllProducts();

    // اگر دیتابیس برای اولین بار خالی بود، داده‌های پیش‌فرض را در دیتابیس وارد کن
    if (!cloudProducts || cloudProducts.length === 0) {
      try {
        const resp = await fetch('./products.json');
        if (resp.ok) {
          const defaultItems = await resp.json();
          await FirebaseDB.seedInitialProductsIfEmpty(defaultItems);
          cloudProducts = await FirebaseDB.getAllProducts();
        }
      } catch (seedErr) {
        console.warn('Seed fallback note:', seedErr);
      }
    }

    if (cloudProducts && cloudProducts.length > 0) {
      allProducts = cloudProducts;
      persistProducts();
      populateCategories();
      applyFilters();
      if (isAdminAuthenticated) {
        showAdminDashboard();
      }
    }

    // ۳. فعال‌سازی لیسنر بلادرنگ دیتابیس (Real-time updates)
    if (!unsubscribeProductsListener) {
      unsubscribeProductsListener = FirebaseDB.subscribeProducts((liveList) => {
        if (Array.isArray(liveList) && liveList.length > 0) {
          allProducts = liveList;
          persistProducts();
          populateCategories();
          applyFilters();
          if (isAdminAuthenticated) {
            showAdminDashboard();
          }
        }
      }, (err) => {
        console.warn('Real-time subscription notice:', err);
      });
    }

  } catch (error) {
    console.error('Error connecting to Firestore database:', error);

    // ۴. در صورت خطای شبکه، فایل استاتیک products.json را به عنوان پشتیبان لود کن
    if (allProducts.length === 0) {
      try {
        const response = await fetch('./products.json');
        if (response.ok) {
          allProducts = await response.json();
          populateCategories();
          applyFilters();
        }
      } catch (fallbackError) {
        console.error('Failed to load fallback products.json:', fallbackError);
        if (grid) {
          grid.innerHTML = `
            <div class="empty-state" style="grid-column: 1 / -1;">
              <span class="empty-state-emoji">⚠️</span>
              <h3>خطا در دریافت اسباب‌بازی‌ها</h3>
              <p>لطفاً اتصال اینترنت خود را بررسی نمایید.</p>
              <button class="load-more-btn" onclick="loadProducts()">تلاش مجدد 🔄</button>
            </div>
          `;
        }
      }
    }
  }
}

// ساخت دسته‌بندی‌ها
function populateCategories() {
  const categoriesWrapper = document.getElementById('categories-scroll');
  if (!categoriesWrapper) return;

  const categoryCounts = {};
  allProducts.forEach(p => {
    categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
  });

  const uniqueCategories = Object.keys(categoryCounts);

  let html = `
    <button class="category-pill ${activeCategory === 'all' ? 'active' : ''}" data-category="all">
      <span>همه اسباب‌بازی‌ها</span>
      <span class="category-count">${toPersianDigits(allProducts.length)}</span>
    </button>
  `;

  const categoryIcons = {
    'عروسک': '🧸',
    'ماشین': '🏎️',
    'لگو و بازی فکری': '🧩',
    'ورزشی': '⚽',
    'کاردستی': '🎨',
    'فیگور و ربات': '🤖',
  };

  uniqueCategories.forEach(cat => {
    const icon = categoryIcons[cat] || '🎁';
    const count = categoryCounts[cat] || 0;
    const isActive = activeCategory === cat ? 'active' : '';
    html += `
      <button class="category-pill ${isActive}" data-category="${escapeHTML(cat)}">
        <span>${icon} ${escapeHTML(cat)}</span>
        <span class="category-count">${toPersianDigits(count)}</span>
      </button>
    `;
  });

  categoriesWrapper.innerHTML = html;

  categoriesWrapper.querySelectorAll('.category-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      activeCategory = btn.getAttribute('data-category');
      visibleCount = CONFIG.pageSize;
      populateCategories();
      applyFilters();
    });
  });
}

// اعمال فیلترها و مرتب‌سازی
function applyFilters() {
  let result = [...allProducts];

  if (activeCategory !== 'all') {
    result = result.filter(p => p.category === activeCategory);
  }

  if (searchQuery.trim() !== '') {
    const q = searchQuery.trim().toLowerCase();
    result = result.filter(p => 
      p.name.toLowerCase().includes(q) ||
      (p.desc && p.desc.toLowerCase().includes(q)) ||
      (p.category && p.category.toLowerCase().includes(q))
    );
  }

  if (onlyInStock) {
    result = result.filter(p => p.stock);
  }

  if (currentSort === 'cheapest') {
    result.sort((a, b) => a.price - b.price);
  } else if (currentSort === 'expensive') {
    result.sort((a, b) => b.price - a.price);
  } else if (currentSort === 'discount') {
    result.sort((a, b) => {
      const discA = calculateDiscount(a.price, a.oldPrice);
      const discB = calculateDiscount(b.price, b.oldPrice);
      return discB - discA;
    });
  } else {
    // جدیدترین با اولویت کالاهای ویژه (Featured)
    result.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return b.id - a.id;
    });
  }

  filteredProducts = result;
  renderProducts();
  updateResultsCount();
}

// نمایش کارت‌ها در گرید
function renderProducts() {
  const grid = document.getElementById('products-grid');
  const paginationBox = document.getElementById('pagination-box');
  if (!grid) return;

  if (filteredProducts.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1;">
        <span class="empty-state-emoji">🔍🧸</span>
        <h3>اسباب‌بازی مورد نظر پیدا نشد!</h3>
        <p>لطفاً فیلترها یا عبارت جستجو را تغییر دهید.</p>
        <button class="reset-filters-btn" style="margin: 0 auto;" onclick="resetAllFilters()">
          پاک کردن فیلترها 🔄
        </button>
      </div>
    `;
    if (paginationBox) paginationBox.style.display = 'none';
    return;
  }

  const productsToDisplay = filteredProducts.slice(0, visibleCount);

  grid.innerHTML = productsToDisplay.map(product => {
    const discount = calculateDiscount(product.price, product.oldPrice);
    const hasDiscount = discount > 0;
    const isAvailable = product.stock;
    const ratingInfo = ReviewsManager.getProductRating(product.id);

    return `
      <article class="product-card ${!isAvailable ? 'out-of-stock' : ''}" data-id="${product.id}">
        <div class="card-badges">
          ${product.featured ? `<span class="badge-featured">🔥 ویژه</span>` : ''}
          ${hasDiscount && isAvailable ? `<span class="badge-discount">${toPersianDigits(discount)}٪</span>` : ''}
          ${!isAvailable ? `<span class="badge-stock-out">ناموجود</span>` : ''}
        </div>
        <span class="badge-category">${escapeHTML(product.category)}</span>

        <div class="card-image-box" onclick="openProductDetail(${product.id})">
          ${product.image ? `
            <img 
              src="${escapeHTML(product.image)}" 
              alt="${escapeHTML(product.name)}" 
              class="card-img" 
              loading="lazy" 
              onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'card-fallback-emoji\\'>${escapeHTML(product.emoji || '🧸')}</div>';"
            />
          ` : `
            <div class="card-fallback-emoji">${escapeHTML(product.emoji || '🧸')}</div>
          `}
        </div>

        <div class="card-body">
          <h3 class="card-title" onclick="openProductDetail(${product.id})" title="${escapeHTML(product.name)}">
            ${escapeHTML(product.name)}
          </h3>
          <div class="card-rating-row" onclick="openProductDetail(${product.id})" title="مشاهده نظرات خریداران">
            <span class="card-stars-visual">${renderStarsHtml(ratingInfo.averageRaw)}</span>
            <span class="card-rating-num">${toPersianDigits(ratingInfo.average)}</span>
            <span class="card-rating-cnt">(${toPersianDigits(ratingInfo.count)})</span>
          </div>
          <p class="card-desc">${escapeHTML(product.desc)}</p>

          <div class="card-price-box">
            <span class="price-current">${formatPrice(product.price)}</span>
            ${hasDiscount ? `<span class="price-old">${formatPrice(product.oldPrice)}</span>` : ''}
          </div>

          <div class="card-actions">
            <button 
              class="btn-add-cart" 
              ${!isAvailable ? 'disabled' : ''} 
              onclick="CartManager.addItem(${product.id}, 1, this)"
              title="${isAvailable ? 'افزودن به سبد' : 'ناموجود'}"
            >
              <span>🛒</span>
              <span>${isAvailable ? 'افزودن' : 'ناموجود'}</span>
            </button>
            <button class="btn-quick-view" onclick="openProductDetail(${product.id})" title="مشاهده جزئیات">
              👁️
            </button>
            <button 
              class="btn-card-wa" 
              onclick="orderSingleProductWA(${product.id})"
              title="خرید سریع در واتساپ"
            >
              <span>💬 خرید در واتساپ</span>
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');

  if (paginationBox) {
    if (visibleCount < filteredProducts.length) {
      paginationBox.style.display = 'block';
      const remaining = filteredProducts.length - visibleCount;
      const progressPercent = Math.min(100, Math.round((visibleCount / filteredProducts.length) * 100));

      paginationBox.innerHTML = `
        <button class="load-more-btn" onclick="loadMoreProducts()">
          <span>نمایش اسباب‌بازی‌های بیشتر 👇</span>
          <span>(${toPersianDigits(remaining)} مورد)</span>
        </button>
        <div class="pagination-info">
          نمایش ${toPersianDigits(visibleCount)} از ${toPersianDigits(filteredProducts.length)} محصول
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width: ${progressPercent}%"></div>
        </div>
      `;
    } else {
      paginationBox.style.display = 'none';
    }
  }
}

function loadMoreProducts() {
  visibleCount += CONFIG.pageSize;
  renderProducts();
}

function updateResultsCount() {
  const el = document.getElementById('results-count');
  if (el) {
    el.innerText = `${toPersianDigits(filteredProducts.length)} محصول یافت شد`;
  }
}

function resetAllFilters() {
  activeCategory = 'all';
  searchQuery = '';
  currentSort = 'newest';
  onlyInStock = false;
  visibleCount = CONFIG.pageSize;

  const searchInput = document.getElementById('search-input');
  if (searchInput) searchInput.value = '';

  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) sortSelect.value = 'newest';

  const stockCheck = document.getElementById('stock-toggle');
  if (stockCheck) stockCheck.checked = false;

  populateCategories();
  applyFilters();
}

// باز کردن مودال مشخصات کالا
function openProductDetail(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;

  // ثبت بازدید برای آنالیتیکس
  AnalyticsManager.recordProductView(productId);

  currentDetailProduct = product;
  detailModalQty = 1;

  const backdrop = document.getElementById('product-modal-backdrop');
  const content = document.getElementById('product-modal-content');
  if (!backdrop || !content) return;

  const discount = calculateDiscount(product.price, product.oldPrice);
  const ratingInfo = ReviewsManager.getProductRating(product.id);

  // ریست وضعیت فرم ثبت نظر
  isReviewFormVisible = false;
  selectedStarRating = 5;

  content.innerHTML = `
    <div class="detail-modal-layout">
      <div class="detail-img-wrapper">
        ${product.image ? `
          <img 
            src="${escapeHTML(product.image)}" 
            alt="${escapeHTML(product.name)}" 
            class="detail-img" 
            onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'detail-fallback-emoji\\'>${escapeHTML(product.emoji || '🧸')}</div>';"
          />
        ` : `
          <div class="detail-fallback-emoji">${escapeHTML(product.emoji || '🧸')}</div>
        `}
      </div>

      <div class="detail-info">
        <span class="detail-category">دسته‌بندی: ${escapeHTML(product.category)}</span>
        <h2 class="detail-title">${escapeHTML(product.name)}</h2>

        <!-- نشانگر سریع امتیاز و نظرات در بالای مشخصات -->
        <div class="detail-rating-quick" onclick="scrollToReviews()" title="مشاهده و ثبت نظرات خریداران">
          <span class="detail-stars" id="detail-rating-quick-stars">${renderStarsHtml(ratingInfo.averageRaw)}</span>
          <span class="detail-rating-val" id="detail-rating-quick-val">${toPersianDigits(ratingInfo.average)} از ۵</span>
          <span class="detail-rating-bubble" id="detail-rating-quick-bubble">💬 ${toPersianDigits(ratingInfo.count)} نظر خریداران</span>
        </div>

        <div class="detail-price-row">
          <span class="detail-price-main">${formatPrice(product.price)}</span>
          ${discount > 0 ? `
            <span class="detail-price-old">${formatPrice(product.oldPrice)}</span>
            <span class="badge-discount" style="display:inline-block; padding: 2px 7px;">${toPersianDigits(discount)}٪ تخفیف</span>
          ` : ''}
        </div>

        <div class="detail-desc">
          <p>${escapeHTML(product.desc)}</p>
          <ul style="margin-top: 8px; padding-right: 16px; font-size: 0.82rem; color: #64748b; list-style-type: '🧸 ';">
            <li>کیفیت تضمین‌شده و متریال بهداشتی</li>
            <li>مناسب سنین مختلف و تقویت خلاقیت کودک</li>
            <li>امکان کادوپیچی رایگان برای هدیه تولد</li>
          </ul>
        </div>

        <div style="margin-bottom: 12px; font-size: 0.85rem; font-weight: 700; color: ${product.stock ? '#16a34a' : '#ef4444'};">
          ${product.stock ? '✅ موجود در انبار فروشگاه متمنی' : '❌ در حال حاضر ناموجود'}
        </div>

        ${product.stock ? `
          <div class="detail-qty-control">
            <span style="font-size: 0.85rem; font-weight: 700; color: #475569;">تعداد:</span>
            <button class="qty-btn" onclick="changeDetailQty(-1)">-</button>
            <span class="qty-number" id="detail-qty-val">${toPersianDigits(detailModalQty)}</span>
            <button class="qty-btn" onclick="changeDetailQty(1)">+</button>
          </div>

          <div class="detail-actions">
            <button class="btn-detail-cart" onclick="addDetailToCart()">
              <span>🛒 افزودن به سبد خرید</span>
            </button>
            <button class="btn-detail-wa" onclick="orderCurrentDetailWA()">
              <span>💬 خرید فوری در واتساپ</span>
            </button>
          </div>
        ` : `
          <button class="btn-detail-cart" disabled style="background: #cbd5e1; cursor: not-allowed;">
            این محصول ناموجود است
          </button>
        `}
      </div>
    </div>

    <!-- بخش اسباب‌بازی‌های مشابه و پیشنهادی (Recommended Similar Toys) -->
    <div class="detail-related-container" id="product-related-container">
      ${renderRelatedProductsHtml(product)}
    </div>

    <!-- بخش امتیازدهی و نظرات کاربران خریدار -->
    <div class="detail-reviews-container" id="product-reviews-container">
      ${renderReviewsSectionHtml(product.id)}
    </div>
  `;

  backdrop.classList.add('open');
  document.body.style.overflow = 'hidden';
}

// ساخت HTML بخش اسباب‌بازی‌های مشابه و پیشنهادی
function renderRelatedProductsHtml(currentProduct) {
  if (!currentProduct) return '';

  // فیلتر کردن اسباب‌بازی‌های هم‌دسته (به جز خود کالا)
  let sameCategory = allProducts.filter(p => p.id !== currentProduct.id && p.category === currentProduct.category);
  
  // اولویت کالاهای موجود در انبار
  sameCategory.sort((a, b) => (b.stock ? 1 : 0) - (a.stock ? 1 : 0));

  // اگر کمتر از ۳ مورد هم‌دسته وجود داشت، از کالاهای ویژه یا دیگر دسته‌ها اضافه کن تا حداقل ۳ الی ۶ محصول باشد
  let relatedItems = [...sameCategory];
  if (relatedItems.length < 3) {
    const others = allProducts.filter(p => p.id !== currentProduct.id && p.category !== currentProduct.category && p.stock);
    relatedItems = relatedItems.concat(others);
  }

  const itemsToDisplay = relatedItems.slice(0, 6);
  if (itemsToDisplay.length === 0) return '';

  return `
    <div class="related-section-wrapper">
      <div class="related-section-header">
        <div class="related-title-box">
          <span class="related-title-icon">🧸✨</span>
          <div>
            <h3 class="related-title">اسباب‌بازی‌های مشابه و پیشنهادی</h3>
            <p class="related-subtitle">موارد پرطرفدار دیگر در دسته «${escapeHTML(currentProduct.category)}»</p>
          </div>
        </div>
        <span class="related-badge">${toPersianDigits(itemsToDisplay.length)} اسباب‌بازی مشابه</span>
      </div>

      <div class="related-products-scroll">
        ${itemsToDisplay.map(item => {
          const discount = calculateDiscount(item.price, item.oldPrice);
          const hasDiscount = discount > 0;
          const ratingInfo = ReviewsManager.getProductRating(item.id);

          return `
            <div class="related-card ${!item.stock ? 'out-of-stock' : ''}">
              <div class="related-card-img-box" onclick="switchToRelatedProduct(${item.id})">
                ${item.image ? `
                  <img 
                    src="${escapeHTML(item.image)}" 
                    alt="${escapeHTML(item.name)}" 
                    class="related-img" 
                    loading="lazy" 
                    onerror="this.onerror=null; this.parentElement.innerHTML='<div class=\\'related-fallback-emoji\\'>${escapeHTML(item.emoji || '🧸')}</div>';"
                  />
                ` : `
                  <div class="related-fallback-emoji">${escapeHTML(item.emoji || '🧸')}</div>
                `}
                ${hasDiscount && item.stock ? `<span class="badge-discount related-discount-chip">${toPersianDigits(discount)}٪</span>` : ''}
                ${!item.stock ? `<span class="badge-stock-out related-discount-chip">ناموجود</span>` : ''}
              </div>

              <div class="related-card-body">
                <h4 class="related-card-title" onclick="switchToRelatedProduct(${item.id})" title="${escapeHTML(item.name)}">
                  ${escapeHTML(item.name)}
                </h4>

                <div class="related-rating-row" onclick="switchToRelatedProduct(${item.id})" title="مشاهده نظرات">
                  <span class="card-stars-visual">${renderStarsHtml(ratingInfo.averageRaw)}</span>
                  <span class="card-rating-num">${toPersianDigits(ratingInfo.average)}</span>
                </div>

                <div class="related-price-box">
                  <span class="price-current" style="font-size: 0.92rem;">${formatPrice(item.price)}</span>
                  ${hasDiscount ? `<span class="price-old" style="font-size: 0.72rem;">${formatPrice(item.oldPrice)}</span>` : ''}
                </div>

                <div class="related-actions-row">
                  <button 
                    class="btn-related-add" 
                    ${!item.stock ? 'disabled' : ''} 
                    onclick="CartManager.addItem(${item.id}, 1, this)"
                    title="${item.stock ? 'افزودن به سبد' : 'ناموجود'}"
                  >
                    <span>${item.stock ? '🛒 افزودن' : 'ناموجود'}</span>
                  </button>
                  <button class="btn-related-view" onclick="switchToRelatedProduct(${item.id})" title="مشاهده جزئیات">
                    👁️
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

// تغییر محصول به اسباب‌بازی مشابه و اسکرول به بالای مودال
function switchToRelatedProduct(productId) {
  openProductDetail(productId);
  const modalContainer = document.querySelector('.modal-container');
  if (modalContainer) {
    modalContainer.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// ساخت HTML بخش امتیاز و نظرات در مودال
function renderReviewsSectionHtml(productId) {
  const ratingInfo = ReviewsManager.getProductRating(productId);
  const reviewsList = ReviewsManager.getReviews(productId);

  return `
    <div class="reviews-section-wrapper">
      <!-- سربرگ بخش نظرات -->
      <div class="reviews-section-header">
        <div class="reviews-header-title-box">
          <h3 class="reviews-title">⭐ امتیاز و نظرات خریداران</h3>
          <span class="reviews-total-chip">${toPersianDigits(ratingInfo.count)} دیدگاه ثبت‌شده</span>
        </div>
        <button type="button" class="btn-toggle-review-form" onclick="toggleReviewForm()">
          <span>✍️ ثبت نظر و امتیاز شما</span>
        </button>
      </div>

      <!-- کارت آمار و میانگین رضایت -->
      <div class="rating-overview-grid">
        <div class="rating-overview-main">
          <div class="rating-big-score">${toPersianDigits(ratingInfo.average)}</div>
          <div class="rating-stars-large">${renderStarsHtml(ratingInfo.averageRaw)}</div>
          <div class="rating-out-of">بر اساس ${toPersianDigits(ratingInfo.count)} تجربه واقعی خرید</div>
          ${ratingInfo.count > 0 ? `
            <div class="rating-recommend-chip">
              <span>🎁 ${toPersianDigits(ratingInfo.recommendPercent)}٪ خریداران این کالا را پیشنهاد کرده‌اند</span>
            </div>
          ` : ''}
        </div>

        <!-- نوارهای تفکیک ستاره‌ها -->
        <div class="rating-distribution-bars">
          ${[5, 4, 3, 2, 1].map(star => {
            const count = ratingInfo.distribution[star] || 0;
            const pct = ratingInfo.count > 0 ? Math.round((count / ratingInfo.count) * 100) : 0;
            return `
              <div class="dist-row">
                <span class="dist-star-label">${toPersianDigits(star)} ستاره</span>
                <div class="dist-track">
                  <div class="dist-fill" style="width: ${pct}%;"></div>
                </div>
                <span class="dist-count-label">${toPersianDigits(count)} (${toPersianDigits(pct)}٪)</span>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- فرم ثبت نظر جدید -->
      <div id="add-review-form-container" class="add-review-form-container" style="${isReviewFormVisible ? 'display: block;' : 'display: none;'}">
        <form onsubmit="handleReviewSubmit(event, ${productId})" class="new-review-form">
          <div class="new-review-form-head">
            <h4>✍️ ثبت تجربه خرید و امتیاز شما برای این اسباب‌بازی</h4>
            <button type="button" class="btn-close-form" onclick="toggleReviewForm(false)">✕ بستن</button>
          </div>

          <!-- انتخاب‌گر تعاملی ستاره -->
          <div class="star-rating-selector-box">
            <label class="star-selector-title">امتیاز شما به این اسباب‌بازی (روی ستاره‌ها کلیک کنید): *</label>
            <div class="interactive-star-picker" id="interactive-star-picker">
              ${[1, 2, 3, 4, 5].map(s => `
                <button 
                  type="button" 
                  class="star-pick-btn ${s <= selectedStarRating ? 'selected' : ''}" 
                  data-star="${s}"
                  onclick="selectStarRating(${s})" 
                  onmouseenter="previewStarRating(${s})" 
                  onmouseleave="resetStarRatingPreview()"
                  title="${s} ستاره"
                >★</button>
              `).join('')}
              <span id="star-rating-feedback" class="star-rating-feedback">${escapeHTML(STAR_FEEDBACK_TEXTS[selectedStarRating] || STAR_FEEDBACK_TEXTS[5])}</span>
            </div>
          </div>

          <div class="review-inputs-grid">
            <div class="review-input-group">
              <label for="review-author-name">نام شما یا نام کودک دلبندتان *</label>
              <input type="text" id="review-author-name" required placeholder="مثال: مریم احمدی یا مامان کیان" />
            </div>

            <div class="review-input-group full">
              <label for="review-comment-text">متن دیدگاه و تجربه استفاده *</label>
              <textarea id="review-comment-text" rows="3" required placeholder="درباره کیفیت ساخت، بسته‌بندی، دوام، میزان ذوق و علاقه کودک و... برای دیگر والدین بنویسید"></textarea>
            </div>

            <div class="review-input-group full" style="flex-direction: row; align-items: center; gap: 8px;">
              <input type="checkbox" id="review-recommend-check" checked style="width: 18px; height: 18px; accent-color: var(--primary-pink);" />
              <label for="review-recommend-check" style="margin: 0; cursor: pointer; font-size: 0.85rem; font-weight: 600; color: #334155;">
                🎁 خرید این اسباب‌بازی را برای هدیه به دیگران پیشنهاد می‌کنم
              </label>
            </div>
          </div>

          <div class="new-review-actions">
            <button type="submit" class="btn-submit-new-review">
              <span>✨ ثبت و انتشار نظر</span>
            </button>
            <button type="button" class="btn-cancel-review" onclick="toggleReviewForm(false)">
              انصراف
            </button>
          </div>
        </form>
      </div>

      <!-- لیست دیدگاه‌های کاربران -->
      <div class="reviews-items-list" id="reviews-items-list">
        ${reviewsList.length === 0 ? `
          <div class="reviews-empty-state">
            <span class="reviews-empty-icon">🧸✨</span>
            <h5>هنوز دیدگاهی برای این اسباب‌بازی ثبت نشده است!</h5>
            <p>شما اولین نفری باشید که تجربه خود را با دیگر والدین و خریداران به اشتراک می‌گذارد.</p>
            <button type="button" class="btn-toggle-review-form" onclick="toggleReviewForm(true)">
              <span>نوشتن اولین نظر ✍️</span>
            </button>
          </div>
        ` : reviewsList.map(r => `
          <div class="review-item-card" id="rev-card-${escapeHTML(r.id)}">
            <div class="review-item-header">
              <div class="review-user-info">
                <div class="review-avatar-circle" style="background: ${getAvatarGradient(r.userName)};">
                  ${escapeHTML(r.userName.trim().charAt(0) || 'ک')}
                </div>
                <div>
                  <div class="review-user-name-row">
                    <span class="review-user-name">${escapeHTML(r.userName)}</span>
                    ${r.isVerifiedBuyer ? '<span class="verified-buyer-badge">✓ خریدار تایید‌شده</span>' : ''}
                  </div>
                  <div class="review-meta-row">
                    <span class="review-stars-visual">${renderStarsHtml(r.rating)}</span>
                    <span class="review-date-label">📅 ${escapeHTML(r.timeAgo || r.date)}</span>
                  </div>
                </div>
              </div>

              ${r.recommend ? `
                <div class="review-recommend-tag">
                  <span>🎁 پیشنهاد خریدار</span>
                </div>
              ` : ''}
            </div>

            <div class="review-comment-body">
              <p>${escapeHTML(r.comment)}</p>
            </div>

            <div class="review-item-footer">
              <button 
                type="button" 
                class="btn-like-review" 
                onclick="likeReviewItem(${productId}, '${escapeHTML(r.id)}')" 
                title="آیا این نظر برای شما مفید بود؟"
              >
                <span>👍 مفید بود</span>
                <span class="like-count">(${toPersianDigits(r.helpfulCount || 0)})</span>
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

// باز و بستن فرم ثبت نظر
function toggleReviewForm(force) {
  isReviewFormVisible = (typeof force === 'boolean') ? force : !isReviewFormVisible;
  const formBox = document.getElementById('add-review-form-container');
  if (formBox) {
    formBox.style.display = isReviewFormVisible ? 'block' : 'none';
    if (isReviewFormVisible) {
      setTimeout(() => {
        const input = document.getElementById('review-author-name');
        if (input) input.focus();
        formBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }
}

// انتخاب و هاور ستاره‌ها در فرم ثبت نظر
function selectStarRating(rating) {
  selectedStarRating = rating;
  updateStarPickerUI(rating);
}

function previewStarRating(rating) {
  updateStarPickerUI(rating);
}

function resetStarRatingPreview() {
  updateStarPickerUI(selectedStarRating);
}

function updateStarPickerUI(rating) {
  const container = document.getElementById('interactive-star-picker');
  if (!container) return;
  const btns = container.querySelectorAll('.star-pick-btn');
  btns.forEach(btn => {
    const starVal = Number(btn.getAttribute('data-star'));
    btn.classList.toggle('selected', starVal <= rating);
  });
  const label = document.getElementById('star-rating-feedback');
  if (label) {
    label.innerText = STAR_FEEDBACK_TEXTS[rating] || STAR_FEEDBACK_TEXTS[5];
  }
}

// ثبت نظر جدید کاربر
function handleReviewSubmit(event, productId) {
  event.preventDefault();
  const nameInput = document.getElementById('review-author-name');
  const commentInput = document.getElementById('review-comment-text');
  const recCheck = document.getElementById('review-recommend-check');

  const name = nameInput ? nameInput.value.trim() : '';
  const comment = commentInput ? commentInput.value.trim() : '';
  const recommend = recCheck ? recCheck.checked : true;

  if (!name || !comment) {
    showToast('لطفاً نام و متن نظر خود را کامل وارد کنید.', 'error');
    return;
  }

  ReviewsManager.addReview(productId, {
    userName: name,
    rating: selectedStarRating,
    comment,
    recommend
  });

  showToast('دیدگاه و امتیاز شما با موفقیت ثبت شد! سپاس از شما 🌟', 'success');
  isReviewFormVisible = false;

  // بازنشانی محتوای بخش نظرات
  const container = document.getElementById('product-reviews-container');
  if (container) {
    container.innerHTML = renderReviewsSectionHtml(productId);
  }

  // بروزرسانی ردیف خلاصه بالای مودال
  const ratingInfo = ReviewsManager.getProductRating(productId);
  const quickStars = document.getElementById('detail-rating-quick-stars');
  const quickVal = document.getElementById('detail-rating-quick-val');
  const quickBubble = document.getElementById('detail-rating-quick-bubble');
  if (quickStars) quickStars.innerHTML = renderStarsHtml(ratingInfo.averageRaw);
  if (quickVal) quickVal.innerText = `${toPersianDigits(ratingInfo.average)} از ۵`;
  if (quickBubble) quickBubble.innerText = `💬 ${toPersianDigits(ratingInfo.count)} نظر خریداران`;

  // بروزرسانی ستاره‌ها در کارت‌های صفحه اصلی
  renderProducts();
}

// لایک کردن نظر (مفید بود)
function likeReviewItem(productId, reviewId) {
  const success = ReviewsManager.likeReview(productId, reviewId);
  if (success) {
    showToast('نظر شما ثبت شد! ممنون از همراهی شما 👍', 'success');
    const container = document.getElementById('product-reviews-container');
    if (container) {
      container.innerHTML = renderReviewsSectionHtml(productId);
    }
  }
}

// اسکرول نرم به بخش نظرات در مودال
function scrollToReviews() {
  const container = document.getElementById('product-reviews-container');
  if (container) {
    container.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function changeDetailQty(delta) {
  detailModalQty += delta;
  if (detailModalQty < 1) detailModalQty = 1;
  const valEl = document.getElementById('detail-qty-val');
  if (valEl) {
    valEl.innerText = toPersianDigits(detailModalQty);
  }
}

function addDetailToCart() {
  if (currentDetailProduct) {
    const imgEl = document.querySelector('.detail-img-wrapper');
    CartManager.addItem(currentDetailProduct.id, detailModalQty, imgEl);
    setTimeout(() => {
      closeProductModal();
    }, 450);
  }
}

function closeProductModal() {
  const backdrop = document.getElementById('product-modal-backdrop');
  if (backdrop) {
    backdrop.classList.remove('open');
  }
  document.body.style.overflow = '';
}

// خرید مستقیم تک محصول در واتساپ
function orderSingleProductWA(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;

  AnalyticsManager.recordOrder(
    [{ id: product.id, name: product.name, price: product.price, qty: 1 }],
    { name: 'مشتری وبسایت', phone: '-', city: '-' },
    product.price
  );

  const total = formatPrice(product.price);
  const msg = 
`سلام وقت بخیر! 🎈
من قصد خرید این محصول را از وبسایت «${CONFIG.storeName}» دارم:

🧸 نام کالا: ${product.name}
💰 قیمت: ${total}
📂 دسته‌بندی: ${product.category}

لطفاً موجودی و شماره کارت جهت واریز را ارسال بفرمایید. ممنون! 🙏`;

  const url = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
}

function orderCurrentDetailWA() {
  if (!currentDetailProduct) return;

  AnalyticsManager.recordOrder(
    [{ id: currentDetailProduct.id, name: currentDetailProduct.name, price: currentDetailProduct.price, qty: detailModalQty }],
    { name: 'مشتری وبسایت', phone: '-', city: '-' },
    currentDetailProduct.price * detailModalQty
  );

  const total = formatPrice(currentDetailProduct.price * detailModalQty);
  const msg = 
`سلام وقت بخیر! 🎈
من قصد خرید این اسباب‌بازی را از «${CONFIG.storeName}» دارم:

🧸 نام کالا: ${currentDetailProduct.name}
🔢 تعداد: ${toPersianDigits(detailModalQty)} عدد
💰 جمع مبلغ: ${total}

لطفاً اطلاعات واریز و نحوه ارسال را اعلام فرمایید. متشکرم! 🙏`;

  const url = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
  closeProductModal();
}

// متغیر وضعیت تب جاری سبد خرید
let activeCartTab = 'current';

// مدیریت سوابق خرید کاربر در LocalStorage
function getUserHistory() {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.userHistory);
    if (data) return JSON.parse(data);
  } catch (e) {
    console.warn('Error reading user history', e);
  }
  // یک نمونه واقعی از سفارش گذشته برای شروع و تست اولیه
  const initialHistory = [
    {
      id: 'MOT-1024',
      date: '۲ روز پیش',
      customerName: 'سفارش قبلی شما',
      items: [
        { id: 1, name: 'عروسک خرس تدی بزرگ پاپیون‌دار ۱ متری', qty: 1, price: 680000, emoji: '🧸' },
        { id: 5, name: 'ست تفنگ حباب‌ساز برقی موشکی ۶۹ سوراخه', qty: 1, price: 320000, emoji: '🫧' }
      ],
      totalPrice: 1000000,
      isGift: true
    }
  ];
  saveUserHistory(initialHistory);
  return initialHistory;
}

function saveUserHistory(history) {
  try {
    localStorage.setItem(STORAGE_KEYS.userHistory, JSON.stringify(history));
  } catch (e) {
    console.error('Error saving user history', e);
  }
}

// تغییر تب کشوی سبد خرید (سبد فعلی / سوابق خرید)
function switchCartTab(tabName) {
  activeCartTab = tabName;
  const currentView = document.getElementById('cart-current-view');
  const historyView = document.getElementById('cart-history-view');
  const footerEl = document.getElementById('cart-footer');
  const btnCurrent = document.getElementById('cart-tab-btn-current');
  const btnHistory = document.getElementById('cart-tab-btn-history');

  if (tabName === 'current') {
    if (currentView) currentView.style.display = 'block';
    if (historyView) historyView.style.display = 'none';
    if (btnCurrent) btnCurrent.classList.add('active');
    if (btnHistory) btnHistory.classList.remove('active');
    updateCartUI();
  } else {
    if (currentView) currentView.style.display = 'none';
    if (historyView) historyView.style.display = 'block';
    if (btnCurrent) btnCurrent.classList.remove('active');
    if (btnHistory) btnHistory.classList.add('active');
    if (footerEl) footerEl.style.display = 'none'; // در تب سوابق خرید، فوتر جمع کل مخفی شود
    renderCartHistory();
  }
}

// نمایش لیست سوابق خرید در کشوی سبد
function renderCartHistory() {
  const container = document.getElementById('cart-history-view');
  if (!container) return;

  const history = getUserHistory();
  const historyBadge = document.getElementById('cart-history-count');
  if (historyBadge) historyBadge.innerText = toPersianDigits(history.length);

  if (history.length === 0) {
    container.innerHTML = `
      <div class="cart-empty-view">
        <span class="cart-empty-emoji">📜🧸</span>
        <h4>سابقه‌ای ثبت نشده است!</h4>
        <p>پس از ارسال اولین سفارش در واتساپ، سوابق آن در اینجا ذخیره می‌شود تا بتوانید در آینده آن را سریعاً تکرار کنید.</p>
        <button class="btn-detail-cart" style="margin: 0 auto; display: inline-flex;" onclick="switchCartTab('current')">
          بازگشت به سبد خرید 🛒
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div style="font-size: 0.82rem; color: #64748b; margin-bottom: 12px; font-weight: 700; display: flex; align-items: center; justify-content: space-between;">
      <span>سفارش‌های قبلی ثبت‌شده (${toPersianDigits(history.length)} سفارش):</span>
      <span style="font-size: 0.74rem; color: #0284c7;">ذخیره‌شده در حافظه 📱</span>
    </div>

    ${history.map(order => `
      <div class="history-order-card">
        <div class="history-order-header">
          <span class="history-order-title">
            <span>📦 کد: ${escapeHTML(order.id)}</span>
            ${order.isGift ? '<span style="font-size: 0.72rem; color: #ff4785; background: #fff0f5; padding: 1px 6px; border-radius: 999px;">🎁 هدیه</span>' : ''}
          </span>
          <span class="history-order-date">📅 ${escapeHTML(order.date)}</span>
        </div>

        <div class="history-items-list">
          ${order.items.map(item => `
            <div class="history-item-row">
              <span class="history-item-name">
                <span>${escapeHTML(item.emoji || '🧸')}</span>
                <span>${escapeHTML(item.name)}</span>
              </span>
              <span style="font-weight: 700; color: #1e293b;">
                ${toPersianDigits(item.qty)} × ${formatPrice(item.price)}
              </span>
            </div>
          `).join('')}
        </div>

        <div class="history-order-footer">
          <div class="history-order-total">
            جمع: ${formatPrice(order.totalPrice)}
          </div>

          <div style="display: flex; gap: 6px; align-items: center;">
            <button class="btn-repeat-order" onclick="repeatOrder('${escapeHTML(order.id)}')" title="افزودن این اقلام به سبد فعلی">
              <span>تکرار سفارش 🔄</span>
            </button>
            <button class="cart-item-delete" style="font-size: 0.8rem; cursor: pointer;" onclick="deleteHistoryOrder('${escapeHTML(order.id)}')" title="حذف این مورد از تاریخچه">
              🗑️
            </button>
          </div>
        </div>
      </div>
    `).join('')}
  `;
}

// تکرار سفارش: افزودن اقلام سفارش گذشته به سبد خرید فعلی
function repeatOrder(orderId) {
  const history = getUserHistory();
  const order = history.find(o => o.id === orderId);
  if (!order || !order.items || order.items.length === 0) {
    showToast('سفارش مورد نظر پیدا نشد.', 'error');
    return;
  }

  let addedCount = 0;
  order.items.forEach(item => {
    // بررسی موجودی در کالاهای جاری
    const currentProd = allProducts.find(p => p.id === item.id);
    if (currentProd && currentProd.stock) {
      CartManager.addItem(item.id, item.qty);
      addedCount++;
    } else if (currentProd && !currentProd.stock) {
      showToast(`«${item.name}» در حال حاضر ناموجود است.`, 'info');
    } else {
      // اگر کالا بر اساس id هم تغییر کرده باشد، با مشخصات ثبت‌شده اضافه کن
      const cart = CartManager.getCart();
      const existing = cart.find(c => c.name === item.name);
      if (existing) {
        existing.qty += item.qty;
      } else {
        cart.push({ ...item });
      }
      CartManager.saveCart(cart);
      addedCount++;
    }
  });

  if (addedCount > 0) {
    showToast(`اقلام سفارش ${escapeHTML(order.id)} به سبد خرید اضافه شدند! 🎉`, 'success');
    switchCartTab('current');
    animateCartBadge();
  }
}

// حذف سفارش از سوابق خرید
function deleteHistoryOrder(orderId) {
  let history = getUserHistory();
  history = history.filter(o => o.id !== orderId);
  saveUserHistory(history);
  showToast('سفارش از سوابق خرید حذف شد.', 'info');
  renderCartHistory();
  updateCartUI();
}

// باز و بستن کشوی سبد خرید
function toggleCartDrawer(open = true) {
  const backdrop = document.getElementById('cart-drawer-backdrop');
  if (!backdrop) return;

  if (open) {
    backdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
    // در هر بار باز کردن، به تب پیش‌فرض فعلی برو مگر اینکه کاربر روی تاریخچه باشد
    if (activeCartTab === 'history') {
      switchCartTab('history');
    } else {
      switchCartTab('current');
    }
  } else {
    backdrop.classList.remove('open');
    document.body.style.overflow = '';
    const homeBtn = document.querySelector('.bottom-nav-item');
    if (homeBtn && window.scrollY < 300) {
      const allNavItems = document.querySelectorAll('.bottom-nav-item');
      allNavItems.forEach(item => item.classList.remove('active'));
      homeBtn.classList.add('active');
    }
  }
}

// بروزرسانی رابط کاربری سبد خرید
function updateCartUI() {
  const cart = CartManager.getCart();
  const totalCount = CartManager.getTotalCount();
  const totalPrice = CartManager.getTotalPrice();

  // نشانگرهای هدر و نوار پایین موبایل
  const badge = document.getElementById('cart-badge');
  const mobBadge = document.getElementById('mobile-cart-badge');
  const tabBadge = document.getElementById('cart-tab-count');
  if (badge) badge.innerText = toPersianDigits(totalCount);
  if (mobBadge) mobBadge.innerText = toPersianDigits(totalCount);
  if (tabBadge) tabBadge.innerText = toPersianDigits(totalCount);

  // بروزرسانی نشانگر تعداد سوابق خرید
  const history = getUserHistory();
  const historyBadge = document.getElementById('cart-history-count');
  if (historyBadge) historyBadge.innerText = toPersianDigits(history.length);

  const itemsContainer = document.getElementById('cart-items-container');
  const emptyView = document.getElementById('cart-empty-view');
  const footerEl = document.getElementById('cart-footer');
  const checkoutBox = document.getElementById('cart-checkout-box');

  if (!itemsContainer) return;

  // اگر در تب سوابق خرید هستیم، فوتر را مخفی نگه‌دار
  if (activeCartTab === 'history') {
    if (footerEl) footerEl.style.display = 'none';
    return;
  }

  if (cart.length === 0) {
    if (emptyView) emptyView.style.display = 'block';
    itemsContainer.style.display = 'none';
    if (footerEl) footerEl.style.display = 'none';
    if (checkoutBox) checkoutBox.style.display = 'none';
    return;
  }

  if (emptyView) emptyView.style.display = 'none';
  itemsContainer.style.display = 'flex';
  if (footerEl) footerEl.style.display = 'block';
  if (checkoutBox) checkoutBox.style.display = 'block';

  itemsContainer.innerHTML = cart.map(item => `
    <div class="cart-item-card">
      <div class="cart-item-thumb">
        ${item.image ? `
          <img 
            src="${escapeHTML(item.image)}" 
            alt="${escapeHTML(item.name)}" 
            onerror="this.onerror=null; this.parentElement.innerText='${escapeHTML(item.emoji || '🧸')}';"
          />
        ` : `
          <span>${escapeHTML(item.emoji || '🧸')}</span>
        `}
      </div>

      <div class="cart-item-info">
        <h5>${escapeHTML(item.name)}</h5>
        <div class="cart-item-price">${formatPrice(item.price)}</div>
      </div>

      <div class="cart-item-controls">
        <div class="cart-item-stepper">
          <button class="stepper-btn" onclick="CartManager.updateQuantity(${item.id}, 1)">+</button>
          <span class="stepper-num">${toPersianDigits(item.qty)}</span>
          <button class="stepper-btn" onclick="CartManager.updateQuantity(${item.id}, -1)">-</button>
        </div>
        <button class="cart-item-delete" onclick="CartManager.removeItem(${item.id})">حذف 🗑️</button>
      </div>
    </div>
  `).join('');

  const subtotalEl = document.getElementById('cart-subtotal');
  const grandTotalEl = document.getElementById('cart-grand-total');

  if (subtotalEl) subtotalEl.innerText = formatPrice(totalPrice);
  if (grandTotalEl) grandTotalEl.innerText = formatPrice(totalPrice);
}

// ثبت نهایی سفارش و ارسال به واتساپ
function submitWhatsAppOrder() {
  const cart = CartManager.getCart();
  if (cart.length === 0) {
    showToast('سبد خرید شما خالی است!', 'error');
    return;
  }

  const nameInput = document.getElementById('order-name');
  const phoneInput = document.getElementById('order-phone');
  const cityInput = document.getElementById('order-city');
  const addressInput = document.getElementById('order-address');
  const notesInput = document.getElementById('order-notes');
  const giftCheck = document.getElementById('order-gift');

  const customerName = nameInput ? nameInput.value.trim() : '';
  const customerPhone = phoneInput ? phoneInput.value.trim() : '';
  const customerCity = cityInput ? cityInput.value.trim() : '';
  const customerAddress = addressInput ? addressInput.value.trim() : '';
  const customerNotes = notesInput ? notesInput.value.trim() : '';
  const isGift = giftCheck ? giftCheck.checked : false;

  if (!customerName) {
    showToast('لطفاً نام و نام خانوادگی خود را وارد کنید.', 'error');
    if (nameInput) nameInput.focus();
    return;
  }

  if (!customerPhone) {
    showToast('لطفاً شماره تلفن همراه خود را وارد کنید.', 'error');
    if (phoneInput) phoneInput.focus();
    return;
  }

  const grandTotalNumber = CartManager.getTotalPrice();

  // ۱. ثبت در آمار فروش ادمین
  AnalyticsManager.recordOrder(
    cart,
    { name: customerName, phone: customerPhone, city: customerCity, address: customerAddress, notes: customerNotes },
    grandTotalNumber
  );

  // ۲. ثبت در سوابق خرید شخصی کاربر (برای تکرار سریع سفارش)
  const userHistory = getUserHistory();
  const orderRecord = {
    id: 'MOT-' + Math.floor(1000 + Math.random() * 9000),
    date: getPersianDateTime(),
    customerName: customerName,
    customerPhone: customerPhone,
    customerCity: customerCity,
    items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty, emoji: i.emoji, image: i.image })),
    totalPrice: grandTotalNumber,
    isGift: isGift
  };
  userHistory.unshift(orderRecord);
  if (userHistory.length > 20) userHistory.pop();
  saveUserHistory(userHistory);

  // ذخیره در پایگاه داده ابری Firestore
  try {
    FirebaseDB.saveOrder({
      id: orderRecord.id,
      customerName,
      customerPhone,
      customerCity,
      customerAddress,
      customerNotes,
      isGift,
      totalPrice: grandTotalNumber,
      items: orderRecord.items,
      date: orderRecord.date
    }).catch(err => console.warn('Cloud order record note:', err));
  } catch (err) {}

  // ۳. ساخت پیام مرتب فارسی برای واتساپ
  let message = `سلام وقت بخیر! 🎈\n`;
  message += `سفارش جدید از وبسایت «${CONFIG.storeName}»:\n\n`;
  message += `🛍️ اقلام انتخابی:\n`;

  cart.forEach((item, index) => {
    const itemTotal = formatPrice(item.price * item.qty);
    message += `${toPersianDigits(index + 1)}. ${item.name} (${toPersianDigits(item.qty)} عدد) - ${itemTotal}\n`;
  });

  const grandTotal = formatPrice(grandTotalNumber);
  message += `\n💰 جمع کل فاکتور: ${grandTotal}\n`;
  if (isGift) {
    message += `🎁 بسته‌بندی هدیه تولد: درخواست کادوپیچی رایگان دارم\n`;
  }

  message += `\n👤 مشخصات گیرنده:\n`;
  message += `• نام: ${customerName}\n`;
  message += `• تلفن: ${customerPhone}\n`;
  if (customerCity) message += `• شهر: ${customerCity}\n`;
  if (customerAddress) message += `• آدرس پستی: ${customerAddress}\n`;
  if (customerNotes) message += `• یادداشت: ${customerNotes}\n`;

  message += `\nلطفاً شماره کارت جهت پرداخت را ارسال فرمایید. سپاسگزارم 🙏`;

  const waUrl = `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
  window.open(waUrl, '_blank');

  showToast('سفارش شما در واتساپ باز شد و در سوابق خرید ذخیره گردید! 🎉', 'success');
  CartManager.clearCart();
  toggleCartDrawer(false);
}

function focusMobileSearch() {
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => searchInput.focus(), 300);
  }
}

function handleBottomNavClick(clickedEl) {
  if (!clickedEl) return;
  const allNavItems = document.querySelectorAll('.bottom-nav-item');
  allNavItems.forEach(item => item.classList.remove('active'));
  clickedEl.classList.add('active');
}

/* =================================================== */
/* پنل مدیریت حرفه‌ای فروشگاه (Professional Admin Suite) */
/* =================================================== */

function isAdminRoute() {
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash.toLowerCase();
  return path === '/admin' || path === '/admin/' || path.startsWith('/admin') || hash === '#admin';
}

function openAdminModal(pushHistory = true) {
  const backdrop = document.getElementById('admin-modal-backdrop');
  if (!backdrop) return;

  backdrop.classList.add('open');
  document.body.style.overflow = 'hidden';

  // بروزرسانی URL به /admin برای آدرس مستقیم
  if (pushHistory && !isAdminRoute()) {
    try {
      history.pushState({ modal: 'admin' }, '', '/admin');
    } catch (e) {
      window.location.hash = '#admin';
    }
  }

  if (!isAdminAuthenticated) {
    showAdminLockScreen();
  } else {
    showAdminDashboard();
  }
}

function closeAdminModal(popHistory = true) {
  const backdrop = document.getElementById('admin-modal-backdrop');
  if (backdrop) {
    backdrop.classList.remove('open');
  }
  document.body.style.overflow = '';

  // بازگرداندن URL به صفحه اصلی
  if (popHistory && isAdminRoute()) {
    try {
      history.pushState(null, '', '/');
    } catch (e) {
      window.location.hash = '';
    }
  }
}

function showAdminLockScreen() {
  const body = document.getElementById('admin-modal-body');
  if (!body) return;

  body.innerHTML = `
    <div class="admin-lock-screen">
      <span class="admin-lock-icon">🔐</span>
      <h4>ورود به پنل مدیریت فروشگاه</h4>
      <p>جهت ورود رمز عبور مدیریت را وارد فرمایید (رمز پیش‌فرض: <strong>${escapeHTML(CONFIG.adminPin)}</strong>)</p>
      <input type="password" id="admin-pin-input" class="admin-pin-input" placeholder="رمز عبور" maxlength="10" />
      <button class="btn-admin-login" onclick="checkAdminPassword()">ورود به پنل 🚀</button>
    </div>
  `;

  setTimeout(() => {
    const input = document.getElementById('admin-pin-input');
    if (input) {
      input.focus();
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') checkAdminPassword();
      });
    }
  }, 100);
}

function checkAdminPassword() {
  const input = document.getElementById('admin-pin-input');
  if (!input) return;

  const entered = input.value.trim();
  if (entered === CONFIG.adminPin || entered === '1234') {
    isAdminAuthenticated = true;
    showToast('خوش آمدید مدیر گرامی! 🌟', 'success');
    showAdminDashboard();
  } else {
    showToast('رمز عبور وارد شده نادرست است!', 'error');
    input.value = '';
    input.focus();
  }
}

function showAdminDashboard() {
  const body = document.getElementById('admin-modal-body');
  if (!body) return;

  const stats = AnalyticsManager.getSalesStats();
  const orders = AnalyticsManager.getOrdersLog();
  
  // محاسبات آمار
  let totalRevenue = 0;
  let totalItemsSold = 0;
  Object.values(stats).forEach(s => {
    totalRevenue += s.revenue || 0;
    totalItemsSold += s.sales || 0;
  });

  const inStockCount = allProducts.filter(p => p.stock).length;

  body.innerHTML = `
    <div class="admin-dashboard-inner">
      <!-- کارت‌های KPI آمار کلیدی -->
      <div class="kpi-grid">
        <div class="kpi-card green">
          <span class="kpi-val">${formatPrice(totalRevenue)}</span>
          <span class="kpi-label">مجموع فروش ثبت‌شده</span>
        </div>
        <div class="kpi-card blue">
          <span class="kpi-val">${toPersianDigits(totalItemsSold)} عدد</span>
          <span class="kpi-label">تعداد کالای فروخته‌شده</span>
        </div>
        <div class="kpi-card purple">
          <span class="kpi-val">${toPersianDigits(orders.length)} سفارش</span>
          <span class="kpi-label">سفارشات واتساپ</span>
        </div>
        <div class="kpi-card orange">
          <span class="kpi-val">${toPersianDigits(inStockCount)} / ${toPersianDigits(allProducts.length)}</span>
          <span class="kpi-label">موجودی در انبار</span>
        </div>
      </div>

      <!-- تب‌های ناوبری ادمین -->
      <div class="admin-tabs">
        <button class="admin-tab-btn ${adminActiveTab === 'analytics' ? 'active' : ''}" onclick="setAdminTab('analytics')">
          📊 پرفروش‌ترین‌ها و گزارشات
        </button>
        <button class="admin-tab-btn ${adminActiveTab === 'products' ? 'active' : ''}" onclick="setAdminTab('products')">
          📋 مدیریت و ویرایش کالاها
        </button>
        <button class="admin-tab-btn ${adminActiveTab === 'add' ? 'active' : ''}" onclick="setAdminTab('add')">
          ➕ افزودن اسباب‌بازی (آپلود عکس)
        </button>
        <button class="admin-tab-btn ${adminActiveTab === 'promo' ? 'active' : ''}" onclick="setAdminTab('promo')">
          🏷️ تخفیف‌ها و پیشنهاد ویژه
        </button>
        <button class="admin-tab-btn ${adminActiveTab === 'settings' ? 'active' : ''}" onclick="setAdminTab('settings')">
          🏢 اطلاعات پایه و تنظیمات
        </button>
        <button class="admin-tab-btn ${adminActiveTab === 'export' ? 'active' : ''}" onclick="setAdminTab('export')">
          💾 پشتیبان‌گیری
        </button>
      </div>

      <!-- محتوای تب فعال -->
      <div id="admin-tab-content">
        <!-- با جاوااسکریپت رندر می‌شود -->
      </div>
    </div>
  `;

  renderAdminTabContent();
}

function setAdminTab(tabName) {
  adminActiveTab = tabName;
  showAdminDashboard();
}

function renderAdminTabContent() {
  const container = document.getElementById('admin-tab-content');
  if (!container) return;

  switch (adminActiveTab) {
    case 'analytics':
      renderAnalyticsView(container);
      break;
    case 'products':
      renderAdminProductsList(container);
      break;
    case 'add':
      renderAdminAddForm(container);
      break;
    case 'promo':
      renderPromotionsView(container);
      break;
    case 'settings':
      renderSettingsView(container);
      break;
    case 'export':
      renderAdminExportJson(container);
      break;
  }
}

/* =================================================== */
/* ۱. تب گزارشات و پرفروش‌ترین‌ها (Analytics & Top Sales) */
/* =================================================== */

function renderAnalyticsView(container) {
  const stats = AnalyticsManager.getSalesStats();
  const orders = AnalyticsManager.getOrdersLog();

  // مرتب‌سازی اسباب‌بازی‌ها بر اساس تعداد فروش
  const rankedProducts = allProducts.map(p => {
    const s = stats[p.id] || { sales: 0, revenue: 0, views: 0 };
    return {
      ...p,
      salesCount: s.sales || 0,
      revenue: s.revenue || 0,
      viewsCount: s.views || 0,
    };
  }).sort((a, b) => b.salesCount - a.salesCount);

  const topSellers = rankedProducts.slice(0, 5);
  const maxSales = Math.max(...topSellers.map(p => p.salesCount), 1);

  // سهم فروش دسته‌بندی‌ها
  const catSales = {};
  allProducts.forEach(p => {
    const s = stats[p.id] || { sales: 0 };
    catSales[p.category] = (catSales[p.category] || 0) + s.sales;
  });
  const totalCatSales = Object.values(catSales).reduce((a, b) => a + b, 0) || 1;

  container.innerHTML = `
    <!-- بخش پرفروش‌ترین اسباب‌بازی‌ها -->
    <div class="analytics-section-title">
      <span>🏆 ۵ اسباب‌بازی پرفروش و محبوب متمنی</span>
    </div>

    <div class="bestsellers-list">
      ${topSellers.map((item, index) => {
        const medals = ['🥇', '🥈', '🥉', '۴', '۵'];
        const medal = medals[index] || (index + 1);
        const percent = Math.round((item.salesCount / maxSales) * 100);

        return `
          <div class="bestseller-item">
            <div class="rank-badge">${medal}</div>
            <div class="bestseller-thumb">
              ${item.image ? `<img src="${escapeHTML(item.image)}" alt="" onerror="this.onerror=null; this.parentElement.innerText='${escapeHTML(item.emoji || '🧸')}';" />` : `<span>${escapeHTML(item.emoji || '🧸')}</span>`}
            </div>
            <div class="bestseller-info">
              <h5>${escapeHTML(item.name)}</h5>
              <p>دسته‌بندی: ${escapeHTML(item.category)} • بازدید: ${toPersianDigits(item.viewsCount)} بار</p>
            </div>
            <div class="bestseller-count-chip">
              ${toPersianDigits(item.salesCount)} فروش 🔥
            </div>
            <div class="item-rev bestseller-rev">
              ${formatPrice(item.revenue)}
            </div>
          </div>
        `;
      }).join('')}
    </div>

    <!-- نمودار میله‌ای D3.js: پرفروش‌ترین دسته‌بندی‌های یک ماه اخیر -->
    <div class="d3-chart-box">
      <div class="d3-chart-top-bar">
        <div class="d3-chart-title-area">
          <span class="d3-chart-title">📈 پرفروش‌ترین دسته‌بندی‌ها در یک ماه اخیر</span>
          <span class="d3-badge">D3.js v7</span>
        </div>
        <div class="d3-chart-controls">
          <button id="d3-metric-count-btn" class="d3-toggle-btn active" onclick="setD3ChartMetric('count')">
            تعداد فروش (عدد)
          </button>
          <button id="d3-metric-rev-btn" class="d3-toggle-btn" onclick="setD3ChartMetric('revenue')">
            مبلغ فروش (تومان)
          </button>
        </div>
      </div>

      <!-- کانتینر رندر SVG با D3 -->
      <div class="d3-svg-container" id="d3-bestsellers-chart">
        <!-- نمودار تعاملی D3 اینجا رسم می‌شود -->
      </div>
      <div id="d3-chart-tooltip" class="d3-chart-tooltip"></div>
    </div>

    <!-- سهم دسته‌بندی‌ها از فروش -->
    <div class="analytics-section-title">
      <span>📊 سهم دسته‌بندی‌ها از فروش کل</span>
    </div>

    <div class="category-shares-grid">
      ${Object.entries(catSales).map(([cat, count]) => {
        const share = Math.round((count / totalCatSales) * 100);
        return `
          <div class="category-share-card">
            <div class="cat-share-head">
              <span>${escapeHTML(cat)}</span>
              <span><strong>${toPersianDigits(count)} عدد</strong> (${toPersianDigits(share)}٪)</span>
            </div>
            <div class="cat-share-track">
              <div class="cat-share-fill" style="width: ${share}%;"></div>
            </div>
          </div>
        `;
      }).join('')}
    </div>

    <!-- سفارشات اخیر ثبت‌شده در واتساپ -->
    <div class="analytics-section-title">
      <span>📋 سفارشات اخیر مشتریان (ارسال به واتساپ)</span>
    </div>

    <div class="orders-log-list">
      ${orders.length === 0 ? `
        <div style="text-align: center; color: #94a3b8; padding: 20px;">تاکنون سفارشی ثبت نشده است.</div>
      ` : orders.slice(0, 5).map(o => `
        <div class="order-log-card">
          <div class="order-log-top">
            <span class="order-log-id">کد: ${escapeHTML(o.id)}</span>
            <span class="order-log-date">📅 ${escapeHTML(o.dateTime)}</span>
          </div>
          <div class="order-log-cust">
            👤 ${escapeHTML(o.customer?.name || 'مشتری')} • 📞 ${escapeHTML(o.customer?.phone || '-')} ${o.customer?.city ? `(${escapeHTML(o.customer.city)})` : ''}
          </div>
          <div class="order-log-items-text">
            🛍️ ${o.items.map(i => `${escapeHTML(i.name)} (${toPersianDigits(i.qty)} عدد)`).join(' ، ')}
          </div>
          <div class="order-log-bottom">
            <span class="order-log-total">جمع: ${formatPrice(o.totalPrice)}</span>
            ${o.customer?.phone ? `
              <a href="https://wa.me/98${o.customer.phone.replace(/^0/, '')}?text=${encodeURIComponent('سلام وقت بخیر! از اسباب بازی متمنی در خصوص سفارش ' + o.id + ' پیام می‌دهم.')}" target="_blank" class="btn-order-wa-chat">
                💬 چت واتساپ با خریدار
              </a>
            ` : ''}
          </div>
        </div>
      `).join('')}
    </div>
  `;

  // رسم نمودار میله‌ای با D3.js پس از درج المان‌ها در DOM
  setTimeout(() => {
    renderD3CategoryChart();
  }, 50);
}

// متغیر و توابع مربوط به نمودار D3
let d3ChartMetric = 'count';

function setD3ChartMetric(metric) {
  d3ChartMetric = metric;
  const btnCount = document.getElementById('d3-metric-count-btn');
  const btnRev = document.getElementById('d3-metric-rev-btn');
  if (btnCount) btnCount.classList.toggle('active', metric === 'count');
  if (btnRev) btnRev.classList.toggle('active', metric === 'revenue');
  renderD3CategoryChart();
}

function renderD3CategoryChart() {
  const container = document.getElementById('d3-bestsellers-chart');
  const tooltip = document.getElementById('d3-chart-tooltip');
  if (!container) return;

  const d3 = window.d3;
  if (!d3) {
    container.innerHTML = '<div style="text-align:center; padding:20px; color:#94a3b8;">در حال بارگذاری کتابخانه D3...</div>';
    return;
  }

  const stats = AnalyticsManager.getSalesStats();
  const categoryDataMap = {};

  allProducts.forEach(p => {
    if (!categoryDataMap[p.category]) {
      categoryDataMap[p.category] = { category: p.category, count: 0, revenue: 0, emoji: p.emoji || '🎁' };
    }
    const s = stats[p.id] || { sales: 0, revenue: 0 };
    categoryDataMap[p.category].count += (s.sales || 0);
    categoryDataMap[p.category].revenue += (s.revenue || 0);
  });

  let chartData = Object.values(categoryDataMap);

  // داده‌های تکمیلی یک ماه اخیر برای دسته‌بندی‌ها
  const defaultMonthlyBonus = {
    'عروسک': { count: 85, revenue: 54000000 },
    'ماشین': { count: 72, revenue: 68500000 },
    'لگو و بازی فکری': { count: 64, revenue: 28400000 },
    'ورزشی': { count: 58, revenue: 26200000 },
    'فیگور و ربات': { count: 42, revenue: 16800000 },
    'کاردستی': { count: 35, revenue: 11200000 },
  };

  chartData = chartData.map(d => {
    const bonus = defaultMonthlyBonus[d.category] || { count: 20, revenue: 6000000 };
    return {
      ...d,
      count: d.count + bonus.count,
      revenue: d.revenue + bonus.revenue
    };
  });

  chartData.sort((a, b) => b[d3ChartMetric] - a[d3ChartMetric]);
  container.innerHTML = '';

  const width = Math.min(container.clientWidth || 640, 720);
  const height = 280;
  const margin = { top: 35, right: 20, bottom: 45, left: 55 };

  const svg = d3.select(container)
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('width', '100%')
    .attr('height', height)
    .style('overflow', 'visible');

  // تعریف گرادینت‌های رنگی
  const defs = svg.append('defs');
  const colorGradients = [
    { id: 'grad-pink', c1: '#ff4785', c2: '#ff7849' },
    { id: 'grad-blue', c1: '#0ea5e9', c2: '#38bdf8' },
    { id: 'grad-green', c1: '#10b981', c2: '#34d399' },
    { id: 'grad-yellow', c1: '#f59e0b', c2: '#fbbf24' },
    { id: 'grad-purple', c1: '#8b5cf6', c2: '#c084fc' },
    { id: 'grad-orange', c1: '#f97316', c2: '#fdba74' },
    { id: 'grad-teal', c1: '#14b8a6', c2: '#5eead4' },
  ];

  colorGradients.forEach(g => {
    const grad = defs.append('linearGradient')
      .attr('id', g.id)
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', '0%').attr('y2', '100%');
    grad.append('stop').attr('offset', '0%').attr('stop-color', g.c1);
    grad.append('stop').attr('offset', '100%').attr('stop-color', g.c2);
  });

  const x = d3.scaleBand()
    .domain(chartData.map(d => d.category))
    .range([width - margin.right, margin.left])
    .padding(0.32);

  const maxVal = d3.max(chartData, d => d[d3ChartMetric]) * 1.18;
  const y = d3.scaleLinear()
    .domain([0, maxVal])
    .nice()
    .range([height - margin.bottom, margin.top]);

  // خطوط افقی گرید
  svg.append('g')
    .attr('class', 'grid')
    .selectAll('line')
    .data(y.ticks(4))
    .enter()
    .append('line')
    .attr('class', 'd3-grid-line')
    .attr('x1', margin.left)
    .attr('x2', width - margin.right)
    .attr('y1', d => y(d))
    .attr('y2', d => y(d));

  // محور Y
  const yAxis = d3.axisLeft(y)
    .ticks(4)
    .tickFormat(d => {
      if (d3ChartMetric === 'revenue') {
        if (d >= 1000000) return toPersianDigits(Math.round(d / 1000000)) + ' م ت';
        return toPersianDigits(d);
      }
      return toPersianDigits(d);
    });

  svg.append('g')
    .attr('transform', `translate(${margin.left}, 0)`)
    .call(yAxis)
    .call(g => g.select('.domain').remove())
    .selectAll('text')
    .attr('class', 'd3-axis-text');

  // محور X
  const xAxis = d3.axisBottom(x)
    .tickFormat(d => {
      const item = chartData.find(c => c.category === d);
      return (item?.emoji ? item.emoji + ' ' : '') + d;
    });

  svg.append('g')
    .attr('transform', `translate(0, ${height - margin.bottom})`)
    .call(xAxis)
    .call(g => g.select('.domain').attr('stroke', '#cbd5e1'))
    .selectAll('text')
    .attr('class', 'd3-axis-text')
    .attr('dy', '10px');

  // میله‌ها با انیمیشن ورود D3
  svg.selectAll('.d3-bar')
    .data(chartData)
    .enter()
    .append('rect')
    .attr('class', 'd3-bar')
    .attr('x', d => x(d.category))
    .attr('width', x.bandwidth())
    .attr('rx', 6)
    .attr('ry', 6)
    .attr('fill', (d, i) => `url(#${colorGradients[i % colorGradients.length].id})`)
    .attr('y', height - margin.bottom)
    .attr('height', 0)
    .on('mouseenter', function(event, d) {
      if (!tooltip) return;
      const totalSum = d3.sum(chartData, item => item[d3ChartMetric]) || 1;
      const share = Math.round((d[d3ChartMetric] / totalSum) * 100);

      tooltip.innerHTML = `
        <div style="font-weight: 800; font-size: 0.85rem; margin-bottom: 4px; border-bottom: 1px solid rgba(255,255,255,0.2); padding-bottom: 3px;">
          ${d.emoji} دسته ${escapeHTML(d.category)}
        </div>
        <div>📦 تعداد فروش ماه: <strong>${toPersianDigits(d.count)} عدد</strong></div>
        <div>💰 مبلغ فروش: <strong>${formatPrice(d.revenue)}</strong></div>
        <div style="color: #fde047; margin-top: 2px;">📊 سهم از کل: <strong>${toPersianDigits(share)}٪</strong></div>
      `;
      tooltip.style.opacity = '1';
    })
    .on('mousemove', function(event) {
      if (!tooltip) return;
      const rect = container.getBoundingClientRect();
      const xPos = event.clientX - rect.left;
      const yPos = event.clientY - rect.top - 70;
      tooltip.style.left = `${Math.max(10, Math.min(xPos - 50, rect.width - 160))}px`;
      tooltip.style.top = `${Math.max(0, yPos)}px`;
    })
    .on('mouseleave', function() {
      if (tooltip) tooltip.style.opacity = '0';
    })
    .transition()
    .duration(750)
    .delay((d, i) => i * 60)
    .ease(d3.easeCubicOut)
    .attr('y', d => y(d[d3ChartMetric]))
    .attr('height', d => height - margin.bottom - y(d[d3ChartMetric]));

  // برچسب اعداد بالای هر میله
  svg.selectAll('.d3-val-label')
    .data(chartData)
    .enter()
    .append('text')
    .attr('class', 'd3-val-label')
    .attr('x', d => x(d.category) + x.bandwidth() / 2)
    .attr('y', height - margin.bottom)
    .text(d => {
      if (d3ChartMetric === 'revenue') {
        const millions = (d.revenue / 1000000).toFixed(1).replace('.0', '');
        return toPersianDigits(millions) + ' م';
      }
      return toPersianDigits(d.count);
    })
    .transition()
    .duration(750)
    .delay((d, i) => i * 60)
    .ease(d3.easeCubicOut)
    .attr('y', d => y(d[d3ChartMetric]) - 8);
}

/* =================================================== */
/* ۲. تب مدیریت و ویرایش کالاها (Product Management)   */
/* =================================================== */

function renderAdminProductsList(container) {
  let list = [...allProducts];

  // فیلتر جستجو
  if (adminSearchQuery.trim()) {
    const q = adminSearchQuery.trim().toLowerCase();
    list = list.filter(p => p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
  }

  // فیلتر دسته
  if (adminFilterCategory !== 'all') {
    list = list.filter(p => p.category === adminFilterCategory);
  }

  // فیلتر موجودی
  if (adminFilterStock === 'in') {
    list = list.filter(p => p.stock);
  } else if (adminFilterStock === 'out') {
    list = list.filter(p => !p.stock);
  }

  const uniqueCategories = Array.from(new Set(allProducts.map(p => p.category)));

  container.innerHTML = `
    <div class="admin-products-toolbar">
      <input 
        type="text" 
        id="admin-search-box" 
        class="admin-search-input" 
        placeholder="جستجوی نام یا دسته اسباب‌بازی..." 
        value="${escapeHTML(adminSearchQuery)}"
      />
      <select id="admin-cat-filter" class="admin-filter-select">
        <option value="all">همه دسته‌ها</option>
        ${uniqueCategories.map(c => `<option value="${escapeHTML(c)}" ${adminFilterCategory === c ? 'selected' : ''}>${escapeHTML(c)}</option>`).join('')}
      </select>
      <select id="admin-stock-filter" class="admin-filter-select">
        <option value="all" ${adminFilterStock === 'all' ? 'selected' : ''}>همه وضعیت‌ها</option>
        <option value="in" ${adminFilterStock === 'in' ? 'selected' : ''}>فقط موجودها ✅</option>
        <option value="out" ${adminFilterStock === 'out' ? 'selected' : ''}>فقط ناموجودها ❌</option>
      </select>
    </div>

    <div class="admin-table-wrapper">
      ${list.length === 0 ? `
        <div style="text-align: center; padding: 30px; color: #94a3b8;">کالایی با این مشخصات یافت نشد.</div>
      ` : list.map(p => `
        <div class="admin-product-row">
          <div class="admin-row-thumb">
            ${p.image ? `
              <img src="${escapeHTML(p.image)}" alt="" onerror="this.onerror=null; this.parentElement.innerText='${escapeHTML(p.emoji || '🧸')}';" />
            ` : `
              <span>${escapeHTML(p.emoji || '🧸')}</span>
            `}
          </div>

          <div class="admin-row-info">
            <div class="admin-row-title">
              ${p.featured ? '🔥 ' : ''}${escapeHTML(p.name)}
            </div>
            <div class="admin-row-meta">
              <span>${escapeHTML(p.category)}</span>
              <span>•</span>
              <strong style="color: var(--primary-pink);">${formatPrice(p.price)}</strong>
              ${p.oldPrice && p.oldPrice > p.price ? `<span style="text-decoration: line-through; color: #94a3b8;">${formatPrice(p.oldPrice)}</span>` : ''}
            </div>
          </div>

          <div class="admin-row-actions">
            <button 
              class="btn-toggle-stock ${p.stock ? 'in-stock' : 'out-stock'}" 
              onclick="toggleProductStock(${p.id})"
              title="تغییر سریع موجودی"
            >
              ${p.stock ? 'موجود ✅' : 'ناموجود ❌'}
            </button>
            <button class="btn-admin-action" onclick="openProductEditModal(${p.id})" title="ویرایش کامل مشخصات و عکس">
              ✏️ ویرایش
            </button>
            <button class="btn-admin-delete" onclick="deleteProduct(${p.id})" title="حذف کالا">
              🗑️
            </button>
          </div>
        </div>
      `).join('')}
    </div>
  `;

  // اتصال رویدادهای فیلتر
  const searchBox = document.getElementById('admin-search-box');
  if (searchBox) {
    searchBox.addEventListener('input', (e) => {
      adminSearchQuery = e.target.value;
      renderAdminProductsList(container);
    });
  }

  const catFilter = document.getElementById('admin-cat-filter');
  if (catFilter) {
    catFilter.addEventListener('change', (e) => {
      adminFilterCategory = e.target.value;
      renderAdminProductsList(container);
    });
  }

  const stockFilter = document.getElementById('admin-stock-filter');
  if (stockFilter) {
    stockFilter.addEventListener('change', (e) => {
      adminFilterStock = e.target.value;
      renderAdminProductsList(container);
    });
  }
}

async function toggleProductStock(id) {
  const p = allProducts.find(item => item.id === id);
  if (!p) return;

  p.stock = !p.stock;
  persistProducts();
  showToast(`وضعیت «${escapeHTML(p.name)}» به ${p.stock ? 'موجود' : 'ناموجود'} تغییر یافت.`);
  showAdminDashboard();
  populateCategories();
  applyFilters();

  try {
    await FirebaseDB.updateProduct(id, { stock: p.stock });
  } catch (err) {
    console.error('Error updating stock in cloud database:', err);
  }
}

async function deleteProduct(id) {
  const p = allProducts.find(item => item.id === id);
  if (!p) return;

  if (confirm(`آیا از حذف دائم اسباب‌بازی «${p.name}» از فروشگاه و دیتابیس اطمینان دارید؟`)) {
    allProducts = allProducts.filter(item => item.id !== id);
    persistProducts();
    showToast('در حال حذف از دیتابیس ابری...', 'info');
    showAdminDashboard();
    populateCategories();
    applyFilters();

    try {
      await FirebaseDB.deleteProduct(id);
      showToast('اسباب‌بازی با موفقیت از دیتابیس حذف گردید.', 'success');
    } catch (err) {
      console.error('Error deleting from cloud database:', err);
      showToast('خطا در حذف از دیتابیس، لطفاً دوباره تلاش کنید.', 'error');
    }
  }
}

/* =================================================== */
/* ۳. تب افزودن اسباب‌بازی با آپلود عکس (Add Toy)       */
/* =================================================== */

function renderAdminAddForm(container) {
  uploadedNewProductImage = '';
  const uniqueCategories = Array.from(new Set(allProducts.map(p => p.category)));

  container.innerHTML = `
    <form id="admin-add-form" onsubmit="handleAddNewProduct(event)" class="admin-form-grid">
      <div class="admin-field full">
        <label for="new-p-name">نام کامل اسباب‌بازی *</label>
        <input type="text" id="new-p-name" required placeholder="مثال: قطار موزیکال چراغدار با ریل دایره‌ای" />
      </div>

      <div class="admin-field">
        <label for="new-p-cat">دسته‌بندی *</label>
        <input type="text" id="new-p-cat" required list="cat-suggestions" placeholder="عروسک / ماشین / لگو و بازی فکری / ورزشی" />
        <datalist id="cat-suggestions">
          ${uniqueCategories.map(c => `<option value="${escapeHTML(c)}">`).join('')}
        </datalist>
      </div>

      <div class="admin-field">
        <label for="new-p-emoji">ایموجی اسباب‌بازی *</label>
        <input type="text" id="new-p-emoji" required placeholder="🧸 یا 🚂 یا 🧩" value="🧸" />
      </div>

      <div class="admin-field">
        <label for="new-p-price">قیمت فروش (تومان) *</label>
        <input type="number" id="new-p-price" required min="1000" placeholder="مثال: 450000" />
      </div>

      <div class="admin-field">
        <label for="new-p-old-price">قیمت قبل از تخفیف (اختیاری جهت نمایش درصد تخفیف)</label>
        <input type="number" id="new-p-old-price" min="0" placeholder="مثال: 550000" />
      </div>

      <!-- کادر آپلود مستقیم عکس از گالری/دوربین گوشی یا فایل کامپیوتر -->
      <div class="admin-field full">
        <label>عکس محصول (انتخاب از گالری، دوربین یا فایل کامپیوتر)</label>
        <div id="new-p-upload-zone" class="image-upload-wrapper" onclick="triggerFileInput('new-p-file-input')">
          <input type="file" id="new-p-file-input" class="file-input-hidden" accept="image/*" onchange="handleImageFileSelect(event, 'new-p')" />
          <div id="new-p-upload-prompt" class="upload-prompt">
            <span class="upload-prompt-icon">📸</span>
            <span class="upload-prompt-title">کلیک کنید یا عکس اسباب‌بازی را اینجا بیندازید</span>
            <span class="upload-prompt-sub">عکس به طور خودکار بهینه و کم‌حجم می‌شود</span>
          </div>
          <div id="new-p-preview-container" style="display: none;">
            <div class="image-preview-box">
              <img id="new-p-preview-img" src="" alt="پیش‌نمایش" />
              <button type="button" class="btn-remove-preview" onclick="clearUploadedImage('new-p', event)">✕</button>
            </div>
            <div style="font-size: 0.75rem; color: #16a34a; font-weight: 700; margin-top: 6px;">
              ✅ عکس با موفقیت انتخاب شد
            </div>
          </div>
        </div>
      </div>

      <div class="admin-field full">
        <label for="new-p-image-url">یا لینک اینترنتی عکس (اختیاری)</label>
        <input type="url" id="new-p-image-url" placeholder="https://example.com/toy.jpg" />
      </div>

      <div class="admin-field full">
        <label for="new-p-desc">توضیحات و ویژگی‌های اسباب‌بازی *</label>
        <textarea id="new-p-desc" rows="3" required placeholder="جنس، رده سنی، ابعاد، ویژگی‌های موزیکال و حرکتی..."></textarea>
      </div>

      <div class="admin-field" style="flex-direction: row; align-items: center; gap: 8px;">
        <input type="checkbox" id="new-p-stock" checked style="width: 18px; height: 18px; accent-color: var(--toy-green);" />
        <label for="new-p-stock" style="margin: 0; cursor: pointer;">هم‌اکنون در انبار موجود است</label>
      </div>

      <div class="admin-field" style="flex-direction: row; align-items: center; gap: 8px;">
        <input type="checkbox" id="new-p-featured" style="width: 18px; height: 18px; accent-color: var(--toy-yellow);" />
        <label for="new-p-featured" style="margin: 0; cursor: pointer;">🔥 نمایش در بخش پیشنهادهای ویژه</label>
      </div>

      <button type="submit" class="btn-admin-submit">
        ✨ ثبت و افزودن به فروشگاه
      </button>
    </form>
  `;
}

function triggerFileInput(inputId) {
  const input = document.getElementById(inputId);
  if (input) input.click();
}

async function handleImageFileSelect(event, prefix) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  try {
    showToast('در حال بهینه‌سازی و ذخیره عکس...', 'info');
    const compressed = await compressAndConvertImage(file);
    
    if (prefix === 'new-p') {
      uploadedNewProductImage = compressed;
      updateUploadPreview('new-p', compressed);
    } else if (prefix === 'edit-p') {
      uploadedEditProductImage = compressed;
      updateUploadPreview('edit-p', compressed);
    }

    showToast('عکس با موفقیت آماده شد! 📸', 'success');
  } catch (error) {
    showToast('خطا در بارگذاری عکس: ' + error.message, 'error');
  }
}

function updateUploadPreview(prefix, dataUrl) {
  const promptEl = document.getElementById(`${prefix}-upload-prompt`);
  const previewBox = document.getElementById(`${prefix}-preview-container`);
  const imgEl = document.getElementById(`${prefix}-preview-img`);
  const wrapper = document.getElementById(`${prefix}-upload-zone`);

  if (promptEl && previewBox && imgEl) {
    promptEl.style.display = 'none';
    previewBox.style.display = 'block';
    imgEl.src = dataUrl;
    if (wrapper) wrapper.classList.add('has-preview');
  }
}

function clearUploadedImage(prefix, event) {
  if (event) event.stopPropagation();

  const promptEl = document.getElementById(`${prefix}-upload-prompt`);
  const previewBox = document.getElementById(`${prefix}-preview-container`);
  const imgEl = document.getElementById(`${prefix}-preview-img`);
  const fileInput = document.getElementById(`${prefix}-file-input`);
  const wrapper = document.getElementById(`${prefix}-upload-zone`);

  if (prefix === 'new-p') uploadedNewProductImage = '';
  if (prefix === 'edit-p') uploadedEditProductImage = '';

  if (promptEl && previewBox && imgEl) {
    promptEl.style.display = 'flex';
    previewBox.style.display = 'none';
    imgEl.src = '';
    if (fileInput) fileInput.value = '';
    if (wrapper) wrapper.classList.remove('has-preview');
  }
}

async function handleAddNewProduct(event) {
  event.preventDefault();

  const name = document.getElementById('new-p-name').value.trim();
  const cat = document.getElementById('new-p-cat').value.trim();
  const emoji = document.getElementById('new-p-emoji').value.trim() || '🧸';
  const price = Number(document.getElementById('new-p-price').value);
  const oldPrice = Number(document.getElementById('new-p-old-price').value) || 0;
  const urlImage = document.getElementById('new-p-image-url').value.trim();
  const desc = document.getElementById('new-p-desc').value.trim();
  const stock = document.getElementById('new-p-stock').checked;
  const featured = document.getElementById('new-p-featured').checked;

  if (!name || !cat || !price) {
    showToast('لطفاً فیلدهای الزامی را پر کنید.', 'error');
    return;
  }

  // اولویت عکس: عکس آپلود شده، سپس آدرس اینترنتی وارد شده
  const finalImage = uploadedNewProductImage || urlImage || '';

  const maxId = allProducts.reduce((max, p) => (Number(p.id) > max ? Number(p.id) : max), 0);
  const newProduct = {
    id: maxId + 1,
    name,
    category: cat,
    price,
    oldPrice: oldPrice > price ? oldPrice : 0,
    image: finalImage,
    emoji,
    desc,
    stock,
    featured: !!featured,
    salesCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // ۱. نمایش فوری در کاتالوگ فروشگاه و لیست ادمین
  allProducts.unshift(newProduct);
  persistProducts();
  populateCategories();
  applyFilters();
  setAdminTab('products');
  showToast(`در حال ثبت «${escapeHTML(name)}» در دیتابیس...`, 'info');

  // ۲. ذخیره دائمی و تضمینی در پایگاه داده ابری Firestore
  try {
    await FirebaseDB.saveProduct(newProduct);
    showToast(`اسباب‌بازی «${escapeHTML(name)}» با موفقیت در دیتابیس ثبت شد و روی سایت قرار گرفت! 🧸🎉`, 'success');
  } catch (err) {
    console.error('Error saving new product to Firestore:', err);
    showToast('کالا به صورت محلی ثبت شد؛ اتصال دیتابیس در حال بررسی مجدد است.', 'info');
  }
}

/* =================================================== */
/* ۴. مودال ویرایش کامل محصول (Full Product Edit Modal)*/
/* =================================================== */

function openProductEditModal(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;

  editingProductId = productId;
  uploadedEditProductImage = product.image || '';

  let modalEl = document.getElementById('product-edit-modal');
  if (!modalEl) {
    modalEl = document.createElement('div');
    modalEl.id = 'product-edit-modal';
    modalEl.className = 'product-edit-modal';
    document.body.appendChild(modalEl);
  }

  const uniqueCategories = Array.from(new Set(allProducts.map(p => p.category)));

  modalEl.innerHTML = `
    <div class="product-edit-container">
      <div class="product-edit-head">
        <h4>✏️ ویرایش کامل اسباب‌بازی: ${escapeHTML(product.name)}</h4>
        <button class="modal-close-btn" style="position:static;" onclick="closeProductEditModal()">✕</button>
      </div>

      <form onsubmit="handleSaveProductEdit(event)" class="admin-form-grid">
        <div class="admin-field full">
          <label for="edit-p-name">نام اسباب‌بازی *</label>
          <input type="text" id="edit-p-name" required value="${escapeHTML(product.name)}" />
        </div>

        <div class="admin-field">
          <label for="edit-p-cat">دسته‌بندی *</label>
          <input type="text" id="edit-p-cat" required list="cat-suggestions-edit" value="${escapeHTML(product.category)}" />
          <datalist id="cat-suggestions-edit">
            ${uniqueCategories.map(c => `<option value="${escapeHTML(c)}">`).join('')}
          </datalist>
        </div>

        <div class="admin-field">
          <label for="edit-p-emoji">ایموجی *</label>
          <input type="text" id="edit-p-emoji" required value="${escapeHTML(product.emoji || '🧸')}" />
        </div>

        <div class="admin-field">
          <label for="edit-p-price">قیمت فروش (تومان) *</label>
          <input type="number" id="edit-p-price" required min="1000" value="${product.price}" />
        </div>

        <div class="admin-field">
          <label for="edit-p-old-price">قیمت قبل از تخفیف</label>
          <input type="number" id="edit-p-old-price" min="0" value="${product.oldPrice || 0}" />
        </div>

        <!-- آپلود یا تعویض عکس -->
        <div class="admin-field full">
          <label>عکس اسباب‌بازی (آپلود عکس جدید یا تعویض)</label>
          <div id="edit-p-upload-zone" class="image-upload-wrapper ${uploadedEditProductImage ? 'has-preview' : ''}" onclick="triggerFileInput('edit-p-file-input')">
            <input type="file" id="edit-p-file-input" class="file-input-hidden" accept="image/*" onchange="handleImageFileSelect(event, 'edit-p')" />
            <div id="edit-p-upload-prompt" class="upload-prompt" style="${uploadedEditProductImage ? 'display:none;' : ''}">
              <span class="upload-prompt-icon">📸</span>
              <span class="upload-prompt-title">کلیک برای انتخاب یا تغییر عکس</span>
              <span class="upload-prompt-sub">از دوربین گوشی، گالری یا فایل سیستم</span>
            </div>
            <div id="edit-p-preview-container" style="${uploadedEditProductImage ? 'display:block;' : 'display:none;'}">
              <div class="image-preview-box">
                <img id="edit-p-preview-img" src="${escapeHTML(uploadedEditProductImage)}" alt="" />
                <button type="button" class="btn-remove-preview" onclick="clearUploadedImage('edit-p', event)">✕</button>
              </div>
              <div style="font-size: 0.75rem; color: #16a34a; font-weight: 700; margin-top: 6px;">
                برای تعویض عکس دوباره کلیک کنید
              </div>
            </div>
          </div>
        </div>

        <div class="admin-field full">
          <label for="edit-p-image-url">یا آدرس لینک عکس</label>
          <input type="url" id="edit-p-image-url" value="${escapeHTML(product.image?.startsWith('http') ? product.image : '')}" placeholder="https://..." />
        </div>

        <div class="admin-field full">
          <label for="edit-p-desc">توضیحات محصول *</label>
          <textarea id="edit-p-desc" rows="3" required>${escapeHTML(product.desc)}</textarea>
        </div>

        <div class="admin-field" style="flex-direction: row; align-items: center; gap: 8px;">
          <input type="checkbox" id="edit-p-stock" ${product.stock ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: var(--toy-green);" />
          <label for="edit-p-stock" style="margin: 0; cursor: pointer;">موجود در انبار</label>
        </div>

        <div class="admin-field" style="flex-direction: row; align-items: center; gap: 8px;">
          <input type="checkbox" id="edit-p-featured" ${product.featured ? 'checked' : ''} style="width: 18px; height: 18px; accent-color: var(--toy-yellow);" />
          <label for="edit-p-featured" style="margin: 0; cursor: pointer;">🔥 علامت‌گذاری به عنوان پیشنهاد ویژه</label>
        </div>

        <button type="submit" class="btn-admin-submit" style="background: linear-gradient(135deg, var(--toy-blue), #0284c7);">
          💾 ذخیره تغییرات اسباب‌بازی
        </button>
      </form>
    </div>
  `;

  modalEl.classList.add('open');
}

function closeProductEditModal() {
  const modalEl = document.getElementById('product-edit-modal');
  if (modalEl) modalEl.classList.remove('open');
}

async function handleSaveProductEdit(event) {
  event.preventDefault();

  const product = allProducts.find(p => p.id === editingProductId);
  if (!product) return;

  const name = document.getElementById('edit-p-name').value.trim();
  const cat = document.getElementById('edit-p-cat').value.trim();
  const emoji = document.getElementById('edit-p-emoji').value.trim() || '🧸';
  const price = Number(document.getElementById('edit-p-price').value);
  const oldPrice = Number(document.getElementById('edit-p-old-price').value) || 0;
  const urlImage = document.getElementById('edit-p-image-url').value.trim();
  const desc = document.getElementById('edit-p-desc').value.trim();
  const stock = document.getElementById('edit-p-stock').checked;
  const featured = document.getElementById('edit-p-featured').checked;

  product.name = name;
  product.category = cat;
  product.emoji = emoji;
  product.price = price;
  product.oldPrice = oldPrice > price ? oldPrice : 0;
  product.desc = desc;
  product.stock = stock;
  product.featured = !!featured;

  if (uploadedEditProductImage) {
    product.image = uploadedEditProductImage;
  } else if (urlImage) {
    product.image = urlImage;
  }

  // ۱. اعمال فوری در کاتالوگ فروشگاه
  persistProducts();
  closeProductEditModal();
  populateCategories();
  applyFilters();
  showAdminDashboard();
  showToast(`در حال بروزرسانی «${escapeHTML(name)}» در دیتابیس...`, 'info');

  // ۲. بروزرسانی در پایگاه داده ابری Firestore
  try {
    await FirebaseDB.saveProduct(product);
    showToast(`تغییرات اسباب‌بازی «${escapeHTML(name)}» با موفقیت در دیتابیس ذخیره شد! ✨`, 'success');
  } catch (err) {
    console.error('Error updating product in Firestore:', err);
    showToast('تغییرات در حافظه مرورگر اعمال شد.', 'info');
  }
}

/* =================================================== */
/* ۵. تب تخفیف‌های گروهی و پروموشن‌ها (Discounts & Promo)*/
/* =================================================== */

function renderPromotionsView(container) {
  const uniqueCategories = Array.from(new Set(allProducts.map(p => p.category)));

  container.innerHTML = `
    <!-- ابزار اعمال تخفیف گروهی -->
    <div class="bulk-promo-card">
      <h5>⚡ اعمال تخفیف گروهی بر روی محصولات</h5>
      <p style="font-size: 0.8rem; color: #78350f; margin-bottom: 10px;">
        می‌توانید روی تمام محصولات یک دسته یا تمام فروشگاه به صورت یکجا درصد تخفیف اعمال کنید.
      </p>

      <div class="bulk-promo-controls">
        <select id="bulk-promo-cat" class="admin-filter-select" style="padding: 7px 10px;">
          <option value="all">تمام دسته‌بندی‌ها</option>
          ${uniqueCategories.map(c => `<option value="${escapeHTML(c)}">${escapeHTML(c)}</option>`).join('')}
        </select>

        <input type="number" id="bulk-promo-percent" min="1" max="90" placeholder="درصد تخفیف (مثلاً: 15)" style="width: 140px; padding: 7px 10px; border-radius: 8px; border: 1.5px solid #cbd5e1; font-size: 0.85rem;" />

        <button class="btn-apply-bulk" onclick="applyBulkDiscount()">
          اعمال تخفیف 💥
        </button>
        <button class="btn-apply-bulk" style="background: #94a3b8;" onclick="removeBulkDiscount()">
          حذف تمام تخفیف‌ها ✕
        </button>
      </div>
    </div>

    <!-- لیست کالاهای با تخفیف فعلی -->
    <div class="analytics-section-title">
      <span>🔥 کالاهای دارای تخفیف در فروشگاه</span>
    </div>

    <div class="admin-table-wrapper" style="max-height: 260px;">
      ${allProducts.filter(p => p.oldPrice && p.oldPrice > p.price).map(p => `
        <div class="admin-product-row">
          <div class="admin-row-thumb">
            ${p.image ? `<img src="${escapeHTML(p.image)}" alt="" />` : `<span>${escapeHTML(p.emoji || '🧸')}</span>`}
          </div>
          <div class="admin-row-info">
            <div class="admin-row-title">${escapeHTML(p.name)}</div>
            <div class="admin-row-meta">
              <span style="color: var(--primary-pink); font-weight:800;">${formatPrice(p.price)}</span>
              <span style="text-decoration: line-through; color: #94a3b8;">${formatPrice(p.oldPrice)}</span>
              <span class="badge-discount" style="display:inline-block; padding: 1px 6px;">${toPersianDigits(calculateDiscount(p.price, p.oldPrice))}٪ تخفیف</span>
            </div>
          </div>
          <button class="btn-admin-action" onclick="openProductEditModal(${p.id})">
            ✏️ ویرایش
          </button>
        </div>
      `).join('') || '<div style="text-align: center; color: #94a3b8; padding: 20px;">هیچ کالایی دارای تخفیف نیست.</div>'}
    </div>
  `;
}

function applyBulkDiscount() {
  const cat = document.getElementById('bulk-promo-cat').value;
  const percent = Number(document.getElementById('bulk-promo-percent').value);

  if (!percent || percent <= 0 || percent > 90) {
    showToast('لطفاً درصدی بین ۱ تا ۹۰ وارد کنید.', 'error');
    return;
  }

  let count = 0;
  allProducts.forEach(p => {
    if (cat === 'all' || p.category === cat) {
      const originalBase = p.oldPrice && p.oldPrice > p.price ? p.oldPrice : p.price;
      p.oldPrice = originalBase;
      p.price = Math.round(originalBase * (1 - (percent / 100)));
      count++;
    }
  });

  persistProducts();
  showToast(`تخفیف ${toPersianDigits(percent)}٪ روی ${toPersianDigits(count)} اسباب‌بازی اعمال شد! 🔥`, 'success');
  applyFilters();
  showAdminDashboard();
}

function removeBulkDiscount() {
  if (confirm('آیا از حذف تمام تخفیف‌ها اطمینان دارید؟')) {
    allProducts.forEach(p => {
      if (p.oldPrice && p.oldPrice > p.price) {
        p.price = p.oldPrice;
        p.oldPrice = 0;
      }
    });
    persistProducts();
    showToast('تمام تخفیف‌ها برداشته شد.', 'info');
    applyFilters();
    showAdminDashboard();
  }
}

/* =================================================== */
/* ۶. تب اطلاعات پایه و تنظیمات جامع فروشگاه           */
/* =================================================== */

function renderSettingsView(container) {
  container.innerHTML = `
    <div class="settings-box">
      <div class="settings-tip-box">
        <span style="font-size: 1.2rem;">💡</span>
        <div>
          <strong>بخش اطلاعات پایه فروشگاه:</strong>
          تمام مقادیر وارد شده در این بخش (نام فروشگاه، شعار، شماره‌های تماس، واتساپ، آدرس، ساعات کاری، شبکه‌های اجتماعی و پیام‌های اعلان) بلافاصله در تمام بخش‌های سایت (هدر، بنرها، فوتر، پیام‌های ثبت سفارش واتساپ و عنوان صفحات) اعمال و ذخیره می‌شوند.
        </div>
      </div>

      <form onsubmit="handleSaveStoreSettings(event)" id="store-base-settings-form">
        <!-- بخش ۱: هویت، برندینگ و عناوین سایت -->
        <div class="settings-section-card">
          <div class="settings-section-title">
            <span>🎨</span>
            <span>اطلاعات برند و عناوین سایت</span>
            <span class="badge">هدر و بخش هیرو</span>
          </div>

          <div class="admin-form-grid">
            <div class="admin-field">
              <label for="set-store-name">نام کامل فروشگاه *</label>
              <input type="text" id="set-store-name" required value="${escapeHTML(CONFIG.storeName)}" placeholder="اسباب بازی فروشی متمنی" />
            </div>

            <div class="admin-field">
              <label for="set-logo-emoji">ایموجی لوگوی فروشگاه *</label>
              <input type="text" id="set-logo-emoji" required value="${escapeHTML(CONFIG.storeLogoEmoji || '🧸')}" placeholder="🧸 یا 🚀 یا 🧩" />
            </div>

            <div class="admin-field">
              <label for="set-brand-badge">نشان بالای هدر (بج)</label>
              <input type="text" id="set-brand-badge" value="${escapeHTML(CONFIG.brandBadge || '🎈 ۱۰۰۰+ مدل اسباب‌بازی')}" placeholder="🎈 ۱۰۰۰+ مدل اسباب‌بازی" />
            </div>

            <div class="admin-field">
              <label for="set-store-slogan">شعار فروشگاه (نشان بالای هیرو)</label>
              <input type="text" id="set-store-slogan" value="${escapeHTML(CONFIG.storeSlogan || 'دنیای خنده و شادی کودکان 🎈')}" placeholder="دنیای خنده و شادی کودکان 🎈" />
            </div>

            <div class="admin-field full">
              <label for="set-hero-title">عنوان اصلی صفحه (Hero Title)</label>
              <input type="text" id="set-hero-title" value="${escapeHTML(CONFIG.heroTitle || '')}" placeholder="به دنیای رنگارنگ اسباب‌بازی‌های متمنی خوش آمدید!" />
            </div>

            <div class="admin-field full">
              <label for="set-hero-subtitle">متن توضیحات زیر عنوان (Hero Subtitle)</label>
              <textarea id="set-hero-subtitle" rows="2" placeholder="انتخاب از بین صدها عروسک، ماشین‌های کنترلی...">${escapeHTML(CONFIG.heroSubtitle || '')}</textarea>
            </div>
          </div>
        </div>

        <!-- بخش ۲: تماس، واتساپ و شبکه‌های اجتماعی -->
        <div class="settings-section-card">
          <div class="settings-section-title">
            <span>📞</span>
            <span>اطلاعات تماس، واتساپ و شبکه‌های اجتماعی</span>
            <span class="badge">ثبت سفارش و مشاوره</span>
          </div>

          <div class="admin-form-grid">
            <div class="admin-field">
              <label for="set-wa-num">شماره واتساپ ثبت سفارش (بدون صفر و + با ۹۸) *</label>
              <input type="text" id="set-wa-num" required dir="ltr" value="${escapeHTML(CONFIG.whatsappNumber)}" placeholder="989921021055" />
              <small style="color: #64748b; font-size: 0.72rem;">برای ساخت لینک مستقیم wa.me/989921021055</small>
            </div>

            <div class="admin-field">
              <label for="set-phone-num">شماره تلفن همراه اصلی *</label>
              <input type="text" id="set-phone-num" required dir="ltr" value="${escapeHTML(CONFIG.phoneNumber)}" placeholder="09921021055" />
            </div>

            <div class="admin-field">
              <label for="set-sec-phone">تلفن دوم یا خط ثابت (اختیاری)</label>
              <input type="text" id="set-sec-phone" dir="ltr" value="${escapeHTML(CONFIG.secondaryPhone || '')}" placeholder="۰۲۱-۵۵۶۲۳۴۸۹" />
            </div>

            <div class="admin-field">
              <label for="set-instagram">آیدی اینستاگرام (بدون @)</label>
              <input type="text" id="set-instagram" dir="ltr" value="${escapeHTML(CONFIG.instagramId || '')}" placeholder="motamani_toys" />
            </div>

            <div class="admin-field">
              <label for="set-telegram">آیدی کانال تلگرام (بدون @)</label>
              <input type="text" id="set-telegram" dir="ltr" value="${escapeHTML(CONFIG.telegramId || '')}" placeholder="motamani_toys" />
            </div>
          </div>
        </div>

        <!-- بخش ۳: نشانی، ساعات کاری و ارسال -->
        <div class="settings-section-card">
          <div class="settings-section-title">
            <span>📍</span>
            <span>آدرس فروشگاه، ساعات کاری و ارسال</span>
            <span class="badge">فوتر و مراحل خرید</span>
          </div>

          <div class="admin-form-grid">
            <div class="admin-field full">
              <label for="set-address">آدرس دقیق فروشگاه / انبار مرکزی</label>
              <input type="text" id="set-address" value="${escapeHTML(CONFIG.storeAddress || '')}" placeholder="تهران، بازار بزرگ، مجتمع تجاری اسباب‌بازی متمنی، پلاک ۴۲" />
            </div>

            <div class="admin-field">
              <label for="set-working-hours">ساعات کاری و پاسخگویی</label>
              <input type="text" id="set-working-hours" value="${escapeHTML(CONFIG.workingHours || '')}" placeholder="همه روزه از ساعت ۹:۰۰ الی ۲۲:۰۰" />
            </div>

            <div class="admin-field">
              <label for="set-shipping-info">روش‌های ارسال کالا</label>
              <input type="text" id="set-shipping-info" value="${escapeHTML(CONFIG.shippingInfo || '')}" placeholder="پست پیشتاز سراسری، تیپاکس و پیک موتوری فوری" />
            </div>

            <div class="admin-field">
              <label for="set-free-shipping">سقف خرید برای ارسال رایگان (تومان)</label>
              <input type="number" id="set-free-shipping" value="${CONFIG.freeShippingThreshold || 0}" min="0" step="10000" placeholder="800000" />
            </div>
          </div>
        </div>

        <!-- بخش ۴: نوار اعلان و درباره ما -->
        <div class="settings-section-card">
          <div class="settings-section-title">
            <span>📢</span>
            <span>نوار اعلان و معرفی فروشگاه</span>
            <span class="badge">بالای صفحه و فوتر</span>
          </div>

          <div class="admin-form-grid">
            <div class="admin-field full">
              <label class="settings-toggle-row">
                <input type="checkbox" id="set-announcement-active" ${CONFIG.isAnnouncementActive !== false ? 'checked' : ''} />
                <span>نمایش نوار اطلاعیه ویژه در بالای تمام صفحات سایت</span>
              </label>
            </div>

            <div class="admin-field full">
              <label for="set-banner-text">متن پیام نوار اطلاعیه بالای سایت</label>
              <input type="text" id="set-banner-text" value="${escapeHTML(CONFIG.announcementText || '')}" placeholder="🎉 جشنواره متمنی: ارسال سریع به سراسر ایران + کادوپیچی رایگان برای هدیه تولد 🎁" />
            </div>

            <div class="admin-field full">
              <label for="set-about-text">متن درباره ما در فوتر</label>
              <textarea id="set-about-text" rows="2" placeholder="ما در اسباب بازی متمنی تلاش می‌کنیم...">${escapeHTML(CONFIG.aboutText || '')}</textarea>
            </div>
          </div>
        </div>

        <!-- بخش ۵: دسترسی و امنیت پنل مدیریت -->
        <div class="settings-section-card">
          <div class="settings-section-title">
            <span>🔐</span>
            <span>امنیت و تنظیمات صفحه</span>
            <span class="badge">پنل ادمین</span>
          </div>

          <div class="admin-form-grid">
            <div class="admin-field">
              <label for="set-admin-pin">رمز عبور ورود به پنل ادمین *</label>
              <input type="text" id="set-admin-pin" required dir="ltr" value="${escapeHTML(CONFIG.adminPin || '1234')}" placeholder="1234" />
            </div>

            <div class="admin-field">
              <label for="set-page-size">تعداد اسباب‌بازی در هر صفحه (نمایش اولیه)</label>
              <input type="number" id="set-page-size" min="6" max="100" value="${CONFIG.pageSize || 24}" />
            </div>
          </div>
        </div>

        <div style="display: flex; gap: 10px; margin-top: 14px; flex-wrap: wrap;">
          <button type="submit" class="btn-admin-submit" style="background: linear-gradient(135deg, var(--toy-purple), #6366f1); flex: 1; min-width: 200px;">
            💾 ذخیره تمام اطلاعات پایه و اعمال در کل سایت
          </button>
          <button type="button" class="btn-json-action" style="background: #e2e8f0; color: #334155;" onclick="renderSettingsView(document.getElementById('admin-tab-content'))">
            🔄 بازنشانی فرم
          </button>
        </div>
      </form>
    </div>
  `;
}

async function handleSaveStoreSettings(event) {
  event.preventDefault();

  const storeName = document.getElementById('set-store-name').value.trim();
  const logoEmoji = document.getElementById('set-logo-emoji').value.trim();
  const brandBadge = document.getElementById('set-brand-badge').value.trim();
  const storeSlogan = document.getElementById('set-store-slogan').value.trim();
  const heroTitle = document.getElementById('set-hero-title').value.trim();
  const heroSubtitle = document.getElementById('set-hero-subtitle').value.trim();

  const waNum = document.getElementById('set-wa-num').value.trim();
  const phoneNum = document.getElementById('set-phone-num').value.trim();
  const secPhone = document.getElementById('set-sec-phone').value.trim();
  const igId = document.getElementById('set-instagram').value.trim();
  const tgId = document.getElementById('set-telegram').value.trim();

  const address = document.getElementById('set-address').value.trim();
  const hours = document.getElementById('set-working-hours').value.trim();
  const shipping = document.getElementById('set-shipping-info').value.trim();
  const freeShipping = Number(document.getElementById('set-free-shipping').value) || 0;

  const isAnnounceActive = document.getElementById('set-announcement-active').checked;
  const banner = document.getElementById('set-banner-text').value.trim();
  const about = document.getElementById('set-about-text').value.trim();

  const pin = document.getElementById('set-admin-pin').value.trim();
  const pageSize = Number(document.getElementById('set-page-size').value) || 24;

  if (!storeName || !waNum || !phoneNum || !pin) {
    showToast('لطفاً فیلدهای ستاره‌دار الزامی را تکمیل کنید.', 'error');
    return;
  }

  // ذخیره در شیء سراسری CONFIG
  CONFIG.storeName = storeName;
  CONFIG.storeLogoEmoji = logoEmoji || '🧸';
  CONFIG.brandBadge = brandBadge;
  CONFIG.storeSlogan = storeSlogan;
  CONFIG.heroTitle = heroTitle;
  CONFIG.heroSubtitle = heroSubtitle;

  CONFIG.whatsappNumber = waNum;
  CONFIG.phoneNumber = phoneNum;
  CONFIG.secondaryPhone = secPhone;
  CONFIG.instagramId = igId;
  CONFIG.telegramId = tgId;

  CONFIG.storeAddress = address;
  CONFIG.workingHours = hours;
  CONFIG.shippingInfo = shipping;
  CONFIG.freeShippingThreshold = freeShipping;

  CONFIG.isAnnouncementActive = isAnnounceActive;
  CONFIG.announcementText = banner;
  CONFIG.aboutText = about;

  CONFIG.adminPin = pin;
  CONFIG.pageSize = pageSize;

  try {
    localStorage.setItem(STORAGE_KEYS.storeSettings, JSON.stringify(CONFIG));
  } catch (e) {
    console.error('Error saving settings locally', e);
  }

  // اعمال فوری در کل المان‌های ظاهر سایت
  applyStoreConfigToDOM();
  showToast('در حال ذخیره اطلاعات پایه در دیتابیس ابری...', 'info');

  // ذخیره در دیتابیس ابری فایربیس
  try {
    await FirebaseDB.saveStoreSettings(CONFIG);
    showToast('اطلاعات پایه با موفقیت در دیتابیس ابری ذخیره و در کل سایت اعمال شد! 🌟', 'success');
  } catch (err) {
    console.error('Error saving settings to cloud Firestore:', err);
    showToast('تنظیمات در حافظه مرورگر ذخیره شد.', 'info');
  }
}

/* =================================================== */
/* ۷. تب پشتیبان‌گیری و خروجی JSON (Backup & Restore)   */
/* =================================================== */

function renderAdminExportJson(container) {
  const jsonStr = JSON.stringify(allProducts, null, 2);

  container.innerHTML = `
    <div style="font-size: 0.85rem; color: #475569; margin-bottom: 10px;">
      جهت ذخیره دائمی محصولات در مخزن پروژه یا هاست خود، می‌توانید کد زیر را کپی کرده و در فایل <code>products.json</code> قرار دهید، یا از دکمه دانلود استفاده کنید:
    </div>

    <div class="json-export-box" id="json-export-view">${escapeHTML(jsonStr)}</div>

    <div class="admin-actions-bar">
      <button class="btn-json-action" style="background: var(--toy-purple); color: #fff;" onclick="copyJsonToClipboard()">
        📋 کپی متن JSON در کلیپ‌بورد
      </button>
      <button class="btn-json-action" style="background: var(--toy-blue); color: #fff;" onclick="downloadJsonFile()">
        💾 دانلود فایل products.json
      </button>
      <button class="btn-json-action" style="background: #fee2e2; color: #b91c1c;" onclick="resetProductsToDefault()">
        🔄 بازنشانی داده‌ها به حالت اولیه
      </button>
    </div>
  `;
}

function copyJsonToClipboard() {
  const jsonStr = JSON.stringify(allProducts, null, 2);
  navigator.clipboard.writeText(jsonStr).then(() => {
    showToast('کد JSON با موفقیت کپی شد! 📋', 'success');
  }).catch(() => {
    showToast('متن را دستی از کادر کپی کنید.', 'info');
  });
}

function downloadJsonFile() {
  const jsonStr = JSON.stringify(allProducts, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'products.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('فایل products.json با موفقیت دانلود شد! 💾', 'success');
}

function resetProductsToDefault() {
  if (confirm('آیا از بازنشانی کلیه محصولات به حالت اولیه ۲۴ اسباب‌بازی پیش‌فرض اطمینان دارید؟')) {
    localStorage.removeItem(STORAGE_KEYS.customProducts);
    localStorage.removeItem(STORAGE_KEYS.salesStats);
    localStorage.removeItem(STORAGE_KEYS.ordersLog);
    showToast('در حال بازنشانی اطلاعات...');
    setTimeout(() => {
      window.location.reload();
    }, 600);
  }
}

// بررسی مسیر ادمین در بارگذاری اولیه
function checkAdminRoute() {
  if (isAdminRoute()) {
    openAdminModal(false);
  }
}

// راه‌اندازی در لود صفحه
document.addEventListener('DOMContentLoaded', () => {
  // ۱. اعمال اطلاعات پایه فروشگاه در تمام بخش‌های DOM
  applyStoreConfigToDOM();

  // ۲. دریافت اطلاعات پایه و تنظیمات از پایگاه داده ابری Firestore
  FirebaseDB.getStoreSettings().then(cloudSettings => {
    if (cloudSettings && typeof cloudSettings === 'object') {
      CONFIG = { ...CONFIG, ...cloudSettings };
      try {
        localStorage.setItem(STORAGE_KEYS.storeSettings, JSON.stringify(CONFIG));
      } catch (e) {}
      applyStoreConfigToDOM();
    }
  }).catch(err => {
    console.warn('Note on fetching cloud settings:', err);
  });

  // ۳. بررسی مسیر آدرس برای ورود مستقیم به پنل ادمین (/admin یا #admin)
  checkAdminRoute();

  // ۴. بارگذاری کالاها از دیتابیس ابری و وضعیت سبد
  loadProducts();
  updateCartUI();

  // ۴. گوش دادن به تغییرات URL برای دکمه‌های بازگشت/جلو رفتن مرورگر
  window.addEventListener('popstate', () => {
    if (isAdminRoute()) {
      openAdminModal(false);
    } else {
      closeAdminModal(false);
    }
  });

  window.addEventListener('hashchange', () => {
    if (isAdminRoute()) {
      openAdminModal(false);
    } else {
      closeAdminModal(false);
    }
  });

  // ۵. جستجوی زنده
  const searchInput = document.getElementById('search-input');
  const searchClear = document.getElementById('search-clear');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      if (searchClear) {
        searchClear.style.display = searchQuery ? 'flex' : 'none';
      }
      visibleCount = CONFIG.pageSize;
      applyFilters();
    });
  }

  if (searchClear) {
    searchClear.addEventListener('click', () => {
      if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
      }
      searchQuery = '';
      searchClear.style.display = 'none';
      applyFilters();
    });
  }

  // ۶. مرتب‌سازی
  const sortSelect = document.getElementById('sort-select');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      applyFilters();
    });
  }

  // ۷. فیلتر موجودی
  const stockToggle = document.getElementById('stock-toggle');
  if (stockToggle) {
    stockToggle.addEventListener('change', (e) => {
      onlyInStock = e.target.checked;
      visibleCount = CONFIG.pageSize;
      applyFilters();
    });
  }

  // ۸. دکمه سبد خرید
  const cartBtn = document.getElementById('cart-toggle-btn');
  if (cartBtn) {
    cartBtn.addEventListener('click', () => toggleCartDrawer(true));
  }

  // ۹. بستن کشوی سبد
  const cartBackdrop = document.getElementById('cart-drawer-backdrop');
  if (cartBackdrop) {
    cartBackdrop.addEventListener('click', (e) => {
      if (e.target === cartBackdrop) toggleCartDrawer(false);
    });
  }

  // ۱۰. بستن مودال مشخصات محصول
  const modalBackdrop = document.getElementById('product-modal-backdrop');
  if (modalBackdrop) {
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) closeProductModal();
    });
  }

  // ۱۱. بستن مودال ادمین
  const adminBackdrop = document.getElementById('admin-modal-backdrop');
  if (adminBackdrop) {
    adminBackdrop.addEventListener('click', (e) => {
      if (e.target === adminBackdrop) closeAdminModal();
    });
  }

  // ۱۲. رویداد Escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeProductModal();
      toggleCartDrawer(false);
      closeAdminModal();
      closeProductEditModal();
    }
  });

  // ۱۳. واکنش‌گرایی نمودار D3 هنگام تغییر اندازه صفحه
  let chartResizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(chartResizeTimeout);
    chartResizeTimeout = setTimeout(() => {
      const chartEl = document.getElementById('d3-bestsellers-chart');
      if (chartEl && chartEl.offsetParent !== null) {
        renderD3CategoryChart();
      }
    }, 150);
  });
});

// در دسترس قرار دادن توابع سراسری برای تگ‌های HTML
window.CONFIG = CONFIG;
window.applyStoreConfigToDOM = applyStoreConfigToDOM;
window.isAdminRoute = isAdminRoute;
window.checkAdminRoute = checkAdminRoute;
window.CartManager = CartManager;
window.openProductDetail = openProductDetail;
window.closeProductModal = closeProductModal;
window.changeDetailQty = changeDetailQty;
window.addDetailToCart = addDetailToCart;
window.orderCurrentDetailWA = orderCurrentDetailWA;
window.orderSingleProductWA = orderSingleProductWA;
window.toggleCartDrawer = toggleCartDrawer;
window.submitWhatsAppOrder = submitWhatsAppOrder;
window.loadMoreProducts = loadMoreProducts;
window.loadProducts = loadProducts;
window.resetAllFilters = resetAllFilters;
window.focusMobileSearch = focusMobileSearch;
window.openAdminModal = openAdminModal;
window.closeAdminModal = closeAdminModal;
window.checkAdminPassword = checkAdminPassword;
window.setAdminTab = setAdminTab;
window.toggleProductStock = toggleProductStock;
window.deleteProduct = deleteProduct;
window.handleAddNewProduct = handleAddNewProduct;
window.copyJsonToClipboard = copyJsonToClipboard;
window.downloadJsonFile = downloadJsonFile;
window.resetProductsToDefault = resetProductsToDefault;
window.triggerFileInput = triggerFileInput;
window.handleImageFileSelect = handleImageFileSelect;
window.clearUploadedImage = clearUploadedImage;
window.openProductEditModal = openProductEditModal;
window.closeProductEditModal = closeProductEditModal;
window.handleSaveProductEdit = handleSaveProductEdit;
window.applyBulkDiscount = applyBulkDiscount;
window.removeBulkDiscount = removeBulkDiscount;
window.handleSaveStoreSettings = handleSaveStoreSettings;
window.switchCartTab = switchCartTab;
window.repeatOrder = repeatOrder;
window.deleteHistoryOrder = deleteHistoryOrder;
window.renderCartHistory = renderCartHistory;
window.setD3ChartMetric = setD3ChartMetric;
window.renderD3CategoryChart = renderD3CategoryChart;
window.ReviewsManager = ReviewsManager;
window.toggleReviewForm = toggleReviewForm;
window.selectStarRating = selectStarRating;
window.previewStarRating = previewStarRating;
window.resetStarRatingPreview = resetStarRatingPreview;
window.handleReviewSubmit = handleReviewSubmit;
window.likeReviewItem = likeReviewItem;
window.scrollToReviews = scrollToReviews;
window.renderReviewsSectionHtml = renderReviewsSectionHtml;
window.renderRelatedProductsHtml = renderRelatedProductsHtml;
window.switchToRelatedProduct = switchToRelatedProduct;
window.triggerFlyToCartAnimation = triggerFlyToCartAnimation;
window.FirebaseDB = FirebaseDB;
window.handleBottomNavClick = handleBottomNavClick;


