import api from '../../../services/api';

export const getAuditEvents = async (filters = {}) => {
    const params = new URLSearchParams();

    if (filters.modulo) params.append('modulo', filters.modulo);
    if (filters.accion) params.append('accion', filters.accion);
    if (filters.usuario_id) params.append('usuario_id', filters.usuario_id);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);

    const response = await api.get(`/auditoria?${params.toString()}`);
    return response.data;
};
