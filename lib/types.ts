export interface Reagent {
  id: string;
  name: string;
  brand?: string;
  location?: string;
  remaining: number;
  status: string;
  is_stock: boolean;
  created_at?: string;
}

export interface Protocol {
  id: string;
  title: string;
  category: string;
  source: string;
  difficulty: string;
  time_estimate: string;
  protocol_steps?: ProtocolStep[];
}

export interface ProtocolStep {
  id: string;
  protocol_id: string;
  step_number: number;
  title: string;
  description: string;
  time_estimate: string;
  reagents?: string[];
}