export enum ViewState {
  HOME = 'HOME',
  DOCTOR = 'DOCTOR',
  LOGIN = 'LOGIN',
  RECEPTION = 'RECEPTION'
}

export enum SurgeryType {
  CATARATA = 'Cirurgia de Catarata',
  REFRATIVA = 'Cirurgia Refrativa',
  GLAUCOMA = 'Cirurgia de Glaucoma',
  BLEFAROPLASTIA = 'Cirurgia de Blefaroplastia',
  PTERIGIO = 'Cirurgia de Pterígio',
  CALAZIO = 'Cirurgia de Calázio',
  RETINA = 'Cirurgia de Retina'
}

export type ReferralStatus = 'pending' | 'operated' | 'cancelled';

export interface Referral {
  id: string;
  patientName: string;
  surgeryType: SurgeryType | string;
  referringDoctor: string; // Médico que indicou
  insurance?: string; // Convênio (preenchido pela recepção)
  timestamp: number;
  status: ReferralStatus;
  note?: string; // Motivo se não operou
  checklist: Record<string, boolean>; // Armazena o estado de cada etapa
  checklistNotes?: Record<string, string>; // Armazena observações de cada etapa
}

export interface User {
  username: string;
  isAuthenticated: boolean;
}

// Lista de Médicos
export const DOCTORS_LIST = [
  "Dra Adriana",
  "Dra Alana Reis",
  "Dra Ana Ligia",
  "Dr Billy",
  "Dra Bruna",
  "Dra Claudia Morgado",
  "Dra Fabia Crespo",
  "Dr Frederico",
  "Dra Julia Soares",
  "Dra Katia Mello",
  "Dra Marceli",
  "Dr Marcelo",
  "Dr Márcio",
  "Dra Maria Luisa",
  "Dra Marta Alves",
  "Dr Mauro Santos",
  "Dr Rodrigo Borges",
  "Dra Simone Alves"
];

// Lista de etapas do processo cirúrgico
export const SURGERY_CHECKLIST_STEPS = [
  "Paciente contatado",
  "Consulta Dra Katia",
  "Marcação exames",
  "Consulta retorno exames",
  "Termo de consentimento",
  "Pagamento lente/material",
  "Pagamento anestesia",
  "Solicitar autor. convênio",
  "Solicitação da lente",
  "Reservar centro cirúrgico",
  "Equipe confirmado",
  "Paciente confirmado",
  "Procedimento autorizado",
  "Lente entregue ao médico",
  "Entrega de receita pré e pós op",
  "Lembrar o paciente de usar os colírios"
];