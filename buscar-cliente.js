export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método não permitido' });
  }
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ error: 'Token não fornecido' });
    }
    if (!/^[a-z0-9]{6,20}$/.test(token)) {
      return res.status(400).json({ error: 'Token inválido' });
    }
    const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
    const BASE_ID = 'app3Il8j8D0iBrcCI';
    const BASE_URL = `https://api.airtable.com/v0/${BASE_ID}`;
    const HEADERS = {
      'Authorization': `Bearer ${AIRTABLE_TOKEN}`,
      'Content-Type': 'application/json'
    };
    if (!AIRTABLE_TOKEN) {
      return res.status(500).json({ error: 'Erro de configuração do servidor' });
    }
    const filterFormula = encodeURIComponent(`{token}='${token}'`);
    const linksRes = await fetch(`${BASE_URL}/Links_Gerados?filterByFormula=${filterFormula}`, { headers: HEADERS });
    const linksData = await linksRes.json();
    if (!linksData.records || linksData.records.length === 0) {
      return res.status(404).json({ error: 'Token inválido ou expirado' });
    }
    const link = linksData.records[0];
    const linkId = link.id;
    const usado = link.fields.usado || false;
    if (usado) {
      return res.status(403).json({ error: 'Este link já foi utilizado' });
    }
    const clienteId = link.fields.cliente_link?.[0] || null;
    const assessmentId = link.fields.assessment_id?.[0] || null;
    let clienteName = 'Mentorado';
    let clienteEmail = '';
    if (clienteId) {
      const clienteRes = await fetch(`${BASE_URL}/Clientes/${clienteId}`, { headers: HEADERS });
      if (clienteRes.ok) {
        const clienteData = await clienteRes.json();
        clienteName = clienteData.fields.nome || 'Mentorado';
        clienteEmail = clienteData.fields.email || '';
      }
    }
    return res.status(200).json({
      success: true,
      data: {
        clienteName,
        clienteEmail,
        assessmentType: 'A1-Personalidade',
        token,
        linkId,
        clienteId: clienteId || '',
        assessmentId: assessmentId || ''
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
