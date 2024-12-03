// Intensity functions for heatmap
export function getVaccinationMonthlyInformationColour(VaccinationsMonthly) {
    if (VaccinationsMonthly < 730870) return 0.2; // Low intensity
    else if (VaccinationsMonthly <= 3098160) return 0.5; // Medium intensity
    else if (VaccinationsMonthly <= 4880545) return 0.8; // High intensity
    else return 1.0; // Maximum intensity
}

export function getCasesMonthlyInformationColour(Cases) {
    if (Cases < 3) return 0.2; // Low intensity
    else if (Cases <= 223.5) return 0.5; // Medium intensity
    else if (Cases <= 10246) return 0.8; // High intensity
    else return 1.0; // Maximum intensity
}

export function getDeathMonthlyInformationColour(DeathsMonthly) {
    if (DeathsMonthly < 1) return 0.2; // Low intensity
    else if (DeathsMonthly <= 18) return 0.5; // Medium intensity
    else if (DeathsMonthly <= 15909) return 0.8; // High intensity
    else return 1.0; // Maximum intensity
}

 
