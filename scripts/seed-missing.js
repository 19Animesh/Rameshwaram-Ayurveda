// scripts/seed-missing.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const rawProducts = [
  // Screenshot 1 & 3 & 4 (Arya Vaidya Sala, AVP, SDM, etc)
  { name: "BALARISHTAM", brand: "ARYA VAIDYA SALA", price: 98.00 },
  { name: "PUNARNAVASAVAM", brand: "AVP", price: 90.00 },
  { name: "SPONDYLON", brand: "NAGARJUNA", price: 725.00 },
  { name: "AMRUTHARISHTAM", brand: "ARYA VAIDYA SALA", price: 90.00 },
  { name: "ANU THAILAM (10ML)", brand: "AVP", price: 90.00 },
  { name: "DASAMOOLAKADUTRAYAM KASHAYAM TAB", brand: "AVP", price: 44.00 },
  { name: "FLASH", brand: "AVP", price: 72.00 },
  { name: "GANDHA THAILAM 25ML", brand: "ARYA VAIDYA SALA", price: 200.00 },
  { name: "PINDA THAILAM", brand: "ARYA VAIDYA SALA", price: 144.00 },
  { name: "RAJAPRABARTHINI VATIKA", brand: "ARYA VAIDYA SALA", price: 578.00 },
  { name: "RASNERANDADI KASHAYAM TAB", brand: "AVP", price: 65.00 },
  { name: "ABHAYARISHTAM", brand: "ARYA VAIDYA SALA", price: 90.00 },
  { name: "KSHREERBALA THAILAM 101", brand: "ARYA VAIDYA SALA", price: 116.00 },
  { name: "KSHREERABALA THAILAM 101", brand: "ARYA VAIDYA SALA", price: 282.00 },
  { name: "MANASAMITHARAVATAKAM GULIKA", brand: "ARYA VAIDYA SALA", price: 235.00 },
  { name: "ARAGWADHADHI KASHYA", brand: "ARYA VAIDYA SALA", price: 122.00 },
  { name: "ASHWAGANDHARISHTHAM", brand: "ARYA VAIDYA SALA", price: 149.00 },
  { name: "BALA THAILAM SOFT GEL CAP", brand: "AVP", price: 48.00 },
  { name: "GULGULUTHIKTHAKA GRITH", brand: "ARYA VAIDYA SALA", price: 245.00 },
  { name: "DHANWANTHARAM THAILAM 200ML", brand: "AVP", price: 192.00 },
  { name: "PUNARNAVADI KASHAYA", brand: "ARYA VAIDYA SALA", price: 120.00 },
  { name: "PUNARNAVADI KASHAYAM TAB", brand: "ARYA VAIDYA SALA", price: 43.00 },
  { name: "RASNASAPTHAKAM KASHAY", brand: "ARYA VAIDYA SALA", price: 135.00 },
  { name: "THIKTHAKA GRITHAM", brand: "ARYA VAIDYA SALA", price: 186.00 },
  
  // Screenshot 2
  { name: "DASHANG LEPA100G", brand: "SDM", price: 100.00 },
  { name: "ZANDOPA", brand: "ZANDU", price: 250.00 },
  { name: "FINBID CAPSULE", brand: "ZOETIC", price: 90.00 },
  { name: "RASNADI CHURNA 10GM", brand: "SDM", price: 30.00 },
  { name: "AVIPATIKAR CHURAN 100GM", brand: "SDM", price: 140.00 },
  { name: "BALASHWAGANDHA LAXADI TAIL 200ML", brand: "SDM", price: 270.00 },
  { name: "MAHANARAYAN TAIL 200ML", brand: "SDM", price: 270.00 },
  { name: "KSHEERBALA TAIL 200ML", brand: "SDM", price: 210.00 },
  { name: "GANDHARVA HASTADI TAIL 200ML", brand: "SDM", price: 190.00 },
  { name: "PIND TAILA 200ML", brand: "SDM", price: 190.00 },
  { name: "SPONDYLON CAP", brand: "NAGARJUNA", price: 72.50 },
  { name: "CHANDRAPRABHA VATI DS 100TAB", brand: "SDM", price: 310.00 },
  { name: "GANDHARVA HASTADI TAILA", brand: "SDM", price: 210.00 },
  { name: "KOTTAMCHUKKADI TAILA 200ML", brand: "SDM", price: 210.00 },
  { name: "SANDHILIN 30ML", brand: "SDM", price: 90.00 },
  { name: "SANDHILIN 100ML", brand: "SDM", price: 250.00 },
  { name: "SHATAVARI KALPA 350GM", brand: "DHOOTAPAPESHWAR", price: 295.00 },
  { name: "PINDA TAILA- 200ML", brand: "SDM", price: 210.00 },
  { name: "MURIVENNA -1LTR", brand: "SDM", price: 875.00 },
  { name: "YOGRAJ GUGGULU DS 1000TAB", brand: "SDM", price: 1950.00 },
  { name: "LAGHUSOOTSHEKHAR VATI DS 100", brand: "SDM", price: 145.00 },
  { name: "TRAYODASHANG GUGGULU -100TAB", brand: "SDM", price: 200.00 },
  { name: "SHIVA GUTIKA 30PILLS", brand: "SDM", price: 260.00 },
  { name: "GANDHA KARPOOR 10GM", brand: "SDM", price: 35.00 },
  { name: "HARITAKI 100TAB", brand: "SDM", price: 145.00 },
  { name: "MURIVENNA 1LTR", brand: "SDM", price: 800.00 },
  { name: "BALASHWAGANDHA LAXADI TAIL", brand: "SDM", price: 130.00 },
  { name: "BHRIT SAINDHAVADI TAIL 200ML", brand: "SDM", price: 210.00 },
  { name: "BHRIT SAINDHAVADI TAIL 100ML", brand: "SDM", price: 125.00 },
  { name: "MOORCHIT TAIL 200ML", brand: "SDM", price: 140.00 },
  { name: "KAKLARAKSHAK YOG 30 TAB", brand: "DHOOTAPAPESHWAR", price: 345.00 },
  { name: "SERANKOTTAI NEI CAP100", brand: "Others", price: 73.00 },
  { name: "BHRIT SAINDHAVAIDI TAIL 200ML II", brand: "SDM", price: 240.00 },
  { name: "DASHANG LEP", brand: "SDM", price: 100.00 },

  // Screenshot 3
  { name: "Rhukot Linement 60 ML", brand: "ARYA VAIDYA SALA", price: 125.00 },
  { name: "Dazzle Bs Tab", brand: "Flora", price: 90.00 },
  { name: "Rhukot Liniment 100 Ml", brand: "ARYA VAIDYA SALA", price: 205.00 },
  { name: "KATAKAKHADIRADI KASHAYA", brand: "ARYA VAIDYA SALA", price: 105.00 },
  { name: "GANDHARVAHASTHA TAILAM", brand: "Vaidya Ratnam", price: 100.00 },
  { name: "BALA TAIL SOFT GEL CAPSULE", brand: "Vaidya Ratnam", price: 70.00 },
  { name: "C HEALTH FORTE", brand: "AVP", price: 250.00 },
  { name: "KATAKAKHDIRADI", brand: "AVP", price: 105.00 },
  { name: "POOGA TRIM", brand: "SDM", price: 120.00 },
  { name: "SANDHILIN", brand: "SDM", price: 250.00 },
  { name: "LASHUNA RASAYANA CAP", brand: "SDM", price: 150.00 },
  { name: "KOTTAMCHUKADI TAILL", brand: "AVP", price: 144.00 },
  { name: "DAZZLE - BS TAB", brand: "VASU HEALTHCARE", price: 90.00 },
  { name: "BRAHMIGRITA", brand: "ARYA VAIDYA SALA", price: 175.00 },
  { name: "BRAHMIGRITHAM", brand: "ARYA VAIDYA SALA", price: 175.00 },
  { name: "PANCHAKOLA CHOORAN", brand: "ARYA VAIDYA SALA", price: 55.00 },
  { name: "RASNAYOGARAJA GULGUL", brand: "ARYA VAIDYA SALA", price: 278.00 },
  { name: "SAHACHARADI KASHAYAM", brand: "ARYA VAIDYA SALA", price: 122.00 },
  { name: "INDUKANTHA GRITHAM", brand: "ARYA VAIDYA SALA", price: 185.00 },
  { name: "KOKILASHAKAM KASHAY", brand: "ARYA VAIDYA SALA", price: 109.00 },
  { name: "KESHEERABALA THAILAM", brand: "ARYA VAIDYA SALA", price: 166.00 },
  { name: "MAHAKALYANAKA GRITH", brand: "ARYA VAIDYA SALA", price: 240.00 },
  { name: "MANJISHTADI KASHAY", brand: "ARYA VAIDYA SALA", price: 165.00 },
  { name: "MANJISHTADIKASHAYAM TAB", brand: "ARYA VAIDYA SALA", price: 60.00 },

  // Screenshot 4
  { name: "PYROPLEX LINIMENT", brand: "ARYA VAIDYA SALA", price: 125.00 },
  { name: "KAMDUGHA MOUKTIK", brand: "ARYA VAIDYA SALA", price: 261.00 },
  { name: "RAJPRAVARTHI VATI", brand: "ARYA VAIDYA SALA", price: 137.00 },
  { name: "CHANDRAPRABHA VATI", brand: "ARYA VAIDYA SALA", price: 111.00 },
  { name: "PUNARNAVA MANDOOR", brand: "ARYA VAIDYA SALA", price: 176.00 },
  { name: "AROGYAVARDINI VATI", brand: "ARYA VAIDYA SALA", price: 123.00 },
  { name: "MAHVATVIDWANSK RAS", brand: "ARYA VAIDYA SALA", price: 155.00 },
  { name: "KOLAKULATHADI CHOORNAM", brand: "ARYA VAIDYA SALA", price: 624.00 },
  { name: "STRESSCOM CAP", brand: "DABUR", price: 76.00 },
  { name: "SHATAVARI CAPSULE", brand: "SDM", price: 130.00 },
  { name: "LASHUNA RASAYAN CAPSULE", brand: "SDM", price: 150.00 },
  { name: "MANASMITRA VATAKAM", brand: "NAGARJUNA", price: 600.00 },
  { name: "GULGULUTHIKTHAKA GRITHAM", brand: "AVP", price: 243.00 },
  { name: "TRAYODASANGA GUGGULU 100 TAB", brand: "SDM", price: 230.00 },
  { name: "KAISHOR GUGGULU", brand: "SDM", price: 230.00 },
  { name: "SHIVA GUTIKA SDM", brand: "SDM", price: 835.00 },
  { name: "MRITYUNJAY RAS 100 TAB", brand: "SDM", price: 130.00 },
  { name: "ASHWAGANDHA CAP 40", brand: "SDM", price: 150.00 },
  { name: "NIRGUNDI TAILA 1 LIT", brand: "SDM", price: 960.00 },
  { name: "MOORCHITA TAILA 100 ML", brand: "SDM", price: 75.00 },
  { name: "ASTHIPOSHAK", brand: "DHOOTAPAPESHWAR", price: 262.00 },
  { name: "BALARISHTAM 450ML", brand: "AVP", price: 105.00 },
  { name: "HINGVASTAK CHURNA 100 GM", brand: "SDM", price: 140.00 },
  { name: "DHASAHNGA LEPA 100 GM", brand: "SDM", price: 100.00 },
  { name: "DHANVANTARAM VATI 50 TAB", brand: "SDM", price: 80.00 },
  { name: "DASHMOOL KATUTRYADI KASHAYA", brand: "SDM", price: 160.00 },
  { name: "KANAKASAVAM", brand: "ARYA VAIDYA SALA", price: 85.00 },
  { name: "KHADIRAARISTHAM 450 ML", brand: "ARYA VAIDYA SALA", price: 125.00 },
  { name: "ARVINDASAVAM 450 ML", brand: "ARYA VAIDYA SALA", price: 90.00 },
  { name: "ASTHIPOSHAK 30 TAB", brand: "DHOOTAPAPESHWAR", price: 146.00 },
  { name: "KUTJARISTAM", brand: "ARYA VAIDYA SALA", price: 100.00 },
  { name: "VASAKADYARISTAM 450 ML", brand: "ARYA VAIDYA SALA", price: 140.00 },
  { name: "KESHOREGUGLE 100TAB", brand: "SDM", price: 230.00 },

  // Screenshot 5
  { name: "GANDHARV HASTADI TAIL CAP", brand: "SKM SIDDHA", price: 55.00 },
  { name: "MANIBHADRA GUD 100G", brand: "SDM", price: 80.00 },
  { name: "AMLANT TAB", brand: "MAHARISHI", price: 30.00 },
  { name: "SHALLAKI 60TAB", brand: "HIMALAYA", price: 180.00 },
  { name: "PYROFLEX 30ML", brand: "SOLUMIKS", price: 125.00 },
  { name: "PIPPALYASAVAM 450ML", brand: "AVP", price: 94.00 },
  { name: "GULGULUTHIKTHAKAM KASHYAM 200ML", brand: "AVP", price: 230.00 },
  { name: "SAHACHARADI TAILAM", brand: "AVP", price: 180.00 },
  { name: "PRAVAL PISHTI (5GM)", brand: "DHOOTAPAPESHWAR", price: 195.00 },
  { name: "LAKSHADI GUGGGUL TAB", brand: "DHOOTAPAPESHWAR", price: 170.00 },
  { name: "TANKAN BHASAM", brand: "BAIDYANATH", price: 110.00 },
  { name: "KSHEERBALA TAIL 1LTR", brand: "SDM", price: 875.00 },
  { name: "LAXMI VILAS (NARADEEYA)", brand: "DHOOTAPAPESHWAR", price: 103.00 },
  { name: "ABHRA LOHA 30 TAB", brand: "DHOOTAPAPESHWAR", price: 140.00 },
  { name: "BALARISHTAM 450ML", brand: "SKM SIDDHA", price: 104.00 },
  { name: "PUNARNAVADI KASHAYAM 200ML", brand: "KOTTAKKAL", price: 120.00 },
  { name: "MAHAVATVIDHWANSAN RAS 60 TAB", brand: "DHOOTAPAPESHWAR", price: 170.00 },
  { name: "NUTRELA VIT (D-2K) 60CAP", brand: "PATANJALI", price: 250.00 },
  { name: "NUTRELA SPRULINA 60TAB", brand: "PATANJALI", price: 250.00 },
  { name: "BRAHMI TAILAM 200ML", brand: "KOTTAKKAL", price: 130.00 },
  { name: "PIND TAILA - 1LTR", brand: "SDM", price: 875.00 },
  { name: "C - HEALTH FORTE 200G", brand: "KOTTAKKAL", price: 250.00 },
  { name: "KAPIKACHU 40CAP", brand: "SDM", price: 230.00 },
  { name: "EKANGVEER RAS", brand: "DHOOTAPAPESHWAR", price: 100.00 },
  { name: "KAMADUGHA (PLAIN) 30TAB", brand: "DHOOTAPAPESHWAR", price: 92.00 },
  { name: "SITOPLADI CHURNA 100GM", brand: "SDM", price: 130.00 },
  { name: "SHALLAKI CAPSULE", brand: "SDM", price: 250.00 },
  { name: "MAHANARAYAN TAIL 1LTR", brand: "SDM", price: 1125.00 },
  { name: "FLASH CAPSULE", brand: "AVP", price: 90.00 },
  { name: "TALISAPATRADI CHURNA", brand: "ARYA VAIDYA SALA", price: 20.00 },
  { name: "RASNADI CHURNA 10G PACK", brand: "ARYA VAIDYA SALA", price: 20.00 },
  { name: "SITOPALADI CHURNAM 30GM", brand: "ARYA VAIDYA SALA", price: 45.00 },
  { name: "TALISULE GRANULE 100G", brand: "KOTTAKKAL", price: 85.00 },
  { name: "AMAVATARI RASA 60TAB", brand: "DHOOTAPAPESHWAR", price: 130.00 },

  // Screenshot 6
  { name: "KANCHANAR GUGGLU", brand: "SDM", price: 230.00 },
  { name: "TRIPHALA GUGGULU DS 100 TAB", brand: "SDM", price: 200.00 },
  { name: "CHITRAKADI BATI 40TAB", brand: "BAIDYANATH", price: 54.00 },
  { name: "AMLAPITTA MISHRAN 200ML", brand: "DHOOTAPAPESHWAR", price: 150.00 },
  { name: "AROGYAVARDHINI RASA 100TAB", brand: "SDM", price: 170.00 },
  { name: "RASNAYOGRAJ GUGGULU KASHAYA", brand: "AVP", price: 285.00 },
  { name: "MURIVENNA 200ML", brand: "SDM", price: 210.00 },
  { name: "BALASHWAGANDHA LAXADI TAIL 100ML", brand: "SDM", price: 140.00 },
  { name: "MANJISHTADI KASHAYAM 200ML", brand: "AVP", price: 170.00 },
  { name: "CERVILON SOFT GEL CAP", brand: "AVN AYURVEDA", price: 960.00 },
  { name: "ASHWAGANDHARISTHA 450ML", brand: "DHOOTAPAPESHWAR", price: 206.00 },
  { name: "ASHWAGANDHARISHTA 200ML", brand: "DHOOTAPAPESHWAR", price: 115.00 },
  { name: "SAHACHARADI TAIL 200ML", brand: "SDM", price: 230.00 },
  { name: "SAHACHARADI KASHAYAM 200ML", brand: "Vaidya Ratnam", price: 140.00 },
  { name: "PALSINEURON CAPSULE", brand: "SG PYTHO PHARMA", price: 720.00 },
  { name: "GULGULUTHIKTHAKA GRITHA", brand: "AVP", price: 243.00 },
  { name: "MAHATHIKTHAKA GRITHAM", brand: "AVP", price: 208.00 },
  { name: "SANDHILIN OIL", brand: "SDM", price: 90.00 },
  { name: "NUTRELA VIT (B12) 30CAP", brand: "PATANJALI", price: 150.00 },
  { name: "NUTRELA BONE HEALTH 30CAP", brand: "PATANJALI", price: 250.00 },
  { name: "PATHYADI KADHA 450ML", brand: "DHOOTAPAPESHWAR", price: 220.00 },
  { name: "JATYADI TAIL 200ML", brand: "SDM", price: 220.00 },
  { name: "JATYADI TAILA 200ML", brand: "SDM", price: 230.00 },
  { name: "GANDHA KARPOORA 10GM", brand: "SDM", price: 38.00 },
  { name: "TRIVIRT LEHAM", brand: "ARYA VAIDYA SALA", price: 105.00 },
  { name: "VISHTINDOOK VATI 90TAB", brand: "DHOOTAPAPESHWAR", price: 80.00 },
  { name: "BRAHMI VATI 60TAB", brand: "DHOOTAPAPESHWAR", price: 240.00 },
  { name: "ELADI VATI 60TAB", brand: "DHOOTAPAPESHWAR", price: 180.00 },
  { name: "SANJEEVANI VATI 50TAB", brand: "DHOOTAPAPESHWAR", price: 80.00 },
  { name: "BRIHAT VAAT CHINTAMANI RAS", brand: "DHOOTAPAPESHWAR", price: 815.00 },
  { name: "KSHEERBALA (101) 10ML", brand: "AVP", price: 116.00 },
  { name: "KSHEERBALA (101) 25ML", brand: "AVP", price: 282.00 },
  { name: "INDUKANTHA GRITHAM (150G)", brand: "AVP", price: 190.00 },

  // Screenshot 7
  { name: "CARDIMAP TAB", brand: "MAHARISHI", price: 50.00 },
  { name: "GANDHARVA HASTADI TAIL 100ML", brand: "SDM", price: 110.00 },
  { name: "OSTOLIEF NUTRA 30TAB", brand: "CHARAK PHARMA", price: 475.00 },
  { name: "DASAMOOLARISHTHAM 450ML", brand: "AVP", price: 125.00 },
  { name: "PRABHAKAR VATI 60TAB", brand: "DHOOTAPAPESHWAR", price: 185.00 },
  { name: "AJMODADI CHURNA", brand: "DIVYA PHARMACY", price: 56.00 },
  { name: "SINGHNAD GUGGULU TAB", brand: "SDM", price: 150.00 },
  { name: "KSHEERBALA 101 SOFTGEL CAP", brand: "AVP", price: 75.00 },
  { name: "VIDANGARISTA 450ML", brand: "SDM", price: 130.00 },
  { name: "CONTRED LS SUPPORT L", brand: "TYNOR", price: 1205.00 },
  { name: "KNEE CAP (PAIR) XL", brand: "TYNOR", price: 355.00 },
  { name: "FUNCTIONAL KNEE SUPPORT M", brand: "TYNOR", price: 1360.00 },
  { name: "CONTRED LS BELT OAC L", brand: "TYNOR", price: 720.00 },
  { name: "KNEE CAP COMFEEL (PAIR) L", brand: "TYNOR", price: 455.00 },
  { name: "FUNCTIONAL KNEE SUPPORT L", brand: "TYNOR", price: 1360.00 },
  { name: "KNEE CAP (PAIR) L", brand: "TYNOR", price: 355.00 },
  { name: "CERVICAL PILLOW REGULAR UN", brand: "TYNOR", price: 1300.00 },
  { name: "CONTOURED LS SUPPORT M", brand: "TYNOR", price: 1205.00 },
  { name: "CONTRED LS BELT OAC M", brand: "TYNOR", price: 720.00 },
  { name: "KNEE CAP COMFEEL (PAIR) SPL XL", brand: "TYNOR", price: 455.00 },
  { name: "FUCTIONAL KNEE SUPPORT SPL XL", brand: "TYNOR", price: 1270.00 },
  { name: "CHITRAKASAVA 450ML", brand: "SDM", price: 150.00 },
  { name: "PUNARNAVADI KASHAYAM (200ML)", brand: "AVP", price: 140.00 },
  { name: "AMRUTHARISHTAM 450ML", brand: "AVP", price: 90.00 },
  { name: "VASARISHTAM 450ML", brand: "AVP", price: 150.00 },
  { name: "SPONDYLON CAPSULE", brand: "NAGARJUNA", price: 72.50 },
  { name: "TRAYODASHANGA GUGGULU", brand: "SDM", price: 230.00 },

  // Screenshot 8
  { name: "SHANKHAVATI 50TAB", brand: "DHOOTAPAPESHWAR", price: 129.00 },
  { name: "ASTHIPOSHAK (30TAB)", brand: "DHOOTAPAPESHWAR", price: 146.00 },
  { name: "SHWASKUTHAR RAS 60TAB", brand: "DHOOTAPAPESHWAR", price: 115.00 },
  { name: "ASHOKA RISTHA", brand: "DHOOTAPAPESHWAR", price: 140.00 },
  { name: "RASNADI KASHAYAM 200ML", brand: "AVP", price: 207.00 },
  { name: "KAISHOR GUGGULU 100TAB", brand: "SDM", price: 230.00 },
  { name: "KOTTAMCHUKKADI CHURNAM", brand: "ARYA VAIDYA SALA", price: 950.00 },
  { name: "MANASMITRA VATAKAM TAB", brand: "SKM SIDDHA", price: 118.30 },
  { name: "EKANGVEER RASA 60TAB", brand: "DHOOTAPAPESHWAR", price: 207.00 },
  { name: "RASA RAJESHWAR RAS", brand: "DHOOTAPAPESHWAR", price: 1247.00 },
  { name: "KANCHANARA GUGGULU 100TAB", brand: "SDM", price: 230.00 },
  { name: "SARASWATA RISHTAM 450ML", brand: "SKM SIDDHA", price: 350.00 },
  { name: "PATOLAMULADI KASHYAM 200ML", brand: "KOTTAKKAL", price: 165.00 },
  { name: "VARNADI KASHAYAM", brand: "AVP", price: 114.00 },
  { name: "DHANWANTHRAM THAILAM 200ML", brand: "AVP", price: 205.00 },
  { name: "PINDA THAILAM 200ML", brand: "AVP", price: 155.00 },
  { name: "KALYANKA GRITHAM", brand: "AVP", price: 180.00 },
  { name: "ASTHIPOSHAK 60TAB", brand: "DHOOTAPAPESHWAR", price: 262.00 },
  { name: "GANDHARVAHASTADI KASHAYA", brand: "KOTTAKKAL", price: 110.00 },
  { name: "BONARTHO CAP", brand: "SHREE DHANWANTRI", price: 270.00 },
  { name: "BRAINTONE SYRUP", brand: "SHREE DHANWANTRI", price: 145.00 },
  { name: "LAXMI VILAS NARDEEYA", brand: "DHOOTAPAPESHWAR", price: 108.00 },
  { name: "KSHEERBALA THAILAM 5LTR", brand: "AVP", price: 3943.00 },
  { name: "YOGRAJ GUGGULU DS100TAB", brand: "SDM", price: 230.00 },
  { name: "GULKAND 200GM", brand: "DHOOTAPAPESHWAR", price: 165.00 },
  { name: "CHANDRAPRABHA VATI 100TAB", brand: "SDM", price: 310.00 },
  { name: "GOKSHURADI GUGGULU 100TAB", brand: "SDM", price: 230.00 },
  { name: "MANYAWIN CAP", brand: "SKM SIDDHA", price: 360.00 },
  { name: "SMIRTISAGAR RASA TAB", brand: "DHOOTAPAPESHWAR", price: 195.00 },
  { name: "OBENYL TAB", brand: "CHARAK PHARMA", price: 95.00 },
  { name: "RASNASAPTAKAM KASHAYA TAB", brand: "Vaidya Ratnam", price: 48.00 },
  { name: "KSHEERBALA THAILAM 200ML", brand: "AVP", price: 175.00 },
  { name: "PRAVLA PANCHAMRIT TAB", brand: "DHOOTAPAPESHWAR", price: 146.00 },
  { name: "MUKTA PISHTI", brand: "DHOOTAPAPESHWAR", price: 475.00 }
];

