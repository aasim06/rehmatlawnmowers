export const initialCategories = [
  { id: 'CAT-1', name: 'Electrical & Motors', description: 'Electric motors, drives, starters' },
  { id: 'CAT-2', name: 'Mechanical Parts', description: 'Bearings, gears, belts, pulleys' },
  { id: 'CAT-3', name: 'Sensors & Automation', description: 'Proximity sensors, limit switches, PLCs' },
  { id: 'CAT-4', name: 'Hydraulics & Pneumatics', description: 'Cylinders, valves, hoses, fittings' },
  { id: 'CAT-5', name: 'Raw Materials', description: 'Steel sheets, rods, hardware, bolts' },
  { id: 'CAT-6', name: 'Spare Parts', description: 'Blades, bearings, gears, chains, shafts' },
  { id: 'CAT-7', name: 'Engine Components', description: 'Carburetors, spark plugs, recoil starters, filters' },
  { id: 'CAT-8', name: 'Oils & Lubricants', description: 'Engine oil 4T, 2T, gear lubricants' },
  { id: 'CAT-9', name: 'Accessories', description: 'Grass boxes, catcher bags, trimmer lines, cables' },
  { id: 'CAT-10', name: 'Blades & Cutters', description: '18", 20", 24" Cutting blades and rotary discs' }
];

