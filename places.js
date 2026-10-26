// Where a scene is set: the city's districts, and the First Readers rulebook's types of location (Crafting and Running
// Scenes, pages 204-208), each with its similar locations as the alternatives. A scene's place is
// { district, type, alternative, location }: the first three from these lists ("" for none), the last typed in.
// No page code here, so it can be tested in Node.
(function (root) {
  const DISTRICTS = ["D03 - Financial District", "D04 - Industrial District"];

  const TYPES = [
    { name: "Apartments", alternatives: ["Hacker's hovel", "Luxury penthouse", "Studio apartment", "Subsidized tenement", "Private home base in the Network"] },
    { name: "Arenas", alternatives: ["Fight club", "Race track", "Sports stadium", "Amphitheater", "Concert hall", "Robot fighting ring",
      "Illegal street racing course", "Virtual sports venue in the Network", "Pirate music room in the Network"] },
    { name: "Bars", alternatives: ["Dive bar", "Swanky cocktail bar", "Speakeasy", "Run-down pool hall",
      "Bar that caters exclusively to the Right Kind of People", "Bottle shop/winery"] },
    { name: "Clubs", alternatives: ["Trendy dance club", "Upscale night club", "Avant-garde music venue", "Members-only private club", "Strip club",
      "Gun range", "Virtual reality sex club in the Network"] },
    { name: "Corporate Branches", alternatives: ["Bank branch", "District sales office", "District human resources branch",
      "Private security dispatch hub", "Corporate user portal in the Network"] },
    { name: "Digital Infrastructure", alternatives: ["Data center", "Elder God's brain", "Police/private security dispatch switch",
      "Network traffic routing station", "Telcom broadcast tower", "Ghost backup server farm"] },
    { name: "Factories", alternatives: ["Vehicle assembly plant", "Consumer goods manufactory", "Food processing center",
      "Industrial materials refinery", "Waste treatment plant", "Package-routing/sorting facility"] },
    { name: "Gaming Dens", alternatives: ["Underground dice/card room", "Classic arcade", "High roller's table", "Illegal backroom casino",
      "Sports betting hall", "Digital prediction market in the Network"] },
    { name: "Garages", alternatives: ["Multilevel parking structure", "Aircar landing pad", "Illegal chop shop", "Car rental facility", "Taxi depot",
      "Public bus graveyard"] },
    { name: "Hotels", alternatives: ["Luxury resort", "Seedy motel", "Capsule hotel", "Safe house for the Right Kind of People", "Decrepit hostel"] },
    { name: "Laboratories", alternatives: ["Cloning laboratory", "Police forensics lab", "Research and development lab",
      "Experimental software testing lab in the Network", "Illegal drug lab"] },
    { name: "Mass Transit Stations", alternatives: ["Subway or light rail station", "Intercity rail terminal", "Self-driving car hub",
      "Electric bus terminal"] },
    { name: "Medical Clinics", alternatives: ["Corporate hospital", "Luxury wellness resort", "Black market augmentation clinic", "Cybernetics clinic",
      "Gene therapy center", "Private executive physician's office", "Public urgent care clinic"] },
    { name: "Offices", alternatives: ["Corporate headquarters", "Government bureau branch", "Cubicle farm", "Crime lord's private office",
      "One of the last small businesses", "Virtual board room in the Network", "Executive's sanctum in the Network"] },
    { name: "Police Station", alternatives: ["Security checkpoint", "Private security barracks", "District precinct", "Detention center/jail",
      "Digital imprisonment node for ghosts of convicted criminals in the Network", "Private detective's office", "Military outpost",
      "Digital/information security branch in the Network"] },
    { name: "Power Stations", alternatives: ["Aging electric grid substation", "Smart electric grid hub", "Solar collector farm", "Wind turbine farm",
      "Nuclear power plant"] },
    { name: "Public Spaces", alternatives: ["Park", "Memorial", "Tourist-filled square", "Sculpture garden", "Public plaza"] },
    { name: "Religious Sites", alternatives: ["Historic cathedral", "Private shrine", "Small chapel built into another kind of building",
      "Secret meeting place for a cult", "Virtual temple to an Elder God in the Network"] },
    { name: "Restaurants", alternatives: ["Comfortable blue-collar diner", "Greasy fast food joint", "Food truck or food cart",
      "Fine dining establishment", "Overpriced trendy restaurant", "Gimmick/theme restaurant",
      "Local favorite eatery on the verge of going out of business"] },
    { name: "Service Providers", alternatives: ["Mechanic's garage", "Gunsmith's workshop", "Computer repair shop",
      "Synthetic shell maintenance center"] },
    { name: "Storage Facilities", alternatives: ["Corporate warehouse", "Self-storage facility", "Cryogenic storage bunker", "Docks", "Garbage dump",
      "Shipping container yard", "Junkyard"] },
    { name: "Stores", alternatives: ["Big box store", "Shopping mall", "Pawn shop", "Neighborhood bodega", "Criminal fence's stockroom",
      "Guns and ammo wholesaler", "Corporate pharmacy", "Luxury boutique catering to executives", "Fuel station/travel plaza"] },
    { name: "Unsafe Structures", alternatives: ["Abandoned building", "Construction site", "Piece of damaged city infrastructure",
      "Data-corrupted Network node"] },
    { name: "Vending", alternatives: ["Automatic teller machine", "Automat food vendor", "Conveyor belt sushi restaurant", "Ammo printer",
      "Vending machine gallery", "Public nanoprinting kiosk", "Emergency medical booth"] },
  ];

  const NO_PLACE = { district: "", type: "", alternative: "", location: "" };
  const typeOf = (name) => TYPES.find((t) => t.name === name) ?? null;
  // A type of place's alternatives ([] for none, or one that isn't a type).
  const alternatives = (type) => typeOf(type)?.alternatives ?? [];
  const str = (v) => (typeof v === "string" ? v.trim() : "");

  // A place read back from storage or an import file: anything not on its list is none, and an alternative must be
  // one of its type's.
  function cleanPlace(raw) {
    const district = DISTRICTS.includes(raw?.district) ? raw.district : "";
    const type = typeOf(raw?.type) ? raw.type : "";
    const alternative = alternatives(type).includes(raw?.alternative) ? raw.alternative : "";
    return { district, type, alternative, location: str(raw?.location) };
  }

  // A change to one part of a place: a new type of place clears an alternative that isn't one of its own.
  const changePlace = (place, changes) => cleanPlace({ ...place, ...changes });

  // A random district, type of place, and one of that type's alternatives; the location stays as it is.
  // rng() gives a number in [0, 1).
  function randomPlace(place, rng = Math.random) {
    const pick = (list) => list[Math.floor(rng() * list.length)];
    const type = pick(TYPES);
    return { ...cleanPlace(place), district: pick(DISTRICTS), type: type.name, alternative: pick(type.alternatives) };
  }

  // The place in a line ("D03 - Financial District · Bars · Dive bar · The Rusty Nail"), "" for none.
  const placeLabel = (place) => {
    const p = cleanPlace(place);
    return [p.district, p.type, p.alternative, p.location].filter(Boolean).join(" · ");
  };

  root.NCD_PLACES = { DISTRICTS, TYPES, NO_PLACE, alternatives, cleanPlace, changePlace, randomPlace, placeLabel };
})(globalThis);
