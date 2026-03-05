// src/constants/tamilNaduLocations.ts

export const TAMIL_NADU_STATE = "Tamil Nadu" as const;

export const TAMIL_NADU_DISTRICTS = {
  Cuddalore: [
    "Cuddalore",
    "Chidambaram",
    "Panruti",
    "Bhuvanagiri",
    "Kattumannarkoil",
    "Kurinjipadi",
    "Tittakudi taluk",
    "Virudhachalam",
  ],
  Chennai: [
    "T. Nagar",
    "Anna Nagar",
    "Velachery",
    "Adyar",
    "Tambaram",
    "Porur",
    "Chrompet",
  ],
  Coimbatore: [
    "Gandhipuram",
    "RS Puram",
    "Peelamedu",
    "Kuniyamuthur",
    "Saibaba Colony",
  ],
  Madurai: ["Anna Nagar", "KK Nagar", "Thiruppalai", "Thiruparankundram"],
  Tiruchirappalli: ["Srirangam", "Thillai Nagar", "Cantonment", "Woraiyur"],
  Salem: ["Ammapet", "Hasthampatty", "Suramangalam", "Fairlands"],
  Erode: ["Perundurai", "Bhavani", "Gobichettipalayam"],
  Tirunelveli: ["Palayamkottai", "Tirunelveli Town", "Melapalayam"],
  Kanchipuram: ["Kanchipuram Town", "Walajabad", "Uthiramerur"],
  Vellore: ["Vellore Town", "Katpadi", "Gudiyatham"],
  Thanjavur: ["Thanjavur Town", "Kumbakonam", "Pattukkottai"],
} as const;

export type TamilNaduDistrict = keyof typeof TAMIL_NADU_DISTRICTS;

export function getDistricts(): TamilNaduDistrict[] {
  return Object.keys(TAMIL_NADU_DISTRICTS) as TamilNaduDistrict[];
}

export function getTaluks(
  district: TamilNaduDistrict
): readonly string[] {
  return TAMIL_NADU_DISTRICTS[district] ?? [];
}
