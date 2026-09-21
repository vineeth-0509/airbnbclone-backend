// Pure data used to seed the database. Split out from seed.ts so
// prefetch-photos.ts can reuse the exact same seed strings — the photo
// filenames it bakes locally must match what seed.ts asks photo() for.

type CategorySeed = readonly [slug: string, label: string, icon: string];
type AmenitySeed = readonly [slug: string, label: string, group: string, icon: string];
type HostSeed = readonly [email: string, name: string, bio: string];
type GuestSeed = readonly [email: string, name: string];

interface ListingSeed {
  title: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  type: string;
  category: string;
  pricePerNight: number;
  cleaningFee: number;
  guests: number;
  bedrooms: number;
  beds: number;
  baths: number;
  description: string;
  amenities: string[];
}

export const CATEGORIES: CategorySeed[] = [
  ['beachfront', 'Beachfront', 'waves'],
  ['cabins', 'Cabins', 'trees'],
  ['design', 'Design', 'lamp'],
  ['pools', 'Amazing pools', 'waves'],
  ['countryside', 'Countryside', 'mountain'],
  ['city', 'Iconic cities', 'building'],
  ['lakefront', 'Lakefront', 'sailboat'],
  ['tiny', 'Tiny homes', 'home'],
  ['mansions', 'Mansions', 'castle'],
  ['treehouse', 'Treehouses', 'tree-pine'],
];

export const AMENITIES: AmenitySeed[] = [
  ['wifi', 'Fast wifi', 'Internet and office', 'wifi'],
  ['workspace', 'Dedicated workspace', 'Internet and office', 'laptop'],
  ['kitchen', 'Kitchen', 'Kitchen and dining', 'cooking-pot'],
  ['fridge', 'Fridge', 'Kitchen and dining', 'refrigerator'],
  ['freezer', 'Freezer', 'Kitchen and dining', 'snowflake'],
  ['microwave', 'Microwave', 'Kitchen and dining', 'microwave'],
  ['cooking-basics', 'Cooking basics', 'Kitchen and dining', 'utensils'],
  ['crockery', 'Crockery and cutlery', 'Kitchen and dining', 'utensils-crossed'],
  ['coffee', 'Coffee maker', 'Kitchen and dining', 'coffee'],
  ['pool', 'Private pool', 'Outdoor', 'waves'],
  ['jacuzzi', 'Jacuzzi', 'Outdoor', 'bath'],
  ['bbq', 'BBQ grill', 'Outdoor', 'flame'],
  ['patio', 'Patio or balcony', 'Outdoor', 'sun'],
  ['ac', 'Air conditioning', 'Heating and cooling', 'wind'],
  ['ceiling-fan', 'Ceiling fan', 'Heating and cooling', 'fan'],
  ['heating', 'Heating', 'Heating and cooling', 'thermometer'],
  ['washer', 'Washing machine', 'Laundry', 'washing-machine'],
  ['dryer', 'Dryer', 'Laundry', 'shirt'],
  ['hot-water', 'Hot water', 'Bathroom', 'shower-head'],
  ['hair-dryer', 'Hair dryer', 'Bathroom', 'wind'],
  ['shampoo', 'Shampoo', 'Bathroom', 'droplet'],
  ['tv', 'Smart TV', 'Entertainment', 'tv'],
  ['sound', 'Sound system', 'Entertainment', 'speaker'],
  ['parking', 'Free parking on premises', 'Parking and facilities', 'car'],
  ['ev', 'EV charger', 'Parking and facilities', 'plug-zap'],
  ['gym', 'Gym', 'Parking and facilities', 'dumbbell'],
  ['smoke-alarm', 'Smoke alarm', 'Home safety', 'siren'],
  ['co-alarm', 'Carbon monoxide alarm', 'Home safety', 'siren'],
  ['extinguisher', 'Fire extinguisher', 'Home safety', 'fire-extinguisher'],
  ['first-aid', 'First aid kit', 'Home safety', 'cross'],
  ['self-checkin', 'Self check-in', 'Services', 'key-round'],
  ['pets', 'Pets allowed', 'Services', 'paw-print'],
  ['crib', 'Crib', 'Family', 'baby'],
  ['high-chair', 'High chair', 'Family', 'armchair'],
];

