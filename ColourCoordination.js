export function getVaccinationMonthlyInformationColour(VaccinationsMonthly) {
    if (VaccinationsMonthly < 50000) return "blue";
    else if (VaccinationsMonthly <= 499999) return "red";
    else if (VaccinationsMonthly <= 1500000) return "DarkerRed";
    else return "lightRed";
}

export function getCasesMonthlyInformationColour(Cases) {
    if (Cases < 100) return "lightRed";
    else if (Cases <= 999) return "DarkerRed";
    else if (Cases <= 4999) return "red";
    else return "blue";
}

export function getDeathMonthlyInformationColour(DeathsMonthly) {
    if (DeathsMonthly < 100) return "lightRed";
    else if (DeathsMonthly <= 999) return "DarkerRed";
    else if (DeathsMonthly <= 4999) return "red";
    else return "blue";
}