async function seedMissingProducts() {
  console.log(`Starting to verify and inject ${rawProducts.length} transcribed products...`);
  
  let inserted = 0;
  let skipped = 0;

  for (const p of rawProducts) {
    // Check if it exists exactly or case-insensitively
    const existing = await prisma.product.findFirst({
      where: {
        name: { equals: p.name, mode: 'insensitive' },
        brand: { equals: p.brand, mode: 'insensitive' }
      }
    });

    if (existing) {
      skipped++;
      continue;
    }

    // Insert brand new product
    const newId = 'prod_missing_' + Math.floor(Math.random() * 999999);
    
    await prisma.product.create({
      data: {
        id: newId,
        name: p.name,
        brand: p.brand,
        price: p.price,
        originalPrice: p.price * 1.2, // Rough markup
        category: 'wellness', // default
        description: `${p.name} by ${p.brand} is a premium Ayurvedic formulation designed for general wellness and vitality.`,
        rating: 4.0 + (Math.random() * 1.0),
        reviewCount: Math.floor(Math.random() * 50),
        stock: 50,
        expiryDate: '2028-01-01',
        dosage: 'As directed by physician',
        howToConsume: 'Take with warm water',
        sideEffects: 'None reported if taken correctly',
        image: '' // Will be updated by upload-images.js
      }
    });
    console.log(`✅ Injected: ${p.name}`);
    inserted++;
  }

  console.log(`\n🎉 FINISHED! Injected: ${inserted} | Skipped (Already existed): ${skipped}`);
}

seedMissingProducts()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