export const defaultMasterItemNames = [
  { id: 'mst-gear-set', name: 'Gear set complete', category: 'Spare Parts', skuCode: 'SKU-GEAR-01', unitPrice: 13500, defaultUnit: 'PCS', initialStock: 15, minThreshold: 5 },
  { id: 'mst-chain-set', name: 'Chain set complete', category: 'Spare Parts', skuCode: 'SKU-CHN-01', unitPrice: 3500, defaultUnit: 'PCS', initialStock: 25, minThreshold: 5 },
  { id: 'mst-bearing-complete', name: 'Bearing Complete', category: 'Spare Parts', skuCode: 'SKU-BRG-01', unitPrice: 3500, defaultUnit: 'PCS', initialStock: 40, minThreshold: 10 },
  { id: 'mst-skf-6205', name: 'SKF Ball Bearing 6205', category: 'Mechanical Parts', skuCode: 'SKU-SKF-6205', unitPrice: 450, defaultUnit: 'PCS', initialStock: 50, minThreshold: 10 },
  { id: 'mst-brg-6204', name: 'Ball Bearing 6204', category: 'Mechanical Parts', skuCode: 'SKU-BRG-6204', unitPrice: 380, defaultUnit: 'PCS', initialStock: 40, minThreshold: 10 },
  { id: 'mst-skf-6205-2rs', name: 'SKF Ball Bearing 6205-2RS', category: 'Mechanical Parts', skuCode: 'SKU-SKF-6205-2RS', unitPrice: 550, defaultUnit: 'PCS', initialStock: 35, minThreshold: 10 },
  { id: 'mst-bld-18', name: 'Cutter Blade 18"', category: 'Blades & Cutters', skuCode: 'SKU-BLD-18', unitPrice: 750, defaultUnit: 'PCS', initialStock: 25, minThreshold: 5 },
  { id: 'mst-bld-20', name: 'Cutter Blade 20"', category: 'Blades & Cutters', skuCode: 'SKU-BLD-20', unitPrice: 850, defaultUnit: 'PCS', initialStock: 30, minThreshold: 5 },
  { id: 'mst-bld-24', name: 'Cutter Blade 24"', category: 'Blades & Cutters', skuCode: 'SKU-BLD-24', unitPrice: 1100, defaultUnit: 'PCS', initialStock: 20, minThreshold: 5 },
  { id: 'mst-rotary-bld-20', name: 'Rehmat 20" Rotary Cutting Blade', category: 'Blades & Cutters', skuCode: 'SHP-BLD-02', unitPrice: 3500, defaultUnit: 'PCS', initialStock: 28, minThreshold: 5 },
  { id: 'mst-sharpness-ovh', name: 'Sharpness overhauling', category: 'Spare Parts', skuCode: 'SRV-SHRP-01', unitPrice: 4000, defaultUnit: 'Set', initialStock: 50, minThreshold: 5 },
  { id: 'mst-roller-shaft', name: 'Back roller shaft', category: 'Mechanical Parts', skuCode: 'SKU-SFT-01', unitPrice: 4500, defaultUnit: 'PCS', initialStock: 12, minThreshold: 3 },
  { id: 'mst-paint-new', name: 'Paint new', category: 'Accessories', skuCode: 'SRV-PNT-01', unitPrice: 2000, defaultUnit: 'Can', initialStock: 50, minThreshold: 5 },
  { id: 'mst-grass-box', name: 'Grass box', category: 'Accessories', skuCode: 'SKU-BOX-01', unitPrice: 3500, defaultUnit: 'PCS', initialStock: 18, minThreshold: 4 },
  { id: 'mst-grass-catcher-bag', name: 'Safety Grass Catcher Bag 60L', category: 'Accessories', skuCode: 'SHP-ACC-10', unitPrice: 4800, defaultUnit: 'PCS', initialStock: 14, minThreshold: 3 },
  { id: 'mst-brush-cutter-rep', name: 'Brush cutter repair', category: 'Spare Parts', skuCode: 'SRV-BRSH-01', unitPrice: 16000, defaultUnit: 'Set', initialStock: 20, minThreshold: 2 },
  { id: 'mst-labor-charges', name: 'Labor charges', category: 'Spare Parts', skuCode: 'SRV-LBR-01', unitPrice: 8000, defaultUnit: 'Set', initialStock: 100, minThreshold: 5 },
  { id: 'mst-spark-plug-ngk', name: 'Spark Plug NGK', category: 'Engine Components', skuCode: 'SKU-SPK-01', unitPrice: 350, defaultUnit: 'PCS', initialStock: 60, minThreshold: 10 },
  { id: 'mst-spark-plug-bpr6es', name: 'NGK Spark Plug BPR6ES', category: 'Engine Components', skuCode: 'SHP-ENG-03', unitPrice: 850, defaultUnit: 'PCS', initialStock: 45, minThreshold: 10 },
  { id: 'mst-oil-4t', name: 'Engine Oil 4T 20W-50', category: 'Oils & Lubricants', skuCode: 'SKU-OIL-4T', unitPrice: 750, defaultUnit: 'Bottle', initialStock: 45, minThreshold: 10 },
  { id: 'mst-mower-oil-4s', name: '4-Stroke Lawn Mower Engine Oil 20W-50', category: 'Oils & Lubricants', skuCode: 'SHP-OIL-04', unitPrice: 1650, defaultUnit: 'Bottle', initialStock: 32, minThreshold: 8 },
  { id: 'mst-carburetor-assy', name: 'Carburetor Assembly', category: 'Engine Components', skuCode: 'SKU-CRB-01', unitPrice: 2400, defaultUnit: 'PCS', initialStock: 15, minThreshold: 5 },
  { id: 'mst-carburetor-tuning', name: 'Carburetor Tuning & Labour', category: 'Engine Components', skuCode: 'SRV-CRB-02', unitPrice: 1200, defaultUnit: 'Set', initialStock: 30, minThreshold: 5 },
  { id: 'mst-starter-pulley', name: 'Starter Pulley & Recoil Rope', category: 'Engine Components', skuCode: 'SKU-REC-01', unitPrice: 650, defaultUnit: 'PCS', initialStock: 35, minThreshold: 8 },
  { id: 'mst-recoil-assy-kit', name: 'Pull Starter Recoil Assembly Kit', category: 'Engine Components', skuCode: 'SHP-ENG-08', unitPrice: 4200, defaultUnit: 'Set', initialStock: 12, minThreshold: 3 },
  { id: 'mst-air-filter-elem', name: 'Air Filter Element', category: 'Engine Components', skuCode: 'SKU-FLT-01', unitPrice: 280, defaultUnit: 'PCS', initialStock: 40, minThreshold: 10 },
  { id: 'mst-air-filter-bs', name: 'Air Filter Cartridge for Briggs & Stratton', category: 'Engine Components', skuCode: 'SHP-ENG-06', unitPrice: 1450, defaultUnit: 'PCS', initialStock: 24, minThreshold: 5 },
  { id: 'mst-vbelt-a38', name: 'V-Belt A-38', category: 'Mechanical Parts', skuCode: 'SKU-BLT-A38', unitPrice: 420, defaultUnit: 'PCS', initialStock: 30, minThreshold: 5 },
  { id: 'mst-throttle-cable', name: 'Throttle Cable', category: 'Accessories', skuCode: 'SKU-CBL-01', unitPrice: 320, defaultUnit: 'PCS', initialStock: 25, minThreshold: 5 },
  { id: 'mst-clutch-plate-set', name: 'Clutch Plate Set', category: 'Mechanical Parts', skuCode: 'SKU-CLT-01', unitPrice: 3200, defaultUnit: 'Set', initialStock: 15, minThreshold: 3 },
  { id: 'mst-rubber-wheel', name: 'Heavy Duty 8" Rubber Ball-Bearing Wheel', category: 'Spare Parts', skuCode: 'SHP-SPR-05', unitPrice: 2200, defaultUnit: 'PCS', initialStock: 16, minThreshold: 4 },
  { id: 'mst-trimmer-line', name: 'Nylon Grass Trimmer Line 3.0mm (50m Roll)', category: 'Accessories', skuCode: 'SHP-ACC-07', unitPrice: 1850, defaultUnit: 'Roll', initialStock: 30, minThreshold: 6 },
  { id: 'mst-engine-overhaul', name: 'Complete Engine Overhaul Service', category: 'Spare Parts', skuCode: 'SRV-ENG-01', unitPrice: 18000, defaultUnit: 'Set', initialStock: 10, minThreshold: 2 },
  { id: 'mst-motor-3hp', name: '3HP Electric Motor (3-Phase)', category: 'Electrical & Motors', skuCode: 'SKU-MTR-3HP', unitPrice: 28000, defaultUnit: 'PCS', initialStock: 8, minThreshold: 2 },
  { id: 'mst-bolts-m8', name: 'M8x50mm Stainless Steel Bolts', category: 'Raw Materials', skuCode: 'SKU-BLT-M8', unitPrice: 1250, defaultUnit: 'Box', initialStock: 40, minThreshold: 10 },
  { id: 'mst-honda-hrj216', name: 'Honda HRJ216 Lawn Mower 5.5HP', category: 'Mechanical Parts', skuCode: 'SHP-MOW-01', unitPrice: 145000, defaultUnit: 'Unit', initialStock: 5, minThreshold: 2 },
  { id: 'mst-cutter-18-3hp', name: 'Rehmat Electric Lawn Cutter 18" 3HP', category: 'Electrical & Motors', skuCode: 'SHP-MOW-09', unitPrice: 68000, defaultUnit: 'Unit', initialStock: 6, minThreshold: 2 },
  { id: 'mst-mower-20-petrol', name: 'Rehmat 20" Lawn Mower (Petrol Engine)', category: 'Mechanical Parts', skuCode: 'SKU-MOW-20P', unitPrice: 85000, defaultUnit: 'Unit', initialStock: 4, minThreshold: 2 },
  { id: 'mst-mower-24-hd', name: 'Rehmat Heavy Duty Lawn Mower 24"', category: 'Mechanical Parts', skuCode: 'SKU-MOW-24H', unitPrice: 115000, defaultUnit: 'Unit', initialStock: 3, minThreshold: 2 },
  { id: 'mst-trimmer-2s', name: 'Rehmat Grass Trimmer & Cutter 2-Stroke', category: 'Mechanical Parts', skuCode: 'SKU-TRM-2S', unitPrice: 45000, defaultUnit: 'Unit', initialStock: 7, minThreshold: 2 },
  { id: 'mst-roller-mower', name: 'Rehmat Hand Push Lawn Roller Mower', category: 'Mechanical Parts', skuCode: 'SKU-MOW-HPR', unitPrice: 35000, defaultUnit: 'Unit', initialStock: 5, minThreshold: 2 }
];

