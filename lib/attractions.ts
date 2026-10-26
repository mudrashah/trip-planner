// Curated real places for the offline fallback (used when ANTHROPIC_API_KEY is not set).
// Order matters: neighbours in the list are near each other, so days stay geographically sensible.
export const ATTRACTIONS: Record<string, string[]> = {
  goa: ["Basilica of Bom Jesus", "Se Cathedral", "Fontainhas Latin Quarter", "Fort Aguada", "Calangute Beach", "Baga Beach", "Anjuna Flea Market", "Chapora Fort", "Palolem Beach", "Dudhsagar Falls", "Cabo de Rama Fort"],
  mumbai: ["Gateway of India", "Taj Mahal Palace", "Colaba Causeway", "Marine Drive", "Chhatrapati Shivaji Terminus", "Elephanta Caves", "Haji Ali Dargah", "Bandra-Worli Sea Link", "Juhu Beach", "Sanjay Gandhi National Park"],
  delhi: ["India Gate", "Humayun's Tomb", "Qutub Minar", "Red Fort", "Jama Masjid", "Chandni Chowk", "Lotus Temple", "Akshardham Temple", "Hauz Khas Village", "Lodhi Garden"],
  jaipur: ["Hawa Mahal", "City Palace", "Jantar Mantar", "Amer Fort", "Jal Mahal", "Nahargarh Fort", "Jaigarh Fort", "Johari Bazaar", "Albert Hall Museum", "Chokhi Dhani"],
  udaipur: ["City Palace Udaipur", "Lake Pichola", "Jagdish Temple", "Saheliyon Ki Bari", "Monsoon Palace", "Fateh Sagar Lake", "Bagore Ki Haveli", "Kumbhalgarh Fort"],
  kolkata: ["Victoria Memorial", "Howrah Bridge", "Dakshineswar Kali Temple", "Indian Museum", "Park Street", "College Street Book Market", "Kumartuli", "Princep Ghat"],
  chennai: ["Marina Beach", "Kapaleeshwarar Temple", "Fort St George", "Santhome Cathedral", "Government Museum Chennai", "Mahabalipuram Shore Temple", "DakshinaChitra"],
  bengaluru: ["Lalbagh Botanical Garden", "Bangalore Palace", "Cubbon Park", "Vidhana Soudha", "Tipu Sultan's Summer Palace", "Bannerghatta National Park", "Commercial Street", "Nandi Hills"],
  kochi: ["Chinese Fishing Nets", "Fort Kochi", "Mattancherry Palace", "Jew Town", "Paradesi Synagogue", "Kerala Kathakali Centre", "Marine Drive Kochi"],
  varanasi: ["Dashashwamedh Ghat", "Kashi Vishwanath Temple", "Assi Ghat", "Sarnath", "Manikarnika Ghat", "Ramnagar Fort", "Banaras Hindu University"],
  manali: ["Hadimba Temple", "Old Manali", "Solang Valley", "Rohtang Pass", "Jogini Waterfall", "Vashisht Hot Springs", "Mall Road Manali"],
  paris: ["Eiffel Tower", "Louvre Museum", "Notre-Dame de Paris", "Sainte-Chapelle", "Musée d'Orsay", "Montmartre and Sacré-Cœur", "Arc de Triomphe", "Champs-Élysées", "Palace of Versailles", "Seine River Cruise"],
  london: ["Tower of London", "Tower Bridge", "British Museum", "Buckingham Palace", "Westminster Abbey", "Big Ben", "London Eye", "Borough Market", "Tate Modern", "Camden Market"],
  rome: ["Colosseum", "Roman Forum", "Pantheon", "Trevi Fountain", "Spanish Steps", "Vatican Museums", "St. Peter's Basilica", "Trastevere", "Piazza Navona", "Villa Borghese"],
  barcelona: ["Sagrada Família", "Park Güell", "Casa Batlló", "La Rambla", "Gothic Quarter", "La Boqueria Market", "Barceloneta Beach", "Montjuïc", "Camp Nou"],
  amsterdam: ["Rijksmuseum", "Van Gogh Museum", "Anne Frank House", "Vondelpark", "Jordaan", "Canal Cruise", "Albert Cuyp Market", "Zaanse Schans"],
  tokyo: ["Senso-ji", "Meiji Shrine", "Shibuya Crossing", "Shinjuku Gyoen", "Tokyo Skytree", "Tsukiji Outer Market", "Akihabara", "teamLab Planets", "Ueno Park", "Harajuku Takeshita Street"],
  dubai: ["Burj Khalifa", "Dubai Mall and Fountain", "Dubai Creek and Al Fahidi", "Gold and Spice Souks", "Jumeirah Beach", "Palm Jumeirah", "Desert Safari", "Museum of the Future", "Dubai Marina"],
  singapore: ["Gardens by the Bay", "Marina Bay Sands", "Merlion Park", "Sentosa Island", "Chinatown", "Little India", "Singapore Zoo", "Hawker Centre Maxwell", "Clarke Quay"],
  bangkok: ["Grand Palace", "Wat Pho", "Wat Arun", "Chatuchak Market", "Jim Thompson House", "Khao San Road", "Lumpini Park", "Chinatown Yaowarat", "Damnoen Saduak Floating Market"],
  "new york": ["Statue of Liberty", "Central Park", "Empire State Building", "Times Square", "Brooklyn Bridge", "9/11 Memorial", "Metropolitan Museum of Art", "High Line", "Grand Central Terminal", "DUMBO"],
  "san francisco": ["Golden Gate Bridge", "Alcatraz Island", "Fisherman's Wharf", "Lombard Street", "Painted Ladies", "Golden Gate Park", "Chinatown San Francisco", "Muir Woods"],
  kyoto: ["Fushimi Inari Shrine", "Kiyomizu-dera", "Gion District", "Kinkaku-ji", "Arashiyama Bamboo Grove", "Nishiki Market", "Nijo Castle", "Philosopher's Path"],
  osaka: ["Osaka Castle", "Dotonbori", "Shinsekai", "Kuromon Market", "Universal Studios Japan", "Umeda Sky Building", "Sumiyoshi Taisha"],
  florence: ["Duomo di Firenze", "Uffizi Gallery", "Ponte Vecchio", "Galleria dell'Accademia", "Piazzale Michelangelo", "Boboli Gardens", "Mercato Centrale"],
  venice: ["St. Mark's Basilica", "Doge's Palace", "Rialto Bridge", "Grand Canal Gondola Ride", "Murano", "Burano", "Peggy Guggenheim Collection"],
  madrid: ["Prado Museum", "Royal Palace of Madrid", "Retiro Park", "Plaza Mayor", "Reina Sofía Museum", "Mercado de San Miguel", "Templo de Debod"],
  edinburgh: ["Edinburgh Castle", "Royal Mile", "Holyrood Palace", "Arthur's Seat", "Calton Hill", "National Museum of Scotland", "Dean Village"],
  "chiang mai": ["Doi Suthep", "Old City Temples", "Wat Chedi Luang", "Sunday Walking Street", "Elephant Nature Park", "Night Bazaar", "Doi Inthanon"],
  phuket: ["Big Buddha Phuket", "Old Phuket Town", "Patong Beach", "Phi Phi Islands", "Wat Chalong", "Promthep Cape", "Kata Beach"],
  nice: ["Promenade des Anglais", "Old Town Vieux Nice", "Castle Hill", "Cours Saleya Market", "Musée Matisse", "Èze Village", "Monaco Day Trip"],
  lyon: ["Vieux Lyon", "Basilique Notre-Dame de Fourvière", "Les Halles Paul Bocuse", "Traboules of Croix-Rousse", "Place Bellecour", "Musée des Confluences"],
  "abu dhabi": ["Sheikh Zayed Grand Mosque", "Louvre Abu Dhabi", "Emirates Palace", "Qasr Al Watan", "Yas Island", "Corniche"],
  ahmedabad: ["Sabarmati Ashram", "Adalaj Stepwell", "Sidi Saiyyed Mosque", "Manek Chowk", "Kankaria Lake", "Law Garden Night Market"],
  hyderabad: ["Charminar", "Golconda Fort", "Chowmahalla Palace", "Hussain Sagar Lake", "Ramoji Film City", "Laad Bazaar", "Salar Jung Museum"],
  pune: ["Shaniwar Wada", "Aga Khan Palace", "Sinhagad Fort", "Dagdusheth Ganpati Temple", "Osho Garden", "Parvati Hill"],
};

export function attractionsFor(city: string): string[] | null {
  return ATTRACTIONS[city.trim().toLowerCase()] ?? null;
}
