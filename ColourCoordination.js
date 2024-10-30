function getVaccinationInformationColour(Vaccinations){
if (Vaccinations<10000)
{
    return lightRed;
}
else if (Vaccinations >=10000 && Vaccinations<=99999)
{
    return DarkerRed;
}
else if (Vaccinations >=100000 && Vaccinations <=999999)
{return red;

}
else if (Vaccinations >=1000000)
{return blue;

}
}

function getCasesInformationColour(Cases){
if cases 
}
function getDeathInformationColour(Deaths){
if (Deaths<100)
{
    return lightRed;

}
else if(Deaths>=101 && Deaths <=999)
{
    return DarkerRed;
}
else if(Deaths>=1000 && Deaths <=4999)
{
    return red;
}
else if (Deaths>=5000){
    return blue;
}

}