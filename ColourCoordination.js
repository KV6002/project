function getVaccinationMonthlyInformationColour(VaccinationsMonthly){
if (VaccinationsMonthly<50000)
{
    return blue;
}
else if (VaccinationsMonthly >=50000 && VaccinationsMonthly<=499999)
{
    return red;
}
else if (VaccinationsMonthly >=500000 && VaccinationsMonthly <=1500000)
{return DarkerRed;

}
else if (VaccinationsMonthly >=1500000)
{
    return lightRed;

}
}
//function getVaccinationWeeklyInformationColour(VaccinationWeekly){
    if (VaccinationWeekly<50000)
        {
            return blue;
        }
        else if (VaccinationWeekly >=50000 && VaccinationWeekly<=499999)
        {
            return red;
        }
        else if (VaccinationWeekly >=500000 && VaccinationWeekly <=1500000)
        {return DarkerRed;
        
        }
        else if (VaccinationWeekly >=1500000)
        {
            return lightRed;
        
        }
        // }
// }

function getCasesMonthlyInformationColour(Cases){
    if (Cases<100)
        {
            return lightRed;
        
        }
        else if(Cases>=101 && Cases <=999)
        {
            return DarkerRed;
        }
        else if(Cases>=1000 && Cases <=4999)
        {
            return red;
        }
        else if (Cases>=5000){
            return blue;0} 
}
function getDeathMonthlyInformationColour(DeathsMonthly){
if (DeathsMonthly<100)
{
    return lightRed;

}
else if(DeathsMonthly>=101 && DeathsMonthly <=999)
{
    return DarkerRed;
}
else if(DeathsMonthly>=1000 && DeathsMonthly <=4999)
{
    return red;
}
else if (DeathsMonthly>=5000){
    return blue;
}

}