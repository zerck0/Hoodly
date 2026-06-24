import api from '../../lib/axios'

export interface CreateDocumentDto {
  ownerId: string;
  title: string;
  fileUrl: string;
  pdfHash: string;
  type: 'justificatif' | 'contract_template' | 'signed_contract';
}

export interface DocumentResponse {
  _id: string;
  ownerId: string;
  title: string;
  fileUrl: string;
  pdfHash: string;
  type: 'justificatif' | 'contract_template' | 'signed_contract';
  status: 'pending' | 'approved' | 'archived' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export const documentsApi = {
  create: (data: CreateDocumentDto) =>
    api.post<DocumentResponse>('/documents', data),

  getMe: () =>
    api.get<DocumentResponse[]>('/documents/me'),

  getOne: (id: string) =>
    api.get<DocumentResponse>(`/documents/${id}`),

  uploadPdf: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post<{ fileUrl: string }>('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  delete: (id: string) =>
    api.delete(`/documents/${id}`),

  downloadPdf: (id: string) =>
    api.get(`/documents/${id}/pdf`, { responseType: 'blob' }),
}
