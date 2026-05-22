import { Place } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/db";

const defaultHours = {
  mon: { open: "09:00", close: "22:00" },
  tue: { open: "09:00", close: "22:00" },
  wed: { open: "09:00", close: "22:00" },
  thu: { open: "09:00", close: "22:00" },
  fri: { open: "09:00", close: "23:00" },
  sat: { open: "10:00", close: "23:00" },
  sun: { open: "10:00", close: "21:00" },
};

const cafeHours = {
  ...defaultHours,
  mon: { open: "08:00", close: "22:00" },
};

const nightlifeHours = {
  thu: { open: "20:00", close: "03:00" },
  fri: { open: "20:00", close: "04:00" },
  sat: { open: "20:00", close: "04:00" },
};

type PlaceSeed = {
  name: string;
  description: string;
  category: string;
  vibes: string[];
  lat: number;
  lng: number;
  address: string;
  city: string;
  priceLevel: number;
  openingHours?: object;
  images: string[];
  avgRating?: number;
  isVerified?: boolean;
};

const PLACES: PlaceSeed[] = [
  { name: "Soma Book Station", description: "Iconic Prishtina café-bookshop with specialty coffee, cultural events, and a cozy reading atmosphere.", category: "CAFE", vibes: ["cozy", "trendy", "chill"], lat: 42.6622, lng: 21.165, address: "Rr. Eqrem Çabjolli", city: "Prishtina", priceLevel: 2, openingHours: cafeHours, images: ["https://images.unsplash.com/photo-1501339847302-ac826a4a87f3?w=800"], avgRating: 4.7, isVerified: true },
  { name: "Dit'e Nat'", description: "Beloved café in a historic house serving excellent coffee, cakes, and relaxed afternoon vibes.", category: "CAFE", vibes: ["cozy", "traditional", "chill"], lat: 42.6615, lng: 21.1638, address: "Rr. Mark Isa Shkupi", city: "Prishtina", priceLevel: 2, openingHours: cafeHours, images: ["https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800"], avgRating: 4.6, isVerified: true },
  { name: "Tiffany Restaurant", description: "Upscale dining with international and Albanian fusion cuisine in central Prishtina.", category: "FOOD", vibes: ["romantic", "trendy"], lat: 42.6635, lng: 21.1672, address: "Rr. Agim Ramadani", city: "Prishtina", priceLevel: 4, images: ["https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800"], avgRating: 4.5 },
  { name: "Liburnia Restaurant", description: "Classic Prishtina restaurant known for traditional Kosovo dishes and warm hospitality.", category: "FOOD", vibes: ["traditional", "cozy"], lat: 42.6608, lng: 21.1645, address: "Rr. Garibaldi", city: "Prishtina", priceLevel: 3, images: ["https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800"], avgRating: 4.4 },
  { name: "National Library of Kosovo", description: "Striking brutalist architecture and cultural landmark — a must-see for design and history lovers.", category: "CULTURE", vibes: ["scenic", "traditional", "adventurous"], lat: 42.6569, lng: 21.1594, address: "Rr. Hasan Prishtina", city: "Prishtina", priceLevel: 1, openingHours: { mon: { open: "08:00", close: "20:00" }, tue: { open: "08:00", close: "20:00" }, wed: { open: "08:00", close: "20:00" }, thu: { open: "08:00", close: "20:00" }, fri: { open: "08:00", close: "20:00" }, sat: null, sun: null }, images: ["https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=800"], avgRating: 4.8, isVerified: true },
  { name: "NEWBORN Monument", description: "Symbolic monument celebrating Kosovo's independence — vibrant murals change regularly.", category: "CULTURE", vibes: ["scenic", "energetic", "trendy"], lat: 42.6582, lng: 21.1615, address: "Bulevardi Nënë Tereza", city: "Prishtina", priceLevel: 1, images: ["https://images.unsplash.com/photo-1516483638261-f4dbafbe99a8?w=800"], avgRating: 4.6 },
  { name: "Bear Sanctuary Prishtina", description: "Rescue sanctuary for brown bears with educational tours in a natural forest setting.", category: "NATURE", vibes: ["adventurous", "scenic", "chill"], lat: 42.7145, lng: 21.0892, address: "Mramor", city: "Prishtina", priceLevel: 2, openingHours: { mon: { open: "10:00", close: "17:00" }, tue: { open: "10:00", close: "17:00" }, wed: { open: "10:00", close: "17:00" }, thu: { open: "10:00", close: "17:00" }, fri: { open: "10:00", close: "17:00" }, sat: { open: "10:00", close: "17:00" }, sun: { open: "10:00", close: "17:00" } }, images: ["https://images.unsplash.com/photo-1589652717521-10c0d092dea9?w=800"], avgRating: 4.9, isVerified: true },
  { name: "Germia Park", description: "Large city park with trails, picnic areas, and a popular public swimming pool in summer.", category: "NATURE", vibes: ["chill", "adventurous", "scenic"], lat: 42.688, lng: 21.198, address: "Germia", city: "Prishtina", priceLevel: 1, images: ["https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800"], avgRating: 4.5 },
  { name: "Zone Club", description: "Mainstream nightclub with DJs, dancing, and late-night energy in the heart of Prishtina.", category: "NIGHTLIFE", vibes: ["energetic", "trendy"], lat: 42.664, lng: 21.1685, address: "Rr. Fehmi Agani", city: "Prishtina", priceLevel: 3, openingHours: nightlifeHours, images: ["https://images.unsplash.com/photo-1566737239500-896a6dca9b8e?w=800"], avgRating: 4.2 },
  { name: "Hamam Jazz Bar", description: "Intimate jazz venue in a restored hammam building — live music and craft cocktails.", category: "NIGHTLIFE", vibes: ["cozy", "romantic", "chill"], lat: 42.661, lng: 21.163, address: "Rr. Qamil Hoxha", city: "Prizren", priceLevel: 3, openingHours: nightlifeHours, images: ["https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800"], avgRating: 4.7 },
  { name: "Rugova Canyon", description: "Spectacular canyon near Peja with hiking, via ferrata, and dramatic mountain scenery.", category: "NATURE", vibes: ["adventurous", "scenic"], lat: 42.628, lng: 20.315, address: "Rugova", city: "Peja", priceLevel: 1, images: ["https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800"], avgRating: 4.9 },
  { name: "Gračanica Monastery", description: "UNESCO-listed Serbian Orthodox monastery with medieval frescoes, south of Prishtina.", category: "CULTURE", vibes: ["traditional", "scenic", "chill"], lat: 42.601, lng: 21.194, address: "Gračanica", city: "Gračanica", priceLevel: 1, openingHours: { mon: { open: "07:00", close: "19:00" }, tue: { open: "07:00", close: "19:00" }, wed: { open: "07:00", close: "19:00" }, thu: { open: "07:00", close: "19:00" }, fri: { open: "07:00", close: "19:00" }, sat: { open: "07:00", close: "19:00" }, sun: { open: "07:00", close: "19:00" } }, images: ["https://images.unsplash.com/photo-1548013146-72479768bada?w=800"], avgRating: 4.8 },
  { name: "Mirusha Waterfalls", description: "Series of beautiful waterfalls between Klina and Gjakova — perfect day trip for nature lovers.", category: "NATURE", vibes: ["adventurous", "scenic", "romantic"], lat: 42.446, lng: 20.623, address: "Mirusha", city: "Malisheva", priceLevel: 1, images: ["https://images.unsplash.com/photo-1432405972618-c60b9925df8b?w=800"], avgRating: 4.7 },
  { name: "Brezovica Ski Resort", description: "Mountain resort on Sharr National Park slopes — skiing in winter, hiking in summer.", category: "NATURE", vibes: ["adventurous", "scenic", "energetic"], lat: 42.196, lng: 21.032, address: "Brezovica", city: "Shtërpcë", priceLevel: 3, images: ["https://images.unsplash.com/photo-1551524559-8af4e6624178?w=800"], avgRating: 4.4 },
  { name: "Prizren Old Town", description: "Ottoman-era cobblestone streets, stone bridges, and riverside cafés in Kosovo's cultural capital.", category: "CULTURE", vibes: ["traditional", "scenic", "romantic"], lat: 42.2139, lng: 20.7397, address: "Shadervan", city: "Prizren", priceLevel: 1, images: ["https://images.unsplash.com/photo-1467261839597-6b5f0e4d0b0a?w=800"], avgRating: 4.9 },
  { name: "Sinan Pasha Mosque", description: "Historic mosque overlooking Prizren's old town — stunning architecture and river views.", category: "CULTURE", vibes: ["traditional", "scenic"], lat: 42.2145, lng: 20.741, address: "Rr. Marin Barleti", city: "Prizren", priceLevel: 1, images: ["https://images.unsplash.com/photo-1564769662533-4f00a6b0f0a8?w=800"], avgRating: 4.7 },
  { name: "Art Cafe Prizren", description: "Creative café by the river with local art, coffee, and relaxed Shadervan views.", category: "CAFE", vibes: ["cozy", "chill", "scenic"], lat: 42.2135, lng: 20.74, address: "Shadervan", city: "Prizren", priceLevel: 2, openingHours: cafeHours, images: ["https://images.unsplash.com/photo-1453614512564-092b9b0da1a1?w=800"], avgRating: 4.5 },
  { name: "Restaurant Ambienti", description: "Riverside dining in Prizren old town with traditional grill and Albanian specialties.", category: "FOOD", vibes: ["traditional", "romantic", "scenic"], lat: 42.213, lng: 20.7385, address: "Shadervan", city: "Prizren", priceLevel: 3, images: ["https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800"], avgRating: 4.6 },
  { name: "Peja Patriarchate", description: "Medieval Serbian Orthodox monastery in Rugova valley with remarkable frescoes.", category: "CULTURE", vibes: ["traditional", "adventurous", "scenic"], lat: 42.658, lng: 20.288, address: "Pećka Patrijaršija", city: "Peja", priceLevel: 1, images: ["https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800"], avgRating: 4.8 },
  { name: "Bazaar Cafe Peja", description: "Coffee stop in Peja's old bazaar area — ideal before canyon adventures.", category: "CAFE", vibes: ["cozy", "traditional", "chill"], lat: 42.659, lng: 20.292, address: "Çarshia", city: "Peja", priceLevel: 2, openingHours: cafeHours, images: ["https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=800"], avgRating: 4.3 },
  { name: "Gjakova Old Bazaar", description: "One of the largest preserved Ottoman bazaars in the Balkans — crafts, coffee, and history.", category: "SHOPPING", vibes: ["traditional", "adventurous", "chill"], lat: 42.379, lng: 20.431, address: "Çarshia e Madhe", city: "Gjakova", priceLevel: 2, images: ["https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800"], avgRating: 4.6 },
  { name: "Hadum Mosque Complex", description: "Historic mosque and complex at the heart of Gjakova's old bazaar.", category: "CULTURE", vibes: ["traditional", "scenic"], lat: 42.3795, lng: 20.4305, address: "Çarshia", city: "Gjakova", priceLevel: 1, images: ["https://images.unsplash.com/photo-1580418827493-988f9e39e9a0?w=800"], avgRating: 4.5 },
  { name: "Hani i Vjetër", description: "Traditional restaurant in Gjakova serving local dishes in a restored han building.", category: "FOOD", vibes: ["traditional", "cozy"], lat: 42.3788, lng: 20.4312, address: "Çarshia e Madhe", city: "Gjakova", priceLevel: 2, images: ["https://images.unsplash.com/photo-1552566626-52f8b75d799a?w=800"], avgRating: 4.4 },
  { name: "Museum of Kosovo", description: "National museum covering archaeology, ethnography, and recent history.", category: "CULTURE", vibes: ["traditional", "chill"], lat: 42.6575, lng: 21.16, address: "Rr. Ibrahim Rugova", city: "Prishtina", priceLevel: 2, openingHours: defaultHours, images: ["https://images.unsplash.com/photo-1564399579883-451a5d44ec08?w=800"], avgRating: 4.3 },
  { name: "Kalaja e Prizrenit", description: "Prizren Fortress hike with panoramic views over the city and Sharr mountains.", category: "CULTURE", vibes: ["adventurous", "scenic", "energetic"], lat: 42.208, lng: 20.745, address: "Kalaja", city: "Prizren", priceLevel: 1, images: ["https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800"], avgRating: 4.8 },
  { name: "Emerald Hotel Rooftop", description: "Rooftop bar with city views — cocktails and sunset sessions.", category: "NIGHTLIFE", vibes: ["trendy", "romantic", "scenic"], lat: 42.665, lng: 21.17, address: "Rr. Tahir Zajmi", city: "Prishtina", priceLevel: 4, openingHours: nightlifeHours, images: ["https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800"], avgRating: 4.1 },
  { name: "Soma Second Floor", description: "Extension of Soma with events space and evening wine tastings.", category: "NIGHTLIFE", vibes: ["cozy", "trendy", "chill"], lat: 42.6623, lng: 21.1652, address: "Rr. Eqrem Çabjolli", city: "Prishtina", priceLevel: 3, openingHours: nightlifeHours, images: ["https://images.unsplash.com/photo-1514933651103-005eec06e04b?w=800"], avgRating: 4.4 },
  { name: "Albi Market", description: "Local grocery and specialty foods — quick stops for picnic supplies.", category: "SHOPPING", vibes: ["chill"], lat: 42.661, lng: 21.162, address: "Rr. UÇK", city: "Prishtina", priceLevel: 2, images: ["https://images.unsplash.com/photo-1604719312566-8912e9227c8a?w=800"], avgRating: 4.0 },
  { name: "Prishtina Mall", description: "Modern shopping mall with international brands and food court.", category: "SHOPPING", vibes: ["trendy", "energetic"], lat: 42.645, lng: 21.152, address: "Rr. Robert Doll", city: "Prishtina", priceLevel: 3, images: ["https://images.unsplash.com/photo-1555529908-3a0a0a0a0a0a?w=800"], avgRating: 3.9 },
  { name: "Te Syla", description: "Legendary Prishtina grill house — casual, loud, and delicious.", category: "FOOD", vibes: ["energetic", "traditional"], lat: 42.6595, lng: 21.166, address: "Rr. Garibaldi", city: "Prishtina", priceLevel: 2, images: ["https://images.unsplash.com/photo-1550547660-d9450f8590e9?w=800"], avgRating: 4.5 },
  { name: "Pishat Restaurant", description: "Family restaurant under pine trees — famous for fli and traditional plates.", category: "FOOD", vibes: ["traditional", "cozy", "scenic"], lat: 42.672, lng: 21.175, address: "Arbëria", city: "Prishtina", priceLevel: 3, images: ["https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800"], avgRating: 4.6 },
  { name: "Babaghanoush", description: "Middle Eastern-inspired vegetarian-friendly spot with colorful plates.", category: "FOOD", vibes: ["trendy", "chill", "cozy"], lat: 42.6628, lng: 21.1642, address: "Rr. Fehmi Agani", city: "Prishtina", priceLevel: 2, images: ["https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800"], avgRating: 4.4 },
  { name: "Gadish Lounge", description: "Hookah lounge and late-night hangout with relaxed seating.", category: "NIGHTLIFE", vibes: ["chill", "cozy"], lat: 42.663, lng: 21.169, address: "Rr. Agim Ramadani", city: "Prishtina", priceLevel: 3, openingHours: nightlifeHours, images: ["https://images.unsplash.com/photo-1572116469694-50c45d8b0a0a?w=800"], avgRating: 4.0 },
  { name: "Sharr Mountains Viewpoint", description: "Scenic drive viewpoint toward Brezovica with mountain panoramas.", category: "NATURE", vibes: ["scenic", "adventurous", "chill"], lat: 42.25, lng: 21.05, address: "M2 Highway", city: "Shtërpcë", priceLevel: 1, images: ["https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800"], avgRating: 4.6 },
  { name: "Lumbardhi Cinema", description: "Restored open-air cinema in Prizren — cultural hub and festival venue.", category: "CULTURE", vibes: ["cozy", "trendy", "romantic"], lat: 42.2128, lng: 20.739, address: "Rr. Remzi Ademaj", city: "Prizren", priceLevel: 2, images: ["https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800"], avgRating: 4.7 },
];

