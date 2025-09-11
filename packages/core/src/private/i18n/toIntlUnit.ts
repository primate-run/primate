function toIntlUnit(unit: string): Intl.NumberFormatOptions["unit"] {
  const map: Record<string, string> = {
    // length
    mm: "millimeter", millimeter: "millimeter",
    cm: "centimeter", centimeter: "centimeter",
    m: "meter", meter: "meter",
    km: "kilometer", kilometer: "kilometer",
    in: "inch", inch: "inch",
    ft: "foot", foot: "foot",
    yd: "yard", yard: "yard",
    mi: "mile", mile: "mile",
    "mile-scandinavian": "mile-scandinavian",

    // area
    m2: "square-meter", "m^2": "square-meter",
    km2: "square-kilometer", "km^2": "square-kilometer",
    cm2: "square-centimeter", "cm^2": "square-centimeter",
    mm2: "square-millimeter", "mm^2": "square-millimeter",
    in2: "square-inch", "in^2": "square-inch",
    ft2: "square-foot", "ft^2": "square-foot",
    yd2: "square-yard", "yd^2": "square-yard",
    mi2: "square-mile", "mi^2": "square-mile",
    acre: "acre", hectare: "hectare", ha: "hectare",

    // volume
    l: "liter", liter: "liter", litre: "liter",
    ml: "milliliter", milliliter: "milliliter", millilitre: "milliliter",
    cl: "centiliter", centiliter: "centiliter",
    dl: "deciliter", deciliter: "deciliter",
    gal: "gallon", gallon: "gallon",
    qt: "quart", quart: "quart",
    pt: "pint", pint: "pint",
    cup: "cup",
    "fl-oz": "fluid-ounce", floz: "fluid-ounce",
    tbsp: "tablespoon", tablespoon: "tablespoon",
    tsp: "teaspoon", teaspoon: "teaspoon",

    // mass/weight
    g: "gram", gram: "gram",
    kg: "kilogram", kilogram: "kilogram",
    mg: "milligram", milligram: "milligram",
    oz: "ounce", ounce: "ounce",
    lb: "pound", pound: "pound", lbs: "pound",
    stone: "stone", st: "stone",
    ton: "ton", tonne: "tonne", t: "tonne",

    // temperature
    c: "celsius", celsius: "celsius",
    f: "fahrenheit", fahrenheit: "fahrenheit",
    k: "kelvin", kelvin: "kelvin",

    // speed/velocity
    "km/h": "kilometer-per-hour", kmh: "kilometer-per-hour", kph: "kilometer-per-hour",
    mph: "mile-per-hour", "mi/h": "mile-per-hour",
    "m/s": "meter-per-second", mps: "meter-per-second",
    "ft/s": "foot-per-second", fps: "foot-per-second",
    knot: "knot", kn: "knot",

    // duration/time
    ms: "millisecond", millisecond: "millisecond", msec: "millisecond",
    s: "second", sec: "second", second: "second",
    min: "minute", minute: "minute",
    h: "hour", hr: "hour", hour: "hour",
    day: "day", d: "day",
    week: "week", wk: "week",
    month: "month", mo: "month",
    year: "year", yr: "year", y: "year",

    // digital/data storage
    bit: "bit", b: "bit",
    byte: "byte", B: "byte",
    kilobit: "kilobit", kb: "kilobit", kbit: "kilobit",
    kilobyte: "kilobyte", kB: "kilobyte", kbyte: "kilobyte",
    megabit: "megabit", mb: "megabit", mbit: "megabit", Mb: "megabit",
    megabyte: "megabyte", MB: "megabyte", mbyte: "megabyte",
    gigabit: "gigabit", gb: "gigabit", gbit: "gigabit", Gb: "gigabit",
    gigabyte: "gigabyte", GB: "gigabyte", gbyte: "gigabyte",
    terabit: "terabit", tb: "terabit", tbit: "terabit", Tb: "terabit",
    terabyte: "terabyte", TB: "terabyte", tbyte: "terabyte",
    petabyte: "petabyte", PB: "petabyte", pbyte: "petabyte",

    // energy
    joule: "joule", j: "joule", J: "joule",
    kilojoule: "kilojoule", kj: "kilojoule", kJ: "kilojoule",
    calorie: "calorie", cal: "calorie",
    kilocalorie: "kilocalorie", kcal: "kilocalorie",
    wh: "watt-hour", Wh: "watt-hour",
    kwh: "kilowatt-hour", kWh: "kilowatt-hour",

    // power
    watt: "watt", w: "watt", W: "watt",
    kilowatt: "kilowatt", kw: "kilowatt", kW: "kilowatt",
    megawatt: "megawatt", mw: "megawatt", MW: "megawatt",
    horsepower: "horsepower", hp: "horsepower",

    // pressure
    pascal: "pascal", pa: "pascal", Pa: "pascal",
    kilopascal: "kilopascal", kpa: "kilopascal", kPa: "kilopascal",
    megapascal: "megapascal", mpa: "megapascal", MPa: "megapascal",
    bar: "bar", millibar: "millibar", mbar: "millibar",
    psi: "pound-force-per-square-inch",
    atmosphere: "atmosphere", atm: "atmosphere",

    // angle
    degree: "degree", deg: "degree", "°": "degree",
    radian: "radian", rad: "radian",
    arcmin: "arc-minute",
    arcsec: "arc-second",

    // frequency
    hertz: "hertz", hz: "hertz", Hz: "hertz",
    kilohertz: "kilohertz", khz: "kilohertz", kHz: "kilohertz",
    megahertz: "megahertz", mhz: "megahertz", MHz: "megahertz",
    gigahertz: "gigahertz", ghz: "gigahertz", GHz: "gigahertz",

    // concentration/ratio
    percent: "percent", "%": "percent", pct: "percent",
    permille: "permille", "‰": "permille",
    permyriad: "permyriad", "‱": "permyriad",
    ppm: "part-per-million",
    ppb: "part-per-billion",
    ppt: "part-per-trillion",

    // electric
    ampere: "ampere", amp: "ampere", a: "ampere", A: "ampere",
    volt: "volt", v: "volt", V: "volt",
    ohm: "ohm", "Ω": "ohm",

    // force
    newton: "newton", n: "newton", N: "newton",
    lbf: "pound-force",

    // luminous intensity
    lux: "lux", lumen: "lumen", lm: "lumen",
    candela: "candela", cd: "candela",
  };

  // Handle case-sensitive digital units first, then fallback to lowercase
  return map[unit] || map[unit.toLowerCase()] || unit;
}

export default toIntlUnit;
