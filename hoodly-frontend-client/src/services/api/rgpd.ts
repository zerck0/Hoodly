import api from '../../lib/axios'

export const rgpdApi = {
  exportData: () => api.get<unknown>('/users/me/export'),
  anonymizeData: () => api.delete<unknown>('/users/me/anonymize'),
}
