import api from '../../lib/axios'

export interface SignatureZone {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  assignee: 'client' | 'provider';
}

export interface CreateContractDto {
  providerId: string;
  clientId: string;
  serviceId?: string;
  eventId?: string;
  templateDocumentId: string;
  title: string;
  terms: string;
  pricePoints: number;
  signatureZones?: SignatureZone[];
}

export interface SignContractDto {
  otp: string;
  signatureImage: string;
  signatureMetadata: string;
  ipAddress?: string;
}

export interface ContractSignatureResponse {
  signed: boolean;
  signedAt?: string;
  ipAddress?: string;
  signatureMetadata?: string;
  hash?: string;
  signatureImage?: string;
}

export interface ContractResponse {
  _id: string;
  clientId: any;
  providerId: any;
  serviceId?: any;
  eventId?: any;
  title: string;
  terms: string;
  pricePoints: number;
  status: 'pending' | 'signed' | 'completed' | 'cancelled';
  templateDocumentId: any;
  signedDocumentId?: any;
  signatureZones: SignatureZone[];
  clientSignature: ContractSignatureResponse;
  providerSignature: ContractSignatureResponse;
  createdAt: string;
  updatedAt: string;
}

export const contractsApi = {
  create: (data: CreateContractDto) =>
    api.post<ContractResponse>('/contracts', data),

  getMe: () =>
    api.get<ContractResponse[]>('/contracts/me'),

  getOne: (id: string) =>
    api.get<ContractResponse>(`/contracts/${id}`),

  sendOtp: (id: string) =>
    api.post<{ message: string }>(`/contracts/${id}/send-otp`),

  sign: (id: string, data: SignContractDto) =>
    api.post<ContractResponse>(`/contracts/${id}/sign`, data),

  complete: (id: string) =>
    api.post<ContractResponse>(`/contracts/${id}/complete`),

  cancel: (id: string) =>
    api.post<ContractResponse>(`/contracts/${id}/cancel`),
}