export const HOSTS: HostSeed[] = [
  ['mirashya@staybnb.dev', 'Mirashya Homes', 'We look after six boutique stays across Goa and answer within an hour.'],
  ['kabir@staybnb.dev', 'Kabir Rao', 'Architect turned host. I design every space I rent out.'],
  ['leela@staybnb.dev', 'Leela Menon', 'Third-generation coffee planter hosting in the Western Ghats.'],
  ['noor@staybnb.dev', 'Noor Sethi', 'Ex-hotelier. Fresh linen, good coffee, no fuss.'],
];

export const LISTINGS: ListingSeed[] = [
  {
    title: 'Jacuzzi 1BHK with sea-facing deck, Candolim',
    city: 'Candolim', country: 'India', lat: 15.5167, lng: 73.7628,
    type: 'Entire rental unit', category: 'beachfront',
    pricePerNight: 5700, cleaningFee: 1200, guests: 4, bedrooms: 1, beds: 2, baths: 1,
    description:
      'Wake up eight minutes from Candolim Beach. The deck holds a private jacuzzi and two loungers that catch the last of the afternoon sun. Inside it is cool tile, blackout curtains and a kitchen stocked for slow mornings. Cafes, the fish market and the nightlife stretch are all a short scooter ride away.',
    amenities: ['wifi', 'ac', 'jacuzzi', 'kitchen', 'fridge', 'freezer', 'microwave', 'cooking-basics', 'crockery', 'tv', 'washer', 'hot-water', 'self-checkin', 'parking', 'pets', 'smoke-alarm', 'co-alarm', 'first-aid', 'patio', 'workspace', 'ceiling-fan', 'shampoo', 'hair-dryer', 'coffee'],
  },
  {
    title: 'Glass-walled cabin above the coffee estate',
    city: 'Chikmagalur', country: 'India', lat: 13.3161, lng: 75.7720,
    type: 'Entire cabin', category: 'cabins',
    pricePerNight: 8400, cleaningFee: 900, guests: 2, bedrooms: 1, beds: 1, baths: 1,
    description:
      'One room, three glass walls, and 40 acres of coffee below. Mist arrives around six in the morning and burns off by nine. There is no television on purpose. Breakfast is brought up to the deck at a time you choose the night before.',
    amenities: ['wifi', 'heating', 'kitchen', 'coffee', 'fridge', 'patio', 'parking', 'hot-water', 'workspace', 'smoke-alarm', 'first-aid', 'self-checkin', 'bbq'],
  },
  {
    title: 'Brutalist penthouse with a lap pool, Bandra',
    city: 'Mumbai', country: 'India', lat: 19.0596, lng: 72.8295,
    type: 'Entire home', category: 'design',
    pricePerNight: 21500, cleaningFee: 3000, guests: 6, bedrooms: 3, beds: 4, baths: 3,
    description:
      'Board-formed concrete, ten-foot doors and a twelve-metre lap pool on the terrace. Built by the owner as a family home and rented out a few weeks a year. Two minutes from Carter Road, with a lift that opens directly into the apartment.',
    amenities: ['wifi', 'ac', 'pool', 'gym', 'kitchen', 'fridge', 'freezer', 'microwave', 'cooking-basics', 'crockery', 'coffee', 'tv', 'sound', 'washer', 'dryer', 'parking', 'ev', 'workspace', 'hot-water', 'shampoo', 'hair-dryer', 'smoke-alarm', 'co-alarm', 'extinguisher', 'first-aid', 'patio', 'self-checkin'],
  },
  {
    title: 'Backwater villa with private jetty, Alleppey',
    city: 'Alappuzha', country: 'India', lat: 9.4981, lng: 76.3388,
    type: 'Entire villa', category: 'lakefront',
    pricePerNight: 11200, cleaningFee: 1500, guests: 8, bedrooms: 4, beds: 5, baths: 3,
    description:
      'A restored tharavad on the Pamba, with a jetty where the houseboats pass at dusk. Four bedrooms open onto a central courtyard. The cook comes in at seven and will make whatever the market had that morning.',
    amenities: ['wifi', 'ac', 'ceiling-fan', 'kitchen', 'fridge', 'cooking-basics', 'crockery', 'washer', 'hot-water', 'parking', 'patio', 'bbq', 'crib', 'high-chair', 'smoke-alarm', 'first-aid', 'pets'],
  },
  {
    title: 'Tiny A-frame in the deodar forest',
    city: 'Manali', country: 'India', lat: 32.2432, lng: 77.1892,
    type: 'Tiny home', category: 'tiny',
    pricePerNight: 4200, cleaningFee: 600, guests: 2, bedrooms: 1, beds: 1, baths: 1,
    description:
      'Twenty-two square metres, a wood stove and a window that frames the Dhauladhars. The last hundred metres are on foot, which is the point. Firewood and a thermos of chai are left outside the door each evening.',
    amenities: ['wifi', 'heating', 'kitchen', 'coffee', 'fridge', 'hot-water', 'patio', 'parking', 'smoke-alarm', 'co-alarm', 'first-aid', 'self-checkin'],
  },
  {
    title: 'Havelock beach house, thirty steps from the water',
    city: 'Havelock Island', country: 'India', lat: 11.9800, lng: 92.9860,
    type: 'Entire home', category: 'beachfront',
    pricePerNight: 9600, cleaningFee: 1400, guests: 5, bedrooms: 2, beds: 3, baths: 2,
    description:
      'Timber, mosquito nets and the sound of the Andaman Sea through every window. Snorkelling gear is in the hall cupboard. The dive school will collect you from the gate at six-thirty if you ask.',
    amenities: ['wifi', 'ac', 'ceiling-fan', 'kitchen', 'fridge', 'cooking-basics', 'crockery', 'hot-water', 'patio', 'bbq', 'parking', 'self-checkin', 'smoke-alarm', 'first-aid', 'pets'],
  },
  {
    title: 'Haveli courtyard suite in the old city',
    city: 'Jaipur', country: 'India', lat: 26.9239, lng: 75.8267,
    type: 'Private room', category: 'city',
    pricePerNight: 6300, cleaningFee: 800, guests: 3, bedrooms: 1, beds: 2, baths: 1,
    description:
      'A 190-year-old haveli five minutes inside the Chandpole gate. The suite opens onto a jali-screened courtyard where breakfast is laid out under a neem tree. Hawa Mahal is a fifteen-minute walk through the bazaar.',
    amenities: ['wifi', 'ac', 'ceiling-fan', 'kitchen', 'coffee', 'fridge', 'hot-water', 'shampoo', 'hair-dryer', 'washer', 'tv', 'workspace', 'smoke-alarm', 'first-aid', 'self-checkin'],
  },
  {
    title: 'Cliff-edge treehouse with an outdoor bath',
    city: 'Wayanad', country: 'India', lat: 11.6854, lng: 76.1320,
    type: 'Treehouse', category: 'treehouse',
    pricePerNight: 7400, cleaningFee: 1000, guests: 2, bedrooms: 1, beds: 1, baths: 1,
    description:
      'Nine metres up a jackfruit tree, reached by a rope bridge. The bath sits on the open deck and looks straight down the valley. Hornbills most mornings, fireflies most nights.',
    amenities: ['wifi', 'kitchen', 'coffee', 'fridge', 'hot-water', 'patio', 'parking', 'bbq', 'smoke-alarm', 'first-aid', 'self-checkin'],
  },
  {
    title: 'Sun-bleached farmhouse with a salt pool',
    city: 'Assagao', country: 'India', lat: 15.5983, lng: 73.7772,
    type: 'Entire home', category: 'pools',
    pricePerNight: 15800, cleaningFee: 2200, guests: 7, bedrooms: 3, beds: 4, baths: 3,
    description:
      'Lime-washed walls, a long shaded verandah and a saltwater pool that stays warm into November. The kitchen garden is yours to raid. Assagao\'s restaurants are a four-minute drive, and the housekeeper lives on site.',
    amenities: ['wifi', 'ac', 'pool', 'kitchen', 'fridge', 'freezer', 'microwave', 'cooking-basics', 'crockery', 'coffee', 'tv', 'sound', 'washer', 'dryer', 'parking', 'patio', 'bbq', 'crib', 'high-chair', 'hot-water', 'shampoo', 'smoke-alarm', 'co-alarm', 'extinguisher', 'first-aid', 'pets', 'self-checkin'],
  },
  {
    title: 'Colonial-era estate bungalow, Munnar',
    city: 'Munnar', country: 'India', lat: 10.0889, lng: 77.0595,
    type: 'Entire home', category: 'countryside',
    pricePerNight: 12900, cleaningFee: 1800, guests: 6, bedrooms: 3, beds: 3, baths: 2,
    description:
      'Built in 1927 for a tea superintendent and barely changed since: teak floors, a working fireplace and a lawn that runs into the plantation. Evening temperatures drop to twelve degrees, so the fire gets lit at six.',
    amenities: ['wifi', 'heating', 'kitchen', 'coffee', 'fridge', 'cooking-basics', 'crockery', 'hot-water', 'washer', 'parking', 'patio', 'workspace', 'smoke-alarm', 'co-alarm', 'first-aid', 'pets'],
  },
  {
    title: 'Loft above a bookshop in Fort Kochi',
    city: 'Kochi', country: 'India', lat: 9.9658, lng: 76.2422,
    type: 'Entire rental unit', category: 'city',
    pricePerNight: 5100, cleaningFee: 700, guests: 3, bedrooms: 1, beds: 2, baths: 1,
    description:
      'One flight up from a secondhand bookshop on Bazaar Road. Whitewashed beams, a window seat over the street and the Chinese fishing nets ten minutes on foot. The owner will lend you a bicycle.',
    amenities: ['wifi', 'ac', 'ceiling-fan', 'kitchen', 'coffee', 'fridge', 'microwave', 'crockery', 'tv', 'workspace', 'hot-water', 'washer', 'self-checkin', 'smoke-alarm', 'first-aid'],
  },
  {
    title: 'Lakeside mansion with a private ghat, Udaipur',
    city: 'Udaipur', country: 'India', lat: 24.5760, lng: 73.6860,
    type: 'Entire home', category: 'mansions',
    pricePerNight: 28400, cleaningFee: 4000, guests: 10, bedrooms: 5, beds: 7, baths: 5,
    description:
      'Five bedrooms on Lake Pichola with a ghat of your own and a roof terrace facing the City Palace. Staffed by four, including a cook who has been with the family for twenty years. Boats can collect you from the steps.',
    amenities: ['wifi', 'ac', 'pool', 'kitchen', 'fridge', 'freezer', 'microwave', 'cooking-basics', 'crockery', 'coffee', 'tv', 'sound', 'washer', 'dryer', 'parking', 'ev', 'gym', 'patio', 'bbq', 'hot-water', 'shampoo', 'hair-dryer', 'crib', 'high-chair', 'smoke-alarm', 'co-alarm', 'extinguisher', 'first-aid', 'self-checkin'],
  },
];

export const GUESTS: GuestSeed[] = [
  ['amit@staybnb.dev', 'Amit Deshpande'],
  ['aheesh@staybnb.dev', 'Aheesh Varma'],
  ['sana@staybnb.dev', 'Sana Qureshi'],
  ['tarun@staybnb.dev', 'Tarun Iyer'],
  ['divya@staybnb.dev', 'Divya Nair'],
  ['rhea@staybnb.dev', 'Rhea Kapoor'],
];

export const REVIEW_BODIES: string[] = [
  'Very helpful and responsive team. Safe and peaceful stay, and the photos match exactly what you get.',
  'We had a wonderful stay. Clean, comfortable and the host answered every message within minutes. Would book again without thinking about it.',
  'The location does the heavy lifting here, but the place itself is spotless and the beds are genuinely good.',
  'Check-in took thirty seconds. Water pressure is excellent, wifi held up for a full work day, and the kitchen had everything we needed.',
  'Quieter than we expected given how central it is. We stayed four nights and left wanting two more.',
  'Small things were thought through: spare chargers, an umbrella by the door, proper coffee. That is what made it.',
];

