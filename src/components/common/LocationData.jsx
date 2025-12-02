// Pre-approved shuttle locations with GPS coordinates
export const LOCATIONS = {
  hotel: {
    "hotel-lobby": {
      id: "hotel-lobby",
      name: "Hotel Lobby",
      address: "1600 Holcombe Blvd, Houston TX 77030",
      lat: 29.7074,
      lng: -95.3981,
      category: "Hotel"
    }
  },
  riceVillage: {
    "starbucks-rice": {
      id: "starbucks-rice",
      name: "Starbucks",
      address: "2531 Amherst St",
      lat: 29.7176,
      lng: -95.4214,
      category: "Rice Village"
    },
    "damicos-rice": {
      id: "damicos-rice",
      name: "D'Amico's",
      address: "5510 Morningside Dr",
      lat: 29.7165,
      lng: -95.4231,
      category: "Rice Village"
    },
    "black-walnut-rice": {
      id: "black-walnut-rice",
      name: "Black Walnut Cafe",
      address: "5510 Morningside Dr",
      lat: 29.7165,
      lng: -95.4231,
      category: "Rice Village"
    },
    "banana-republic-rice": {
      id: "banana-republic-rice",
      name: "Banana Republic",
      address: "2400 University Blvd",
      lat: 29.7169,
      lng: -95.4219,
      category: "Rice Village"
    }
  },
  museumDistrict: {
    "museum-natural-science": {
      id: "museum-natural-science",
      name: "Museum of Natural Science",
      address: "5555 Hermann Park Dr",
      lat: 29.7223,
      lng: -95.3893,
      category: "Museum District"
    },
    "museum-fine-arts": {
      id: "museum-fine-arts",
      name: "Museum of Fine Arts",
      address: "1001 Bissonnet St",
      lat: 29.7256,
      lng: -95.3904,
      category: "Museum District"
    },
    "health-museum": {
      id: "health-museum",
      name: "Health Museum",
      address: "1515 Hermann Dr",
      lat: 29.7219,
      lng: -95.3889,
      category: "Museum District"
    },
    "hermann-park": {
      id: "hermann-park",
      name: "Hermann Park",
      address: "6001 Hermann Park Dr",
      lat: 29.7164,
      lng: -95.3903,
      category: "Museum District"
    },
    "houston-zoo": {
      id: "houston-zoo",
      name: "The Houston Zoo",
      address: "6200 Hermann Park Dr",
      lat: 29.7147,
      lng: -95.3919,
      category: "Museum District"
    },
    "holocaust-museum": {
      id: "holocaust-museum",
      name: "Holocaust Museum",
      address: "5401 Caroline St",
      lat: 29.7229,
      lng: -95.3897,
      category: "Museum District"
    }
  },
  churches: {
    "palmer-memorial": {
      id: "palmer-memorial",
      name: "Palmer Memorial Episcopal Church",
      address: "6221 Main St",
      lat: 29.7174,
      lng: -95.4019,
      category: "Churches"
    },
    "christ-the-king": {
      id: "christ-the-king",
      name: "Christ The King Lutheran Church",
      address: "2353 Rice Blvd",
      lat: 29.7067,
      lng: -95.4134,
      category: "Churches"
    },
    "st-vincent": {
      id: "st-vincent",
      name: "St. Vincent de Paul Catholic Church",
      address: "6800 Buffalo Speedway",
      lat: 29.7028,
      lng: -95.4389,
      category: "Churches"
    }
  },
  mdAnderson: {
    "md-main-building": {
      id: "md-main-building",
      name: "Main Building / Clark Clinic",
      address: "1515 Holcombe Blvd",
      lat: 29.7074,
      lng: -95.3981,
      category: "MD Anderson"
    },
    "md-muslim-prayer-room": {
      id: "md-muslim-prayer-room",
      name: "Muslim Prayer Room (Main Building)",
      address: "1515 Holcombe Blvd",
      lat: 29.7074,
      lng: -95.3981,
      category: "MD Anderson"
    },
    "md-duncan-building": {
      id: "md-duncan-building",
      name: "Dan L Duncan Building",
      address: "1155 Pressler St",
      lat: 29.7089,
      lng: -95.3967,
      category: "MD Anderson"
    },
    "md-mays-clinic": {
      id: "md-mays-clinic",
      name: "Mays Clinic",
      address: "1220 Holcombe Blvd",
      lat: 29.7067,
      lng: -95.3989,
      category: "MD Anderson"
    },
    "md-pickens-tower": {
      id: "md-pickens-tower",
      name: "Pickens Tower",
      address: "1400 Pressler St",
      lat: 29.7092,
      lng: -95.3978,
      category: "MD Anderson"
    },
    "md-mitchell-research": {
      id: "md-mitchell-research",
      name: "Mitchell Research Building",
      address: "6767 Bertner Ave",
      lat: 29.7098,
      lng: -95.3956,
      category: "MD Anderson"
    },
    "md-life-science-plaza": {
      id: "md-life-science-plaza",
      name: "Life Science Plaza (LSP)",
      address: "6550 Fannin St",
      lat: 29.7102,
      lng: -95.3978,
      category: "MD Anderson"
    },
    "md-proton-therapy-1": {
      id: "md-proton-therapy-1",
      name: "Proton Therapy Center 1 (PTC1)",
      address: "1840 Old Spanish Trail",
      lat: 29.7034,
      lng: -95.3912,
      category: "MD Anderson"
    },
    "md-proton-therapy-2": {
      id: "md-proton-therapy-2",
      name: "Proton Therapy Center 2 (PTC2)",
      address: "1840 Old Spanish Trail",
      lat: 29.7034,
      lng: -95.3912,
      category: "MD Anderson"
    }
  }
};

// Flatten all locations for easy access
export const ALL_LOCATIONS = [
  ...Object.values(LOCATIONS.hotel),
  ...Object.values(LOCATIONS.riceVillage),
  ...Object.values(LOCATIONS.museumDistrict),
  ...Object.values(LOCATIONS.churches),
  ...Object.values(LOCATIONS.mdAnderson)
];

// Get location by ID
export const getLocationById = (id) => {
  return ALL_LOCATIONS.find(loc => loc.id === id);
};

// Get location name by ID
export const getLocationName = (id) => {
  const location = getLocationById(id);
  return location ? location.name : id;
};

// Get all location IDs
export const getAllLocationIds = () => {
  return ALL_LOCATIONS.map(loc => loc.id);
};

// Group locations by category for dropdowns
export const LOCATION_GROUPS = [
  { label: "Hotel", locations: Object.values(LOCATIONS.hotel) },
  { label: "Rice Village", locations: Object.values(LOCATIONS.riceVillage) },
  { label: "Museum District", locations: Object.values(LOCATIONS.museumDistrict) },
  { label: "Local Churches", locations: Object.values(LOCATIONS.churches) },
  { label: "MD Anderson Buildings", locations: Object.values(LOCATIONS.mdAnderson) }
];

// Format for AI agent instructions
export const getLocationListForAI = () => {
  return ALL_LOCATIONS.map(loc => `'${loc.id}' (${loc.name})`).join(', ');
};