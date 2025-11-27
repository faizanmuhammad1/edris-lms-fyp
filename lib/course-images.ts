/**
 * Maps course categories to high-quality Unsplash images
 * Each category has multiple curated images that rotate based on course ID
 */

export interface CategoryImageMap {
    [key: string]: string[];
}

const categoryImages: CategoryImageMap = {
    Development: [
        "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=800&q=80", // Code on screen
        "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80", // Laptop coding
        "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80", // MacBook code
        "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80", // Developer workspace
    ],
    "Web Development": [
        "https://images.unsplash.com/photo-1547658719-da2b51169166?w=800&q=80", // Web design
        "https://images.unsplash.com/photo-1593720213428-28a5b9e94613?w=800&q=80", // HTML/CSS
        "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=800&q=80", // Web development
        "https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=800&q=80", // Coding laptop
    ],
    Business: [
        "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80", // Business meeting
        "https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=800&q=80", // Business person
        "https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=800&q=80", // Business analytics
        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80", // Business charts
    ],
    "Finance & Accounting": [
        "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80", // Finance charts
        "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&q=80", // Calculator
        "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80", // Financial data
        "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&q=80", // Stock market
    ],
    "IT & Software": [
        "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80", // Server room
        "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&q=80", // Technology
        "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&q=80", // Cybersecurity
        "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80", // Tech abstract
    ],
    Design: [
        "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80", // Design workspace
        "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&q=80", // Graphic design
        "https://images.unsplash.com/photo-1558655146-d09347e92766?w=800&q=80", // UI/UX design
        "https://images.unsplash.com/photo-1609921212029-bb5a28e60960?w=800&q=80", // Creative design
    ],
    Marketing: [
        "https://images.unsplash.com/photo-1533750349088-cd871a92f312?w=800&q=80", // Marketing strategy
        "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&q=80", // Team marketing
        "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80", // Marketing meeting
        "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&q=80", // Digital marketing
    ],
    "Health & Fitness": [
        "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80", // Fitness
        "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80", // Gym
        "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80", // Yoga
        "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&q=80", // Running
    ],
    Music: [
        "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&q=80", // Music studio
        "https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=800&q=80", // DJ equipment
        "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&q=80", // Piano
        "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80", // Guitar
    ],
    Programming: [
        "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=80", // Programming
        "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&q=80", // Code editor
        "https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=800&q=80", // Programming setup
        "https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=800&q=80", // Coding
    ],
    "Data Science": [
        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80", // Data analytics
        "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?w=800&q=80", // Machine learning
        "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&q=80", // Data visualization
        "https://images.unsplash.com/photo-1509228627152-72ae9ae6848d?w=800&q=80", // AI/ML
    ],
    Databases: [
        "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&q=80", // Database servers
        "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80", // Data center
        "https://images.unsplash.com/photo-1597852074816-d933c7d2b988?w=800&q=80", // Database concept
        "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=800&q=80", // Cloud database
    ],
    Backend: [
        "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80", // Server infrastructure
        "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&q=80", // Backend development
        "https://images.unsplash.com/photo-1566241440091-ec10de8db2e1?w=800&q=80", // API development
        "https://images.unsplash.com/photo-1551808525-51a94da548ce?w=800&q=80", // Cloud backend
    ],
    "Office Productivity": [
        "https://images.unsplash.com/photo-1497032628192-86f99bcd76bc?w=800&q=80", // Office workspace
        "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&q=80", // Productivity
        "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&q=80", // Office tools
        "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80", // Business productivity
    ],
    "Personal Development": [
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&q=80", // Personal growth
        "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&q=80", // Learning
        "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80", // Self improvement
        "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80", // Personal development
    ],
};

// Default fallback images for categories not in the map
const defaultImages = [
    "https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800&q=80", // Books/learning
    "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&q=80", // Education
    "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=80", // Study
    "https://images.unsplash.com/photo-1513258496099-48168024aec0?w=800&q=80", // Learning environment
];

/**
 * Get a high-quality Unsplash image URL for a course based on its category
 * @param category - The course category
 * @param courseId - The course ID (used to rotate through images)
 * @returns Unsplash image URL
 */
export function getCourseImage(category: string, courseId: string): string {
    const images = categoryImages[category] || defaultImages;

    // Use a simple hash of the courseId to select an image consistently
    const hash = courseId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const index = hash % images.length;

    return images[index];
}

/**
 * Get all available category names
 */
export function getAvailableCategories(): string[] {
    return Object.keys(categoryImages);
}
