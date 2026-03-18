export interface Trip {
  company: string;
  companyLogo: string;
  departure: string;
  arrival: string;
  duration: string;
  origin: string;
  destination: string;
  seatType: string;
  originalPrice: number;
  discountedPrice: number;
  seatsLeft?: number;
  soldOut?: boolean;
}

export const generateTrips = (origin: string, destination: string): Trip[] => {
  const companies = [
    { name: "Andorinha", logo: "🚌" },
    { name: "Caiçara", logo: "🚍" },
    { name: "Viação Garcia", logo: "🚎" },
    { name: "Brasil Sul", logo: "🚐" },
    { name: "Kaissara", logo: "🚌" },
    { name: "Águia Branca", logo: "🚍" },
    { name: "Auto Viação 1001", logo: "🚎" },
    { name: "Boa Esperança", logo: "🚐" },
    { name: "Catedral Turismo", logo: "🚌" },
  ];

  const seatTypes = ["Convencional", "Semi-Leito", "Semi-Leito", "Semi-Leito", "Semi-Leito", "Semi-Leito", "Leito", "Leito", "Leito"];
  const departures = ["06:00", "08:30", "10:00", "18:00", "22:30", "14:30", "23:00", "07:30", "16:00"];
  const durations = ["5h30", "5h45", "5h30", "5h30", "5h15", "5h45", "5h45", "5h30", "5h45"];
  const prices = [54.08, 58.50, 0, 63.88, 69.78, 92.70, 105.46, 112.84, 120.22];

  const originCity = origin.split(",")[0].trim();
  const destCity = destination.split(",")[0].trim();

  return companies.map((c, i) => {
    const dep = departures[i];
    const durHours = parseInt(durations[i].split("h")[0]);
    const durMins = parseInt(durations[i].split("h")[1]) || 0;
    const depH = parseInt(dep.split(":")[0]);
    const depM = parseInt(dep.split(":")[1]);
    const arrH = (depH + durHours + Math.floor((depM + durMins) / 60)) % 24;
    const arrM = (depM + durMins) % 60;

    return {
      company: c.name,
      companyLogo: c.logo,
      departure: dep,
      arrival: `${String(arrH).padStart(2, "0")}:${String(arrM).padStart(2, "0")}`,
      duration: durations[i],
      origin: originCity,
      destination: destCity,
      seatType: seatTypes[i],
      originalPrice: prices[i],
      discountedPrice: prices[i] ? prices[i] / 2 : 0,
      seatsLeft: i === 0 ? 5 : i === 1 ? 9 : i === 4 ? 4 : i === 6 ? 5 : undefined,
      soldOut: i === 2,
    };
  });
};
