export interface EmergencyNumber {
  id: string;
  name: string;
  number: string;
  hint: string;
  tone: "sos" | "med" | "road" | "gold";
}

// Official Egyptian emergency numbers.
export const EMERGENCY_NUMBERS: EmergencyNumber[] = [
  { id: "ambulance", name: "الإسعاف", number: "123", hint: "حالات طبية وحوادث", tone: "sos" },
  { id: "police", name: "شرطة النجدة", number: "122", hint: "بلاغات أمنية عاجلة", tone: "med" },
  { id: "fire", name: "المطافئ", number: "180", hint: "حرائق", tone: "gold" },
  { id: "unified", name: "الطوارئ الموحّد", number: "112", hint: "من الهاتف المحمول", tone: "road" },
  { id: "traffic", name: "شرطة المرور", number: "128", hint: "حوادث وأعطال الطرق", tone: "road" },
  { id: "electric", name: "طوارئ الكهرباء", number: "121", hint: "أعطال وأسلاك مكشوفة", tone: "gold" },
  { id: "gas", name: "طوارئ الغاز", number: "129", hint: "تسريب غاز", tone: "gold" },
  { id: "tourism", name: "شرطة السياحة", number: "126", hint: "للزوار والسائحين", tone: "med" },
];

export const SOS_SITUATIONS = [
  "طوارئ عامة",
  "حادث على الطريق",
  "حالة مرضية مفاجئة",
  "أشعر بالخطر",
  "ضللت الطريق",
];