const REVIEW_COMMENTS = [
  "Absolutely loved the atmosphere here.",
  "Perfect for a slow afternoon.",
  "Great for groups — we stayed hours.",
  "Felt very local and authentic.",
  "Would come back for the vibe alone.",
  "Coffee was excellent, seating cozy.",
  "Best spot we've found in the city so far.",
  "A bit crowded but worth it.",
  "Ideal for a romantic evening.",
  "Kids loved it too!",
];

const REVIEW_VIBES = ["cozy", "energetic", "romantic", "chill", "trendy", "traditional", "scenic", "adventurous"];

async function main() {
  console.log("Clearing database...");
  await prisma.review.deleteMany();
  await prisma.itinerary.deleteMany();
  await prisma.event.deleteMany();
  await prisma.transportRoute.deleteMany();
  await prisma.place.deleteMany();
  await prisma.businessProfile.deleteMany();
  await prisma.user.deleteMany();

  const password = await bcrypt.hash("password123", 10);

  const demoUser = await prisma.user.create({
    data: {
      email: "demo@stay.kosovo",
      password,
      name: "Demo Traveler",
      role: "USER",
      preferences: JSON.stringify({
        vibes: ["cozy", "scenic", "traditional"],
        interests: ["food", "culture", "coffee"],
        quizCompleted: true,
      }),
    },
  });

  const businessUsers = [];
  for (let i = 1; i <= 5; i++) {
    const u = await prisma.user.create({
      data: {
        email: `business${i}@stay.kosovo`,
        password,
        name: `Business Owner ${i}`,
        role: "BUSINESS",
        preferences: JSON.stringify({ vibes: [], interests: [], quizCompleted: true }),
      },
    });
    businessUsers.push(u);
  }

  const createdPlaces: Place[] = [];
  for (let i = 0; i < PLACES.length; i++) {
    const p = PLACES[i];
    const ownerId = i < 5 ? businessUsers[i].id : undefined;
    const place = await prisma.place.create({
      data: {
        name: p.name,
        description: p.description,
        category: p.category,
        vibes: JSON.stringify(p.vibes),
        lat: p.lat,
        lng: p.lng,
        address: p.address,
        city: p.city,
        priceLevel: p.priceLevel,
        openingHours: JSON.stringify(p.openingHours || defaultHours),
        images: JSON.stringify(p.images),
        ownerId,
        avgRating: p.avgRating || 4.0,
        isVerified: p.isVerified ?? false,
        feelsLike: `Feels like: a ${p.vibes[0] || "local"} experience in ${p.city}`,
      },
    });
    createdPlaces.push(place);

    if (ownerId) {
      await prisma.businessProfile.create({
        data: {
          userId: ownerId,
          placeId: place.id,
          businessName: p.name,
          description: p.description,
          category: p.category,
          ownerName: `Business Owner ${i + 1}`,
          contactEmail: `business${i + 1}@stay.kosovo`,
          address: p.address,
          city: p.city,
          lat: p.lat,
          lng: p.lng,
          arbkNumber: `ARBK-${10000 + i}`,
          website: `https://example.com/${i}`,
          phone: `+383 44 ${100000 + i}`,
          photos: JSON.stringify(p.images),
          tags: JSON.stringify(p.vibes),
          services: JSON.stringify([]),
          openingHours: JSON.stringify(p.openingHours || {}),
          priceRange: "$$",
          verificationStatus: p.isVerified ? "verified" : "pending",
          verified: p.isVerified ?? false,
        },
      });
    }
  }

  const allUsers = [demoUser, ...businessUsers];
  for (let i = 0; i < 55; i++) {
    const place = createdPlaces[i % createdPlaces.length];
    const user = allUsers[i % allUsers.length];
    const vibes = [
      REVIEW_VIBES[i % REVIEW_VIBES.length],
      REVIEW_VIBES[(i + 2) % REVIEW_VIBES.length],
    ];
    await prisma.review.create({
      data: {
        userId: user.id,
        placeId: place.id,
        rating: 3 + (i % 3),
        comment: REVIEW_COMMENTS[i % REVIEW_COMMENTS.length],
        vibeTags: JSON.stringify(vibes),
        photos: "[]",
      },
    });
  }

  for (const place of createdPlaces) {
    const reviews = await prisma.review.findMany({ where: { placeId: place.id } });
    if (reviews.length) {
      const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
      await prisma.place.update({
        where: { id: place.id },
        data: { avgRating: Math.round(avg * 10) / 10 },
      });
    }
  }

  const now = new Date();
  const events = [
    { name: "Jazz Night at Hamam", description: "Live jazz quartet", placeIdx: 9, hours: 48, category: "music", cityLat: 42.2139, cityLng: 20.7397 },
    { name: "Germia Trail Run", description: "5K morning trail run", placeIdx: 7, hours: 72, category: "sports", cityLat: 42.688, cityLng: 21.198 },
    { name: "Prizren Dokufest Preview", description: "Documentary screening at Lumbardhi", placeIdx: 33, hours: 96, category: "culture", cityLat: 42.2128, cityLng: 20.739 },
    { name: "Soma Poetry Evening", description: "Local poets and open mic", placeIdx: 0, hours: 24, category: "culture", cityLat: 42.6622, cityLng: 21.165 },
    { name: "NEWBORN Photo Walk", description: "Guided photography walk", placeIdx: 5, hours: 36, category: "culture", cityLat: 42.6582, cityLng: 21.1615 },
    { name: "Zone Club: DJ Fana", description: "International DJ set", placeIdx: 8, hours: 60, category: "nightlife", cityLat: 42.664, cityLng: 21.1685 },
    { name: "Bear Sanctuary Tour", description: "Guided educational tour", placeIdx: 6, hours: 120, category: "nature", cityLat: 42.7145, cityLng: 21.0892 },
    { name: "Gjakova Bazaar Craft Fair", description: "Local artisans market", placeIdx: 20, hours: 144, category: "shopping", cityLat: 42.379, cityLng: 20.431 },
    { name: "Rugova Canyon Hike", description: "Organized group hike", placeIdx: 10, hours: 168, category: "nature", cityLat: 42.628, cityLng: 20.315 },
    { name: "Prishtina Food Festival", description: "Street food and local chefs", placeIdx: 2, hours: 200, category: "food", cityLat: 42.6635, cityLng: 21.1672 },
  ];

  for (const ev of events) {
    const start = new Date(now.getTime() + ev.hours * 3600000);
    const end = new Date(start.getTime() + 3 * 3600000);
    await prisma.event.create({
      data: {
        name: ev.name,
        description: ev.description,
        placeId: createdPlaces[ev.placeIdx]?.id,
        startTime: start,
        endTime: end,
        category: ev.category,
        lat: ev.cityLat,
        lng: ev.cityLng,
      },
    });
  }

  const eveningStops = [
    createdPlaces.find((p) => p.name === "Soma Book Station")!,
    createdPlaces.find((p) => p.name === "NEWBORN Monument")!,
    createdPlaces.find((p) => p.name === "Hamam Jazz Bar") || createdPlaces[9],
    createdPlaces.find((p) => p.name === "Tiffany Restaurant")!,
  ].filter(Boolean);

  await prisma.itinerary.create({
    data: {
      userId: demoUser.id,
      title: "Perfect Evening in Prishtina",
      date: new Date(),
      isPublic: true,
      stops: JSON.stringify(
        eveningStops.map((p, i) => ({
          placeId: p.id,
          order: i + 1,
          plannedTime: `${17 + i}:00`,
          transportMode: i === 0 ? "WALK" : "TAXI",
        }))
      ),
    },
  });

  await prisma.itinerary.create({
    data: {
      userId: demoUser.id,
      title: "Prizren Culture Day",
      date: new Date(Date.now() + 86400000),
      isPublic: true,
      stops: JSON.stringify(
        ["Prizren Old Town", "Sinan Pasha Mosque", "Art Cafe Prizren", "Lumbardhi Cinema"]
          .map((name, i) => {
            const p = createdPlaces.find((x) => x.name === name)!;
            return { placeId: p.id, order: i + 1, plannedTime: `${10 + i * 2}:00`, transportMode: "WALK" };
          })
      ),
    },
  });

  await prisma.itinerary.create({
    data: {
      userId: demoUser.id,
      title: "Nature Escape Weekend",
      isPublic: false,
      stops: JSON.stringify(
        ["Germia Park", "Bear Sanctuary Prishtina", "Mirusha Waterfalls"]
          .map((name, i) => {
            const p = createdPlaces.find((x) => x.name === name)!;
            return { placeId: p.id, order: i + 1, plannedTime: `${9 + i * 3}:00`, transportMode: "BUS" };
          })
      ),
    },
  });

  console.log(`Seeded ${createdPlaces.length} places, ${allUsers.length} users, reviews, events, itineraries.`);
  console.log("Demo login: demo@stay.kosovo / password123");
  console.log("Business login: business1@stay.kosovo / password123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
