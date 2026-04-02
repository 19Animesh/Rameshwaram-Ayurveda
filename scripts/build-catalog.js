// This script creates the compact product-catalog.js with 200 products
const fs = require('fs');
const path = require('path');

const PRODUCTS_BY_CATEGORY = {
  immunity: {
    brands: ['Dabur','Himalaya','Patanjali','Organic India','Zandu','Baidyanath'],
    items: [
      ['Ashwagandha Churna',180,220,'Adaptogenic powder from Withania somnifera roots for stress and vitality.',['Ashwagandha root powder'],'3-6g twice daily with warm milk',true],
      ['Giloy Ghanvati',80,100,'Immunity enhancer from Tinospora cordifolia for blood purification.',['Giloy extract'],'1-2 tablets twice daily',false],
      ['Tulsi Drops',200,250,'Concentrated extract of three Tulsi varieties for respiratory wellness.',['Rama Tulsi','Krishna Tulsi','Vana Tulsi'],'5-10 drops twice daily',false],
      ['Amla Juice',110,130,'Pure Indian Gooseberry juice rich in Vitamin C.',['Amla juice extract'],'20-30ml twice daily',false],
      ['Ashwagandha Tablets',210,260,'Convenient tablet form for stress relief and stamina.',['Ashwagandha root extract'],'1 tablet twice daily',false],
      ['Kesari Jeevan',480,580,'Premium Chyawanprash enriched with Kesar for 3x immunity.',['Amla','Kesar','Ashwagandha','40+ herbs'],'1-2 tsp twice daily',false],
      ['Chyawanprash',350,420,'Time-tested immunity booster with Amla and 40+ herbs.',['Amla','Ashwagandha','Giloy','Pippali'],'1-2 tsp twice daily',true],
      ['Guduchi Tablets',95,120,'Pure Guduchi extract for natural immunity and detox.',['Guduchi extract'],'2 tablets twice daily',false],
      ['Moringa Capsules',250,310,'Nutrient-dense superfood with vitamins A, C, E and iron.',['Moringa leaf powder'],'1-2 capsules twice daily',false],
      ['Haldi Immunity Mix',160,200,'Golden milk powder with turmeric, pepper and herbs.',['Turmeric','Black pepper','Ashwagandha','Ginger'],'1 tsp in warm milk',false],
      ['Noni Juice',320,400,'Tropical superfruit juice for immunity and energy.',['Noni fruit extract'],'30ml twice daily',false],
      ['Wheat Grass Powder',180,225,'Green superfood rich in chlorophyll and antioxidants.',['Wheatgrass powder'],'1 tsp in water daily',false],
      ['Spirulina Tablets',290,360,'Blue-green algae supplement for complete nutrition.',['Spirulina extract'],'2 tablets twice daily',false],
      ['Giloy Tulsi Juice',140,175,'Dual immunity booster combining Giloy and Tulsi.',['Giloy extract','Tulsi extract'],'20ml twice daily',false],
      ['Immunity Kadha Mix',120,150,'Traditional herbal decoction mix for cold prevention.',['Tulsi','Ginger','Cinnamon','Black pepper'],'Boil 1 tsp in water',false],
      ['Amalaki Rasayan',200,250,'Rejuvenating Amla-based tonic for vitality.',['Amla','Ghee','Honey'],'1 tsp twice daily',false],
      ['Suvarna Prashan Drops',550,680,'Gold-infused immunity drops for children.',['Swarna Bhasma','Brahmi','Vacha','Honey'],'2-4 drops daily',true],
      ['Tulsi Green Tea',180,220,'Organic green tea infused with holy basil.',['Green tea leaves','Tulsi leaves'],'1 cup 2-3 times daily',false],
      ['Immunity Power Churna',150,190,'Polyherbal immunity powder blend.',['Ashwagandha','Giloy','Tulsi','Amla'],'1 tsp twice daily',false],
      ['Chawanprash Sugar Free',380,460,'Diabetic-friendly immunity supplement.',['Amla','Ashwagandha','Giloy','Stevia'],'1-2 tsp twice daily',false],
    ]
  },
  digestion: {
    brands: ['Himalaya','Dabur','Baidyanath','Patanjali','Zandu','Dhootapapeshwar'],
    items: [
      ['Triphala Tablets',150,190,'Three-fruit blend for digestion and detox.',['Amalaki','Bibhitaki','Haritaki'],'2 tablets twice daily',true],
      ['Liv.52 Tablets',110,140,'World-famous liver supplement for hepatic protection.',['Himsra','Kasani','Mandur Bhasma'],'2 tablets twice daily',true],
      ['Arogyavardhini Vati',95,120,'Classical medicine for liver and skin disorders.',['Kutki','Triphala','Shilajit','Guggulu'],'1-2 tablets twice daily',false],
      ['Avipattikar Churna',115,140,'Classical formula for acidity and heartburn relief.',['Trikatu','Triphala','Musta','Vidanga'],'3-6g after meals',false],
      ['Panchamrit Parpati',240,300,'Classical rasa preparation for IBS and acid reflux.',['Iron Bhasma','Abhrak Bhasma'],'125-250mg twice daily',false],
      ['Hingvastak Churna',85,105,'Carminative powder for gas and bloating relief.',['Hing','Jeera','Ajwain','Black pepper'],'1 tsp before meals',false],
      ['Digestive Enzyme Tablets',160,200,'Natural enzyme supplement for nutrient absorption.',['Papain','Amla','Ginger','Fennel'],'1 tablet after meals',false],
      ['Kutajarishta',130,165,'Herbal tonic for diarrhea and dysentery.',['Kutaja bark','Dhataki'],'15-30ml twice daily',false],
      ['Abhayarishta',120,150,'Mild laxative tonic for chronic constipation.',['Haritaki','Draksha','Vidanga'],'15-30ml after meals',false],
      ['Triphala Guggulu',135,170,'Enhanced triphala with guggulu for deep cleansing.',['Triphala','Guggulu','Pippali'],'2 tablets twice daily',false],
      ['Bhumiamla Tablets',145,180,'Liver protector from Phyllanthus niruri.',['Bhumiamla extract'],'2 tablets twice daily',false],
      ['Chitrakadi Vati',90,110,'Digestive fire enhancer for low appetite.',['Chitrak','Pippali','Ginger','Hing'],'1-2 tablets before meals',false],
      ['Isabgol Husk',75,95,'Natural fiber supplement for bowel regularity.',['Psyllium husk'],'1-2 tsp with water at bedtime',false],
      ['Amla Candy',60,80,'Delicious digestive candy made from Indian gooseberry.',['Amla','Rock salt','Spices'],'2-3 pieces after meals',false],
      ['Ajwain Water Drops',70,90,'Carom seed extract for instant gas relief.',['Ajwain extract','Water'],'10 drops in water',false],
      ['Pudin Hara Tablets',45,60,'Mint-based tablets for indigestion and nausea.',['Pudina','Menthol'],'1-2 tablets as needed',false],
      ['Lavan Bhaskar Churna',80,100,'Classical digestive powder with rock salt.',['Saindhav','Jeera','Pippali','Dalchini'],'1 tsp after meals',false],
      ['Kumari Asav',140,175,'Aloe vera-based digestive tonic.',['Aloe vera','Loha Bhasma'],'15-30ml twice daily',false],
    ]
  },
  skincare: {
    brands: ['Kama Ayurveda','Himalaya','Patanjali','Biotique','Forest Essentials','Baidyanath'],
    items: [
      ['Kumkumadi Tailam',890,1100,'Luxurious saffron face oil for radiant glow.',['Saffron','Sandalwood','Lotus','Vetiver'],'4-5 drops nightly',true],
      ['Neem Tablets',130,160,'Blood purifier and skin health promoter.',['Neem leaf extract'],'2 tablets twice daily',false],
      ['Haridrakhand',160,200,'Turmeric preparation for skin allergies and urticaria.',['Haridra','Triphala','Neem','Ghee'],'1 tsp twice daily',false],
      ['Kesar Premium',650,800,'Pure Kashmiri Saffron for skin brightening.',['Pure Kashmiri Saffron strands'],'2-3 strands per use',true],
      ['Aloe Vera Gel',75,90,'Pure aloe gel for skin and hair care.',['Aloe Vera gel','Vitamin E'],'Apply as needed',false],
      ['Manjistha Tablets',140,175,'Blood purifier for clear, glowing skin.',['Manjistha extract'],'2 tablets twice daily',false],
      ['Chandan Face Pack',180,220,'Sandalwood face mask for skin brightening.',['Chandan powder','Rose water','Turmeric'],'Apply 2-3 times weekly',false],
      ['Rose Water Toner',120,150,'Pure rose distillate for skin toning.',['Rosa damascena distillate'],'Spray on face after cleansing',false],
      ['Neem Face Wash',110,140,'Herbal face cleanser for acne-prone skin.',['Neem','Turmeric','Tea tree oil'],'Use twice daily',false],
      ['Eladi Keram',250,310,'Classical coconut oil for skin nourishment.',['Coconut oil','Ela','Manjistha','Chandana'],'Apply on skin daily',false],
      ['Kumkumadi Face Cream',520,650,'Rich face cream with saffron for anti-aging.',['Kumkumadi oil','Shea butter','Aloe'],'Apply morning and night',false],
      ['Nalpamaradi Tailam',380,470,'Traditional turmeric oil for skin brightening.',['Turmeric','Sesame oil','Vetiver','Amla'],'Apply before bath',false],
      ['Ubtan Face Scrub',160,200,'Traditional exfoliating scrub with chickpea flour.',['Besan','Turmeric','Sandalwood','Rose'],'Use 2-3 times weekly',false],
      ['Multani Mitti Pack',90,115,'Fuller earth clay mask for oily skin.',['Multani Mitti','Rose water','Neem'],'Apply weekly',false],
      ['Saffron Body Lotion',340,420,'Luxurious body moisturizer with saffron.',['Saffron extract','Almond oil','Shea butter'],'Apply after bath',false],
      ['Anti Acne Cream',210,260,'Herbal spot treatment for acne and pimples.',['Neem','Tea tree','Turmeric','Aloe'],'Apply on affected areas',false],
      ['Lip Balm Herbal',80,100,'Natural lip moisturizer with beeswax.',['Beeswax','Coconut oil','Rose extract'],'Apply as needed',false],
      ['Sunscreen Ayurvedic',280,350,'Natural sun protection with herbal extracts.',['Zinc oxide','Aloe','Carrot seed oil'],'Apply before sun exposure',false],
    ]
  },
  'brain-health': {
    brands: ['Baidyanath','Dabur','Himalaya','Organic India','Zandu','Dhootapapeshwar'],
    items: [
      ['Brahmi Vati',120,150,'Classical medicine for memory and mental clarity.',['Brahmi','Shankhpushpi','Gold Bhasma'],'1-2 tablets twice daily',true],
      ['Shankhpushpi Syrup',105,130,'Brain tonic for memory and learning ability.',['Shankhpushpi','Sugar','Water'],'2-3 tsp twice daily',false],
      ['Saraswatarishta',155,195,'Classical brain tonic for speech and intellect.',['Brahmi','Shatavari','Vidarikand','Haritaki'],'15-30ml twice daily',false],
      ['Brahmi Ghrita',220,275,'Medicated ghee for deep brain nourishment.',['Brahmi','Cow ghee','Vacha','Shankhpushpi'],'1 tsp twice daily',false],
      ['Memory Plus Tablets',175,215,'Modern formulation for cognitive enhancement.',['Brahmi','Shankhpushpi','Jyotishmati','Mandukparni'],'1 tablet twice daily',false],
      ['Jyotishmati Oil',280,350,'Brain stimulating oil for external application.',['Jyotishmati seeds','Sesame oil'],'Apply on scalp and temples',false],
      ['Medhya Rasayan',190,235,'Classical rejuvenating brain tonic formula.',['Brahmi','Guduchi','Shankhpushpi','Yashtimadhu'],'1 tsp twice daily',false],
      ['Brahmi Capsules',145,180,'Standardized Brahmi extract for daily brain support.',['Brahmi extract'],'1 capsule twice daily',false],
      ['Smriti Sagar Ras',320,400,'Herbo-mineral preparation for memory disorders.',['Swarna Bhasma','Brahmi','Vacha'],'1 tablet daily',false],
      ['Gotu Kola Tablets',160,200,'Centella asiatica for brain and nerve support.',['Gotu Kola extract'],'2 tablets daily',false],
      ['Brain Booster Syrup',130,165,'Child-friendly brain tonic syrup.',['Brahmi','Shankhpushpi','Jatamansi','Honey'],'1-2 tsp twice daily',false],
      ['Vacha Churna',85,105,'Calamus root powder for speech and memory.',['Vacha powder'],'500mg twice daily',false],
      ['Jatamansi Tablets',170,210,'Calming brain herb for anxiety and sleep.',['Jatamansi extract'],'1 tablet at bedtime',false],
      ['Intellect Tree Bark',140,175,'Shankhpushpi-based brain supplement.',['Shankhpushpi extract','Brahmi'],'2 tablets daily',false],
    ]
  },
  'pain-relief': {
    brands: ['Dabur','Baidyanath','Zandu','Himalaya','Patanjali','Kottakkal'],
    items: [
      ['Mahanarayan Oil',220,280,'Classical oil for joint and muscle pain relief.',['Sesame oil','Ashwagandha','Shatavari','Camphor'],'Apply externally',false],
      ['Yograj Guggulu',175,210,'Potent formulation for arthritis and joint health.',['Guggulu','Triphala','Trikatu','Chitraka'],'2 tablets twice daily',false],
      ['Dashmool Kwath',130,165,'Ten roots decoction for inflammation and pain.',['Bilva','Gambhari','Patala','Shyonaka'],'15-20ml twice daily',false],
      ['Balm Ayurvedic',65,85,'Herbal pain relief balm for headaches and body pain.',['Camphor','Menthol','Eucalyptus oil'],'Apply on affected area',false],
      ['Rumalaya Forte',160,200,'Advanced joint care tablets for arthritis.',['Boswellia','Guggulu','Rasna','Guduchi'],'2 tablets twice daily',false],
      ['Vishgarbha Oil',195,245,'Hot potency oil for severe joint pain.',['Vishgarbha herbs','Sesame oil'],'Apply warm on joints',false],
      ['Maharasnadi Kwath',140,175,'Classical decoction for rheumatic conditions.',['Rasna','Eranda','Devdaru','Guduchi'],'15-30ml daily',false],
      ['Pain Relief Roll On',110,140,'Convenient roll-on for quick pain relief.',['Wintergreen oil','Camphor','Menthol'],'Roll on affected area',false],
      ['Kaishore Guggulu',135,170,'Anti-inflammatory guggulu for gout and arthritis.',['Guggulu','Triphala','Guduchi','Ginger'],'2 tablets twice daily',false],
      ['Nirgundi Oil',150,190,'Vitex negundo oil for muscle and joint pain.',['Nirgundi','Sesame oil','Camphor'],'Massage on affected area',false],
      ['Punarnavadi Guggulu',125,155,'Anti-inflammatory for joints and kidney support.',['Punarnava','Guggulu','Triphala'],'2 tablets twice daily',false],
      ['Eranda Oil',70,90,'Pure castor oil for joint pain and constipation.',['Eranda oil (Ricinus communis)'],'Apply externally or 1 tsp orally',false],
      ['Shallaki Tablets',145,180,'Boswellia extract for natural anti-inflammation.',['Boswellia serrata extract'],'1 tablet twice daily',false],
      ['Cervical Spine Oil',230,290,'Specialized oil blend for neck and cervical pain.',['Mahanarayan oil','Karpoor','Nirgundi'],'Massage on neck area',false],
      ['Knee Pain Relief Kit',350,430,'Complete kit with oil and tablets for knee care.',['Mahanarayan oil','Yograj Guggulu'],'As directed',true],
    ]
  },
  'womens-health': {
    brands: ['Zandu','Dabur','Himalaya','Baidyanath','Patanjali','Dhootapapeshwar'],
    items: [
      ['Shatavari Kalpa',280,340,'Premium supplement for hormonal balance.',['Shatavari','Sugar','Cardamom','Milk solids'],'1-2 tsp twice daily',false],
      ['Shatavari Tablets',185,230,'Convenient tablet form for daily women wellness.',['Shatavari extract'],'1 tablet twice daily',false],
      ['Ashokarishta',140,175,'Classical tonic for menstrual health.',['Ashoka bark','Dhataki','Musta'],'15-30ml twice daily',false],
      ['Dashamoolarishta',150,190,'Post-delivery recovery tonic.',['Dashmool','Dhataki','Jaggery'],'15-30ml twice daily',false],
      ['Lodhra Churna',95,120,'Herbal powder for reproductive health.',['Lodhra bark powder'],'1 tsp twice daily',false],
      ['Rajah Pravartini Vati',85,105,'Classical medicine for menstrual irregularity.',['Tankana','Kaseesa','Hing'],'1-2 tablets twice daily',false],
      ['Pushyanug Churna',110,140,'Polyherbal powder for leucorrhea and PCOS.',['Pashanbhed','Lodhra','Maricha'],'1 tsp twice daily',false],
      ['Kumaryasava',160,200,'Aloe-based tonic for women wellness.',['Kumari','Loha Bhasma','Dhataki'],'15-30ml twice daily',false],
      ['Lactation Support Mix',200,250,'Herbal galactagogue for nursing mothers.',['Shatavari','Fenugreek','Fennel','Cumin'],'1 tsp with milk',false],
      ['Iron Rich Syrup',145,180,'Natural iron supplement for anemia.',['Loha Bhasma','Amla','Mandur Bhasma'],'2 tsp twice daily',false],
      ['Menstrual Comfort Tea',130,165,'Herbal tea blend for period pain relief.',['Ginger','Cinnamon','Ashoka','Fennel'],'1 cup during periods',false],
      ['Calcium Herbal Tablets',170,210,'Plant-based calcium from Praval and Mukta.',['Praval Pishti','Mukta Pishti','Godanti'],'2 tablets daily',false],
      ['PCOS Care Capsules',240,300,'Targeted support for PCOS management.',['Shatavari','Lodhra','Ashoka','Guduchi'],'1 capsule twice daily',false],
    ]
  },
  'heart-health': {
    brands: ['Dabur','Himalaya','Baidyanath','Zandu','Dhootapapeshwar','Patanjali'],
    items: [
      ['Arjunarishta',140,175,'Classical cardiac tonic from Arjuna bark.',['Arjuna bark','Draksha','Mahua','Dhataki'],'15-30ml twice daily',false],
      ['Arjuna Capsules',165,205,'Standardized Arjuna bark extract tablets.',['Arjuna bark extract'],'1 capsule twice daily',true],
      ['Hridayarnava Ras',280,350,'Herbo-mineral preparation for heart strengthening.',['Arjuna','Abhrak Bhasma','Ras Sindur'],'1 tablet twice daily',false],
      ['Mrigmadasav',190,240,'Classical tonic for cardiac debility.',['Mrigmad','Ashwagandha','Arjuna'],'15ml twice daily',false],
      ['Cholesterol Care',200,250,'Herbal formula for healthy cholesterol levels.',['Guggulu','Arjuna','Garlic','Triphala'],'2 tablets daily',false],
      ['Mukta Vati',155,195,'Classical preparation for blood pressure support.',['Mukta Pishti','Brahmi','Shankhpushpi','Jatamansi'],'2 tablets twice daily',false],
      ['Garlic Capsules',90,115,'Allicin-rich garlic for cardiovascular health.',['Garlic extract'],'1 capsule daily',false],
      ['Heart Care Tea',120,150,'Herbal tea blend for daily heart wellness.',['Arjuna','Green tea','Cinnamon','Cardamom'],'1 cup daily',false],
      ['BP Balance Tablets',175,220,'Natural blood pressure management supplement.',['Sarpagandha','Jatamansi','Brahmi','Arjuna'],'1 tablet twice daily',false],
      ['Omega Flax Capsules',210,260,'Plant-based omega fatty acids from flaxseed.',['Flaxseed oil','Vitamin E'],'1 capsule daily',false],
      ['Triphala Cardio Mix',160,200,'Heart-healthy triphala blend with Arjuna.',['Triphala','Arjuna','Guggulu'],'1 tsp daily',false],
    ]
  },
  respiratory: {
    brands: ['Dabur','Baidyanath','Himalaya','Zandu','Patanjali','Charak'],
    items: [
      ['Sitopaladi Churna',85,105,'Traditional remedy for cough and bronchitis.',['Vanslochan','Pippali','Cardamom','Cinnamon'],'1-3g 2-3 times daily',false],
      ['Talisadi Churna',90,110,'Respiratory and digestive health powder.',['Talispatra','Pippali','Vanslochan','Cardamom'],'1-3g twice daily',false],
      ['Kanakasava',145,180,'Classical tonic for asthma and breathing difficulty.',['Dhattura','Kantakari','Pippali'],'15-30ml twice daily',false],
      ['Vasavaleha',130,165,'Adhatoda-based linctus for chronic cough.',['Vasa','Honey','Pippali','Sugar'],'1 tsp 2-3 times daily',false],
      ['Lavangadi Vati',70,90,'Clove-based lozenge for sore throat.',['Lavang','Karpoor','Pippali'],'1-2 tablets as needed',false],
      ['Khadiradi Vati',65,85,'Throat soothing lozenges with Khadira.',['Khadira','Javitri','Karpoor'],'1 tablet 3-4 times daily',false],
      ['Broncho Care Syrup',155,195,'Modern Ayurvedic syrup for bronchial health.',['Tulsi','Vasa','Yashtimadhu','Honey'],'2 tsp thrice daily',false],
      ['Yashtimadhu Tablets',120,150,'Licorice tablets for throat and respiratory care.',['Yashtimadhu extract'],'1 tablet twice daily',false],
      ['Pranayam Drops',180,225,'Herbal drops for nasal congestion relief.',['Eucalyptus','Pudina','Ajwain','Camphor'],'2-3 drops in steam',false],
      ['Lung Detox Tea',140,175,'Herbal tea for respiratory cleansing.',['Tulsi','Mulethi','Ginger','Pippali'],'1 cup twice daily',false],
      ['Honey Ginger Cough Syrup',95,120,'Natural cough syrup with honey and ginger.',['Honey','Ginger','Tulsi','Mulethi'],'2 tsp as needed',false],
      ['Chyawanprash Junior',280,340,'Kids immunity and respiratory health formula.',['Amla','Tulsi','Honey','30+ herbs'],'1 tsp twice daily',false],
      ['Nasal Drops Anu Tailam',110,140,'Classical nasal drops for sinusitis relief.',['Sesame oil','Goat milk','Jeevanti','Devdaru'],'2 drops in each nostril',false],
    ]
  },
  'weight-management': {
    brands: ['Patanjali','Himalaya','Zandu','Organic India','Dabur','Baidyanath'],
    items: [
      ['Medohar Guggulu',120,150,'Ayurvedic formulation for fat reduction.',['Guggulu','Triphala','Trikatu','Vidanga'],'2 tablets twice daily',false],
      ['Garcinia Capsules',195,245,'Garcinia cambogia for appetite control.',['Garcinia cambogia extract'],'1 capsule before meals',false],
      ['Green Coffee Beans',220,275,'Unroasted coffee for metabolism boost.',['Green coffee bean extract'],'1 capsule morning',false],
      ['Triphala Weight Churna',100,125,'Triphala blend for metabolism and detox.',['Triphala powder'],'1 tsp with warm water at bedtime',false],
      ['Metabolism Boost Tea',150,190,'Herbal tea for fat burning and energy.',['Green tea','Ginger','Cinnamon','Cardamom'],'2 cups daily',false],
      ['Vrikshamla Tablets',165,205,'Garcinia-based weight management tablets.',['Vrikshamla extract'],'1 tablet before meals',false],
      ['Apple Cider Vinegar',180,225,'Raw organic ACV with mother culture.',['Apple cider vinegar'],'1 tbsp in water before meals',false],
      ['Slim Tea Herbal',130,165,'Weight loss herbal tea with 12 ingredients.',['Senna','Green tea','Fennel','Ginger'],'1 cup daily',false],
      ['Guggulu Fat Burner',155,195,'Concentrated guggulu for lipid metabolism.',['Guggulu extract','Triphala','Pippali'],'2 tablets daily',false],
      ['Honey Lemon Detox',90,115,'Morning detox drink mix.',['Honey crystals','Lemon extract','Ginger'],'1 sachet in warm water',false],
      ['Belly Trim Capsules',210,260,'Targeted abdominal fat reduction formula.',['Garcinia','Triphala','Guggulu','Green tea'],'1 capsule twice daily',false],
    ]
  },
  'eye-health': {
    brands: ['Dhootapapeshwar','Baidyanath','Himalaya','Dabur','Patanjali','Kottakkal'],
    items: [
      ['Saptamrit Lauh',195,240,'Classical formulation for vision improvement.',['Triphala','Yashtimadhu','Loha Bhasma'],'1-2 tablets twice daily',false],
      ['Triphala Eye Wash',85,105,'Herbal eye wash solution for tired eyes.',['Triphala decoction'],'Wash eyes twice daily',false],
      ['Netra Suraksha Drops',150,190,'Ayurvedic eye drops for dryness and strain.',['Rose water','Honey','Triphala'],'1-2 drops twice daily',false],
      ['Saptamrit Ghrita',280,350,'Medicated ghee for deep eye nourishment.',['Triphala','Ghee','Yashtimadhu'],'1 tsp daily',false],
      ['Mahatriphala Ghrita',310,390,'Premium medicated ghee for eye disorders.',['Triphala','Bhringaraj','Ghee'],'1 tsp with milk',false],
      ['Eye Care Capsules',170,210,'Modern formulation for digital eye strain.',['Triphala','Saptamrit','Punarnava'],'1 capsule daily',false],
      ['Netra Prakash Drops',120,150,'Cooling eye drops for redness and irritation.',['Rose water','Neem','Camphor'],'2 drops twice daily',false],
      ['Vision Plus Tablets',200,250,'Comprehensive eye health supplement.',['Triphala','Saptamrit Lauh','Amla','Carrot extract'],'1 tablet daily',false],
    ]
  },
  'kidney-health': {
    brands: ['Baidyanath','Himalaya','Patanjali','Dabur','Dhootapapeshwar','Charak'],
    items: [
      ['Chandraprabha Vati',155,190,'Classical medicine for urinary tract health.',['Chandraprabha','Vacha','Musta','Guduchi'],'2 tablets twice daily',false],
      ['Gokshuradi Guggulu',140,175,'Guggulu preparation for kidney stone management.',['Gokshura','Guggulu','Triphala'],'2 tablets twice daily',false],
      ['Punarnava Mandur',125,155,'Iron and Punarnava for kidney support.',['Punarnava','Mandur Bhasma','Triphala'],'2 tablets twice daily',false],
      ['Kidney Stone Crusher',180,225,'Herbal formula for dissolving kidney stones.',['Pashanbhed','Gokshura','Varun','Kulathi'],'2 tablets twice daily',false],
      ['Varunadi Kwath',130,165,'Decoction for urinary and renal health.',['Varun','Gokshura','Punarnava'],'15-30ml twice daily',false],
      ['Cystone Tablets',135,170,'Dual-action kidney and urinary tract support.',['Shilapushpa','Pasanabheda','Nagarmotha'],'2 tablets twice daily',false],
      ['UTI Care Capsules',195,245,'Herbal support formula for urinary infections.',['Gokshura','Punarnava','Chandraprabha'],'1 capsule twice daily',false],
      ['Kidney Detox Tea',110,140,'Cleansing tea for kidney and bladder health.',['Punarnava','Gokshura','Corn silk','Fennel'],'1 cup twice daily',false],
    ]
  },
  'hair-care': {
    brands: ['Kama Ayurveda','Himalaya','Dabur','Patanjali','Biotique','Forest Essentials'],
    items: [
      ['Bhringraj Oil',495,600,'Premium oil for hair growth and anti-greying.',['Bhringraj','Coconut oil','Sesame oil','Amla'],'Apply 2-3 times weekly',true],
      ['Bhringraj Tablets',145,180,'Internal supplement for hair health.',['Bhringraj extract'],'1 tablet twice daily',false],
      ['Anti Hair Fall Shampoo',280,350,'Herbal shampoo for stronger hair.',['Bhringraj','Amla','Reetha','Shikakai'],'Use 2-3 times weekly',false],
      ['Amla Hair Oil',150,190,'Traditional amla oil for hair nourishment.',['Amla','Coconut oil','Brahmi'],'Apply twice weekly',false],
      ['Hair Growth Serum',420,520,'Concentrated serum for thinning hair.',['Bhringraj','Jatamansi','Amla','Sesame oil'],'Apply daily on scalp',false],
      ['Shikakai Shampoo',130,165,'Natural cleansing with Shikakai and Reetha.',['Shikakai','Reetha','Amla'],'Use for regular washing',false],
      ['Neelibhringadi Oil',380,470,'Classical oil for premature greying.',['Neeli','Bhringraj','Coconut oil'],'Apply 2-3 times weekly',false],
      ['Hair Mask Herbal',200,250,'Deep conditioning hair mask.',['Amla','Brahmi','Fenugreek','Yogurt base'],'Apply weekly for 30 min',false],
      ['Biotin Herbal Capsules',190,235,'Plant-based biotin for hair and nails.',['Bamboo shoot extract','Amla','Bhringraj'],'1 capsule daily',false],
      ['Dandruff Control Oil',170,210,'Anti-dandruff oil with Neem and Tea tree.',['Neem oil','Tea tree oil','Coconut oil'],'Apply twice weekly',false],
      ['Keshya Tablets',155,195,'Internal hair nourishment tablets.',['Bhringraj','Amla','Jatamansi','Ashwagandha'],'2 tablets daily',false],
      ['Mahabhringraj Oil',260,320,'Enhanced Bhringraj oil with 20+ herbs.',['Bhringraj','Amla','Jatamansi','Brahmi','Neem'],'Apply 2-3 times weekly',false],
      ['Henna Natural Color',90,115,'Chemical-free natural hair color.',['Lawsonia inermis','Indigo','Amla'],'Apply as per instructions',false],
      ['Hair Vitamin Gummies',320,400,'Tasty gummies for hair nutrition.',['Biotin','Amla extract','Bhringraj','Zinc'],'2 gummies daily',false],
    ]
  }
};

// Build catalog array
const catalog = [];
for (const [category, data] of Object.entries(PRODUCTS_BY_CATEGORY)) {
  let brandIdx = 0;
  data.items.forEach(([name, price, originalPrice, desc, ingredients, dosage, featured]) => {
    catalog.push({
      name, brand: data.brands[brandIdx % data.brands.length],
      category, price, originalPrice,
      desc, ingredients, dosage, featured
    });
    brandIdx++;
  });
}

// Write catalog
const outPath = path.join(__dirname, '..', 'src', 'data', 'product-catalog.js');
const content = '// Auto-generated compact product catalog\n// Edit this file to add/remove/modify products\n// Then run: node scripts/generate-products.js\n\nmodule.exports = ' + JSON.stringify(catalog, null, 2) + ';\n';
fs.writeFileSync(outPath, content);
console.log(`✅ Built catalog with ${catalog.length} products → src/data/product-catalog.js`);