export const defaultStoreItems = [
  { id: 'ITEM-1', name: 'Gear set complete', itemCode: 'SKU-GEAR-01', category: 'Spare Parts', unit: 'PCS', remainingStock: 15, totalStock: 15, unitPrice: 13500, totalBillAmount: 202500, minLevel: 5, rackLocation: 'Shelf A-1' },
  { id: 'ITEM-2', name: 'Chain set complete', itemCode: 'SKU-CHN-01', category: 'Spare Parts', unit: 'PCS', remainingStock: 25, totalStock: 25, unitPrice: 3500, totalBillAmount: 87500, minLevel: 5, rackLocation: 'Shelf A-2' },
  { id: 'ITEM-3', name: 'Bearing Complete', itemCode: 'SKU-BRG-01', category: 'Spare Parts', unit: 'PCS', remainingStock: 40, totalStock: 40, unitPrice: 3500, totalBillAmount: 140000, minLevel: 10, rackLocation: 'Shelf B-1' },
  { id: 'ITEM-4', name: 'SKF Ball Bearing 6205', itemCode: 'SKU-SKF-6205', category: 'Mechanical Parts', unit: 'PCS', remainingStock: 50, totalStock: 50, unitPrice: 450, totalBillAmount: 22500, minLevel: 10, rackLocation: 'Shelf B-2' },
  { id: 'ITEM-5', name: 'Cutter Blade 20"', itemCode: 'SKU-BLD-20', category: 'Blades & Cutters', unit: 'PCS', remainingStock: 30, totalStock: 30, unitPrice: 850, totalBillAmount: 25500, minLevel: 5, rackLocation: 'Shelf C-1' },
  { id: 'ITEM-6', name: 'Cutter Blade 24"', itemCode: 'SKU-BLD-24', category: 'Blades & Cutters', unit: 'PCS', remainingStock: 20, totalStock: 20, unitPrice: 1100, totalBillAmount: 22000, minLevel: 5, rackLocation: 'Shelf C-2' },
  { id: 'ITEM-7', name: 'Sharpness overhauling', itemCode: 'SRV-SHRP-01', category: 'Spare Parts', unit: 'Set', remainingStock: 50, totalStock: 50, unitPrice: 4000, totalBillAmount: 200000, minLevel: 5, rackLocation: 'Workshop' },
  { id: 'ITEM-8', name: 'Back roller shaft', itemCode: 'SKU-SFT-01', category: 'Mechanical Parts', unit: 'PCS', remainingStock: 12, totalStock: 12, unitPrice: 4500, totalBillAmount: 54000, minLevel: 3, rackLocation: 'Shelf D-1' },
  { id: 'ITEM-9', name: 'Paint new', itemCode: 'SRV-PNT-01', category: 'Accessories', unit: 'Can', remainingStock: 50, totalStock: 50, unitPrice: 2000, totalBillAmount: 100000, minLevel: 5, rackLocation: 'Paint Store' },
  { id: 'ITEM-10', name: 'Grass box', itemCode: 'SKU-BOX-01', category: 'Accessories', unit: 'PCS', remainingStock: 18, totalStock: 18, unitPrice: 3500, totalBillAmount: 63000, minLevel: 4, rackLocation: 'Shelf D-2' },
  { id: 'ITEM-11', name: 'Brush cutter repair', itemCode: 'SRV-BRSH-01', category: 'Spare Parts', unit: 'Set', remainingStock: 20, totalStock: 20, unitPrice: 16000, totalBillAmount: 320000, minLevel: 2, rackLocation: 'Workshop' },
  { id: 'ITEM-12', name: 'Labor charges', itemCode: 'SRV-LBR-01', category: 'Spare Parts', unit: 'Set', remainingStock: 100, totalStock: 100, unitPrice: 8000, totalBillAmount: 800000, minLevel: 5, rackLocation: 'Counter' },
  { id: 'ITEM-13', name: 'Spark Plug NGK', itemCode: 'SKU-SPK-01', category: 'Engine Components', unit: 'PCS', remainingStock: 60, totalStock: 60, unitPrice: 350, totalBillAmount: 21000, minLevel: 10, rackLocation: 'Counter Drawer 1' },
  { id: 'ITEM-14', name: 'Engine Oil 4T 20W-50', itemCode: 'SKU-OIL-4T', category: 'Oils & Lubricants', unit: 'Bottle', remainingStock: 45, totalStock: 45, unitPrice: 750, totalBillAmount: 33750, minLevel: 10, rackLocation: 'Oil Rack' },
  { id: 'ITEM-15', name: 'Carburetor Assembly', itemCode: 'SKU-CRB-01', category: 'Engine Components', unit: 'PCS', remainingStock: 15, totalStock: 15, unitPrice: 2400, totalBillAmount: 36000, minLevel: 5, rackLocation: 'Shelf E-1' },
  { id: 'ITEM-16', name: 'Starter Pulley & Recoil Rope', itemCode: 'SKU-REC-01', category: 'Engine Components', unit: 'PCS', remainingStock: 35, totalStock: 35, unitPrice: 650, totalBillAmount: 22750, minLevel: 8, rackLocation: 'Shelf E-2' },
  { id: 'ITEM-17', name: 'Air Filter Element', itemCode: 'SKU-FLT-01', category: 'Engine Components', unit: 'PCS', remainingStock: 40, totalStock: 40, unitPrice: 280, totalBillAmount: 11200, minLevel: 10, rackLocation: 'Shelf E-3' },
  { id: 'ITEM-18', name: 'V-Belt A-38', itemCode: 'SKU-BLT-A38', category: 'Mechanical Parts', unit: 'PCS', remainingStock: 30, totalStock: 30, unitPrice: 420, totalBillAmount: 12600, minLevel: 5, rackLocation: 'Belt Hook 1' },
  { id: 'ITEM-19', name: 'Throttle Cable', itemCode: 'SKU-CBL-01', category: 'Accessories', unit: 'PCS', remainingStock: 25, totalStock: 25, unitPrice: 320, totalBillAmount: 8000, minLevel: 5, rackLocation: 'Cable Rack' }
];

export const initialStoreItems = defaultStoreItems;

export const initialUsageLogs = [];

export const initialVendors = [];

export const initialMachineSales = [];
